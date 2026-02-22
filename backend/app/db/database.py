from datetime import datetime, timedelta, timezone
from typing import List, Optional
import logging

from sqlalchemy import (
    create_engine, MetaData, Table, Column, String, Integer,
    DateTime, delete, select, update, text, func, case
)
from sqlalchemy.pool import StaticPool, NullPool

from app.settings import settings

logger = logging.getLogger("uvicorn.error")

# ──────────────────────────────────────────────
# Engine setup
# ──────────────────────────────────────────────

_is_sqlite = settings.DATABASE_URL.startswith("sqlite")
_engine_kwargs: dict = {"pool_pre_ping": True}

if _is_sqlite:
    _engine_kwargs["connect_args"] = {"check_same_thread": False}
    _engine_kwargs["poolclass"] = StaticPool
else:
    _engine_kwargs["poolclass"] = NullPool

engine = create_engine(settings.DATABASE_URL, **_engine_kwargs)

metadata = MetaData()

# ──────────────────────────────────────────────
# Table definitions
# ──────────────────────────────────────────────

push_tokens = Table(
    "push_tokens",
    metadata,
    Column("token", String, primary_key=True),
    Column("user_id", String, nullable=True),
    Column("device_name", String, nullable=True),
    Column("push_count", Integer, server_default=text("0")),
    Column("app_opens_total", Integer, server_default=text("0")),
    Column("app_opens_today", Integer, server_default=text("0")),
    Column("last_opened_at", DateTime(timezone=True), nullable=True),
    Column("last_sent_at", DateTime(timezone=True), nullable=True),
    Column("created_at", DateTime(timezone=True), server_default=func.now()),
)

# UTC helper
def _now_utc() -> datetime:
    return datetime.now(timezone.utc)

# IST helper
IST = timezone(timedelta(hours=5, minutes=30))

def _ist_today_start_utc() -> datetime:
    """Return the exact UTC equivalent of midnight today in IST."""
    now_ist = datetime.now(IST)
    today_start_ist = now_ist.replace(hour=0, minute=0, second=0, microsecond=0)
    return today_start_ist.astimezone(timezone.utc)


# ──────────────────────────────────────────────
# DB lifecycle
# ──────────────────────────────────────────────

def init_db() -> None:
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


# ──────────────────────────────────────────────
# Token CRUD
# ──────────────────────────────────────────────

def add_token(user_id: str, token: str, device_name: Optional[str] = None) -> None:
    now = _now_utc()
    today_start = _ist_today_start_utc()
    
    with engine.begin() as conn:
        if engine.dialect.name == "sqlite":
            conn.execute(
                text("""
                    INSERT INTO push_tokens (
                        token, user_id, device_name,
                        app_opens_total, app_opens_today, last_opened_at,
                        last_sent_at, created_at
                    )
                    VALUES (:token, :user_id, :device_name, 1, 1, :now, NULL, :now)
                    ON CONFLICT(token) DO UPDATE SET
                        user_id = :user_id,
                        device_name = :device_name,
                        app_opens_total = push_tokens.app_opens_total + 1,
                        app_opens_today = CASE
                            WHEN push_tokens.last_opened_at >= :today_start THEN push_tokens.app_opens_today + 1
                            ELSE 1
                        END,
                        last_opened_at = :now
                """),
                {
                    "token": token, 
                    "user_id": user_id, 
                    "device_name": device_name, 
                    "now": now,
                    "today_start": today_start
                },
            )
        else:
            from sqlalchemy.dialects.postgresql import insert as pg_insert

            stmt = pg_insert(push_tokens).values(
                token=token,
                user_id=user_id,
                device_name=device_name,
                app_opens_total=1,
                app_opens_today=1,
                last_opened_at=now,
                last_sent_at=None,
                created_at=now,
            )
            
            # The EXCLUDED table represents the row proposed for insertion
            update_stmt = stmt.on_conflict_do_update(
                index_elements=["token"],
                set_={
                    "user_id": stmt.excluded.user_id,
                    "device_name": stmt.excluded.device_name,
                    "app_opens_total": push_tokens.c.app_opens_total + 1,
                    "app_opens_today": case(
                        (push_tokens.c.last_opened_at >= today_start, push_tokens.c.app_opens_today + 1),
                        else_=1
                    ),
                    "last_opened_at": stmt.excluded.last_opened_at
                },
            )
            conn.execute(update_stmt)


def delete_token(token: str) -> None:
    try:
        with engine.begin() as conn:
            conn.execute(delete(push_tokens).where(push_tokens.c.token == token))
        logger.info(f"✅ Successfully deleted invalid token from database: {token}")
    except Exception as e:
        logger.error(f"❌ Failed to delete token {token} from database: {e}")


def get_eligible_tokens(
    limit: int = 100,
    cooldown_minutes: int = 30,
    exclude_user_ids: Optional[List[str]] = None,
) -> List[str]:
    """Return tokens that haven't been notified within the cooldown window."""
    cutoff = _now_utc() - timedelta(minutes=cooldown_minutes)

    query = select(push_tokens.c.token).where(
        (push_tokens.c.last_sent_at == None)  # noqa: E711
        | (push_tokens.c.last_sent_at < cutoff)
    )

    if exclude_user_ids:
        query = query.where(push_tokens.c.user_id.notin_(exclude_user_ids))

    query = query.limit(limit)

    with engine.connect() as conn:
        rows = conn.execute(query).fetchall()
    return [row[0] for row in rows]


def update_last_sent(tokens: List[str]) -> None:
    if not tokens:
        return
    now = _now_utc()
    with engine.begin() as conn:
        conn.execute(
            update(push_tokens)
            .where(push_tokens.c.token.in_(tokens))
            .values(last_sent_at=now, push_count=push_tokens.c.push_count + 1)
        )


# ──────────────────────────────────────────────
# Stats
# ──────────────────────────────────────────────

def get_token_stats() -> dict:
    """Return total registered token count and how many were created today (IST), plus app opens."""
    today_start = _ist_today_start_utc()

    with engine.connect() as conn:
        total_users: int = conn.execute(
            select(func.count()).select_from(push_tokens)
        ).scalar() or 0

        new_users_today: int = conn.execute(
            select(func.count())
            .select_from(push_tokens)
            .where(push_tokens.c.created_at >= today_start)
        ).scalar() or 0
        
        # Calculate engagement metrics
        app_opens_today: int = conn.execute(
            select(func.sum(push_tokens.c.app_opens_today))
            .where(push_tokens.c.last_opened_at >= today_start)
        ).scalar() or 0
        
        app_opens_multi_day_today: int = conn.execute(
            select(func.count())
            .where(push_tokens.c.last_opened_at >= today_start)
        ).scalar() or 0
        
        app_opens_total_all_time: int = conn.execute(
            select(func.sum(push_tokens.c.app_opens_total))
        ).scalar() or 0

    return {
        "users_total": total_users,
        "new_users_today": new_users_today,
        "active_users_today": app_opens_multi_day_today,
        "app_opens_today": app_opens_today,
        "app_opens_all_time": app_opens_total_all_time,
    }
