from __future__ import annotations

import json
import re
import secrets
from datetime import datetime, timezone
from urllib import request as urllib_request

from sqlalchemy import create_engine, text
from sqlalchemy.engine import Engine
from sqlalchemy.orm import Session

from app.models.schemas import AiDashRecipe, AiDashRecipeRequest
from data.models import AiDashRecipe as AiDashRecipeModel
from app.core.config import IFCT_DB_PATH



LM_STUDIO_BASE = "http://127.0.0.1:1234/v1"       
CHAT_URL = f"{LM_STUDIO_BASE}/chat/completions"
DEFAULT_MODEL = "google/gemma-4-qat"
DEFAULT_TEMPERATURE = 0.2
DEFAULT_MAX_TOKENS = 2048





def _get_ifct_engine() -> Engine:
    return create_engine(
        f"sqlite:///{IFCT_DB_PATH.resolve()}",
        connect_args={"check_same_thread": False},
        future=True,
    )


_ifct_engine: Engine | None = None


def _ifct_engine_singleton() -> Engine:
    global _ifct_engine
    if _ifct_engine is None:
        _ifct_engine = _get_ifct_engine()
    return _ifct_engine


def search_food_nutrition(food_queries: list[str], top_k: int = 2) -> dict:
    """
    Execute FTS5 search on ifct_dash_foods for each query.
    Returns structured result for the LLM to consume.
    """
    engine = _ifct_engine_singleton()
    results = []

    with engine.connect() as conn:
        for query in food_queries:
            safe_query = re.sub(r"[\"*^():]", "", query.strip().lower())
            if not safe_query:
                continue


            try:
                fts_rows = conn.execute(
                    text("""
                        SELECT f.food_code, f.food_name, f.food_group_name, f.tags,
                               f.energy_kcal_per_100g, f.protein_g_per_100g,
                               f.carbs_g_per_100g, f.fat_g_per_100g,
                               f.fiber_g_per_100g, f.sat_fat_g_per_100g,
                               f.free_sugar_g_per_100g, f.calcium_mg_per_100g,
                               f.iron_mg_per_100g, f.magnesium_mg_per_100g,
                               f.potassium_mg_per_100g, f.sodium_mg_per_100g
                        FROM ifct_dash_foods_fts t
                        JOIN ifct_dash_foods f ON t.food_code = f.food_code
                        WHERE t MATCH :q
                        ORDER BY rank
                        LIMIT :k
                    """),
                    {"q": safe_query, "k": top_k},
                ).mappings().all()
            except Exception:
                fts_rows = []

            if fts_rows:
                for row in fts_rows:
                    r = dict(row)
                    results.append({
                        "query": query,
                        "status": "found",
                        "food_code": r["food_code"],
                        "food_name": r["food_name"],
                        "food_group": r["food_group_name"],
                        "tags": r["tags"],
                        "match_type": "fts5",
                        "nutrition_per_100g": {
                            "energy_kcal": round(r["energy_kcal_per_100g"] or 0, 1),
                            "protein_g": round(r["protein_g_per_100g"] or 0, 2),
                            "carbs_g": round(r["carbs_g_per_100g"] or 0, 2),
                            "fat_g": round(r["fat_g_per_100g"] or 0, 2),
                            "fiber_g": round(r["fiber_g_per_100g"] or 0, 2),
                            "sat_fat_g": round(r["sat_fat_g_per_100g"] or 0, 2),
                            "free_sugar_g": round(r["free_sugar_g_per_100g"] or 0, 2),
                            "calcium_mg": round(r["calcium_mg_per_100g"] or 0, 1),
                            "iron_mg": round(r["iron_mg_per_100g"] or 0, 2),
                            "magnesium_mg": round(r["magnesium_mg_per_100g"] or 0, 1),
                            "potassium_mg": round(r["potassium_mg_per_100g"] or 0, 1),
                            "sodium_mg": round(r["sodium_mg_per_100g"] or 0, 1),
                        },
                    })
            else:
                results.append({
                    "query": query,
                    "status": "not_found",
                    "message": f"No IFCT 2017 data found for '{query}'",
                })

    return {"source": "IFCT2017", "results": results}




TOOLS = [
    {
        "type": "function",
        "function": {
            "name": "search_food_nutrition",
            "description": (
                "Retrieve exact nutritional values from the IFCT Indian Food Composition Tables database"
                "Call this BEFORE generating a recipe "
                "whenever the user mentions specific food items. Returns energy, "
                "protein, carbs, fat, fiber, and key minerals per 100g."
            ),
            "parameters": {
                "type": "object",
                "properties": {
                    "food_queries": {
                        "type": "array",
                        "items": {"type": "string"},
                        "description": (
                            "List of individual food names to look up, e.g. "
                            "['dal', 'paneer', 'chicken']. One item per food."
                        ),
                    },
                    "top_k": {
                        "type": "integer",
                        "description": "Max matches per food item. Default 2.",
                        "default": 2,
                    },
                },
                "required": ["food_queries"],
            },
        },
    }
]




