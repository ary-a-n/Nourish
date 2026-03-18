from pydantic import BaseModel, EmailStr
from datetime import date
from typing import List, Dict


# -------- AUTH --------
class UserCreate(BaseModel):
    email: EmailStr
    password: str
    age: int
    weight: float
    height: float
    smoking: bool
    alcohol: bool


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class Token(BaseModel):
    access_token: str
    token_type: str


# -------- HEALTH --------
class DailyInput(BaseModel):
    systolic_bp: int
    diastolic_bp: int
    date: date


class FoodItem(BaseModel):
    name: str
    nutrients: Dict[str, float]


class DailyRecommendationResponse(BaseModel):
    date: date
    bp_category: str
    bmi: float
    recommended_foods: List[FoodItem]