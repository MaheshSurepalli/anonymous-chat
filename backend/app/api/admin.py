from fastapi import APIRouter
from sqlalchemy import select, delete

from app.db import database
from app.db.database import engine, push_tokens

router = APIRouter(tags=["admin"])


@router.get("/health")
async def health():
    return {"status": "ok"}


@router.get("/admin/tokens")
async def list_tokens():
    """List all registered push tokens."""
    with engine.connect() as conn:
        rows = conn.execute(select(push_tokens)).fetchall()
    return [dict(r._mapping) for r in rows]


@router.get("/admin/tokens/stats")
async def token_stats():
    """
    Return the count of registered push notification devices.

    - **total**: all-time registered token count
    - **today**: tokens registered today (IST)
    """
    return database.get_token_stats()


@router.delete("/admin/tokens/{token}")
async def delete_single_token(token: str):
    """Delete a specific push token."""
    database.delete_token(token)
    return {"status": "deleted", "token": token}


@router.delete("/admin/tokens")
async def delete_all_tokens():
    """Delete all push tokens."""
    with engine.begin() as conn:
        result = conn.execute(delete(push_tokens))
    return {"status": "deleted", "count": result.rowcount}
