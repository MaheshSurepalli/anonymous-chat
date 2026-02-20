from datetime import datetime, timedelta, timezone
from typing import List, Optional
import logging

from sqlalchemy import create_engine, MetaData, Table, Column, String, Integer, DateTime, delete, select, update, text, func
from sqlalchemy.pool import StaticPool, NullPool
from .settings import settings

logger = logging.getLogger("uvicorn.error")

# Build engine kwargs based on dialect
_is_sqlite = settings.DATABASE_URL.startswith("sqlite")
_engine_kwargs = {
    "pool_pre_ping": True,
}
if _is_sqlite:
    _engine_kwargs["connect_args"] = {"check_same_thread": False}
    _engine_kwargs["poolclass"] = StaticPool
else:
    _engine_kwargs["poolclass"] = NullPool

engine = create_engine(settings.DATABASE_URL, **_engine_kwargs)

metadata = MetaData()

push_tokens = Table(
    "push_tokens",
    metadata,
    Column("token", String, primary_key=True),
    Column("user_id", String, nullable=True),
    Column("device_name", String, nullable=True),
    Column("push_count", Integer, server_default=text("0")),
    Column("last_sent_at", DateTime, nullable=True),
    Column("created_at", DateTime, server_default=func.now()),
)
IST = timezone(timedelta(hours=5, minutes=30))

def _now_ist() -> datetime:
    return datetime.now(IST)


def init_db():
    """Create tables if they don't exist. Works for both SQLite and PostgreSQL."""
    try:
        with engine.connect() as conn:
            conn.execute(text("SELECT 1"))
        logger.info(f"✅ Database connected ({engine.dialect.name}) — {engine.url.database}")
        metadata.create_all(engine)
        logger.info("✅ Tables ready")
    except Exception as e:
        logger.error(f"❌ Database connection failed: {e}")
        raise


def add_token(user_id: str, token: str, device_name: Optional[str] = None):
    now = _now_ist()
    with engine.begin() as conn:
        if engine.dialect.name == "sqlite":
            conn.execute(text("""
                INSERT INTO push_tokens (token, user_id, device_name, last_sent_at, created_at)
                VALUES (:token, :user_id, :device_name, NULL, :now)
                ON CONFLICT(token) DO UPDATE SET user_id=:user_id, device_name=:device_name
            """), {"token": token, "user_id": user_id, "device_name": device_name, "now": now})
        else:
            from sqlalchemy.dialects.postgresql import insert as pg_insert
            stmt = pg_insert(push_tokens).values(
                token=token, user_id=user_id, device_name=device_name,
                last_sent_at=None, created_at=now,
            ).on_conflict_do_update(
                index_elements=["token"],
                set_={"user_id": user_id, "device_name": device_name},
            )
            conn.execute(stmt)


def delete_token(token: str):
    with engine.begin() as conn:
        conn.execute(delete(push_tokens).where(push_tokens.c.token == token))


def get_eligible_tokens(limit: int = 100, cooldown_hours: int = 1, exclude_user_ids: List[str] = None) -> List[str]:
    cutoff = _now_ist() - timedelta(hours=cooldown_hours)

    # Tokens are eligible if never sent (NULL) or sent before the cutoff
    query = select(push_tokens.c.token).where(
        (push_tokens.c.last_sent_at == None) | (push_tokens.c.last_sent_at < cutoff)  # noqa: E711
    )

    if exclude_user_ids:
        query = query.where(push_tokens.c.user_id.notin_(exclude_user_ids))

    query = query.limit(limit)

    with engine.connect() as conn:
        rows = conn.execute(query).fetchall()
    return [row[0] for row in rows]


def update_last_sent(tokens: List[str]):
    if not tokens:
        return
    now = _now_ist()
    with engine.begin() as conn:
        conn.execute(
            update(push_tokens)
            .where(push_tokens.c.token.in_(tokens))
            .values(last_sent_at=now, push_count=push_tokens.c.push_count + 1)
        )