SYSTEM_PROMPT = """You are a DASH-diet nutrition-aware recipe assistant using IFCT 2017 Indian food data.

RULES:
1. Extract ALL food names from the user request
2. ALWAYS call search_food_nutrition() with those foods BEFORE writing the recipe
3. Use the returned nutritional data for calorie/macro calculations
4. If data not found for a food, disclose it and use general knowledge
5. Always mention IFCT 2017 as data source when used

OUTPUT: Return ONLY valid JSON (no markdown, no code fences) with keys:
  title, servings, prep_time_minutes, cook_time_minutes,
  ingredients (list of {item, quantity, unit}),
  steps (list of strings),
  dash_notes (list of strings),
  nutrition_summary (object with total_kcal, protein_g, carbs_g, fat_g, fiber_g per serving),
  data_sources (list: "IFCT2017" if verified, "General knowledge" if not)
"""




def _post_json(url: str, payload: dict) -> dict:
    data = json.dumps(payload).encode("utf-8")
    req = urllib_request.Request(
        url,
        data=data,
        headers={"Content-Type": "application/json"},
        method="POST",
    )
    with urllib_request.urlopen(req, timeout=90) as response:
        return json.loads(response.read().decode("utf-8"))




def _execute_tool_call(tool_name: str, arguments: dict) -> str:
    if tool_name == "search_food_nutrition":
        result = search_food_nutrition(
            food_queries=arguments.get("food_queries", []),
            top_k=arguments.get("top_k", 2),
        )
        return json.dumps(result)
    return json.dumps({"error": f"Unknown tool: {tool_name}"})




def _run_agent(messages: list[dict]) -> str:
    """
    Agentic loop:
      Turn 1 → Gemma may emit tool_calls
      Turn 2 → backend executes tools, appends results
      Turn 3 → Gemma emits final recipe JSON
    Max 3 turns to prevent runaway loops.
    """
    for turn in range(3):
        payload = {
            "model": DEFAULT_MODEL,
            "messages": messages,
            "tools": TOOLS,
            "tool_choice": "auto",
            "temperature": DEFAULT_TEMPERATURE,
            "max_tokens": DEFAULT_MAX_TOKENS,
        }

        response = _post_json(CHAT_URL, payload)
        choice = response["choices"][0]
        message = choice["message"]

        messages.append(message)

        if not message.get("tool_calls"):
            return message.get("content", "")
        for tc in message["tool_calls"]:
            fn_name = tc["function"]["name"]
            try:
                args = json.loads(tc["function"]["arguments"])
            except json.JSONDecodeError:
                args = {}

            tool_result = _execute_tool_call(fn_name, args)

            messages.append({
                "role": "tool",
                "tool_call_id": tc["id"],
                "name": fn_name,
                "content": tool_result,
            })

    return messages[-1].get("content", "")



def _extract_recipe(raw: str) -> AiDashRecipe:
    content = raw.strip()

    if content.startswith("```"):
        content = re.sub(r"^```(?:json)?", "", content).strip()
        content = re.sub(r"```$", "", content).strip()

    start = content.find("{")
    if start == -1:
        raise ValueError("Model response missing JSON object")

    try:
        recipe_data, _ = json.JSONDecoder().raw_decode(content[start:])
    except json.JSONDecodeError as exc:
        raise ValueError("Model response was not valid JSON") from exc

    return AiDashRecipe(**recipe_data)




def generate_dash_recipe(payload: AiDashRecipeRequest) -> tuple[AiDashRecipe, dict]:
    user_message = {
        "role": "user",
        "content": json.dumps({
            "meal_type": payload.meal_type,
            "diet_pref": payload.diet_pref,
            "available_items": payload.available_items,
            "health_constraints": payload.health_constraints,
            "allergies": payload.allergies,
            "cuisine": payload.cuisine,
            "time_minutes": payload.time_minutes,
            "servings": payload.servings,
            "notes": payload.notes,
        }),
    }

    messages = [
        {"role": "system", "content": SYSTEM_PROMPT},
        user_message,
    ]

    raw_output = _run_agent(messages)
    recipe = _extract_recipe(raw_output)

    prompt_bundle = {
        "messages": messages,
        "raw_output": raw_output,
    }

    return recipe, prompt_bundle


def save_dash_recipe(
    user_id: str,
    payload: AiDashRecipeRequest,
    recipe: AiDashRecipe,
    prompt_bundle: dict,
    db: Session,
) -> AiDashRecipeModel:
    record = AiDashRecipeModel(
        id=secrets.token_hex(8),
        user_id=user_id,
        meal_type=payload.meal_type,
        diet_pref=payload.diet_pref,
        request_json={"request": payload.model_dump(), "prompt": prompt_bundle},
        result_json=recipe.model_dump(),
        created_at=datetime.now(timezone.utc),
    )
    db.add(record)
    db.commit()
    db.refresh(record)
    return record
