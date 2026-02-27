from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.settings import settings
from app.db import database
from app.api import admin, ws

app = FastAPI(title="Stranger Chat Backend")

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.ALLOW_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
async def startup_event():
    database.init_db()


# ── Routers ────────────────────────────────────────────────────────────────
app.include_router(admin.router)
app.include_router(ws.router)