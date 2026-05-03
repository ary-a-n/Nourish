import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.routes import router
from app.services.data_loader import load_recipes
from data.db import init_db

logger = logging.getLogger("nourish")


@asynccontextmanager
async def _lifespan(_: FastAPI):
    init_db()
    try:
        load_recipes()
    except Exception:
        logger.exception("Recipe preload failed")
        raise
    yield


app = FastAPI(title="Nourish Clinical Engine", version="1.0.0", lifespan=_lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(router)
