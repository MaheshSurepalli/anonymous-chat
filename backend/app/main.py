import json
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware

from .matchmaker import Matchmaker
from .schemas import ClientEvent, ErrorEvt
from .settings import settings
from . import database

app = FastAPI(title="Stranger Chat Backend")
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.ALLOW_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

mm = Matchmaker()

@app.on_event("startup")
async def startup_event():
    database.init_db()

@app.get("/health")
async def health():
    return {"status": "ok"}

@app.get("/admin/tokens")
async def admin_tokens():
    """View all registered push tokens (for debugging)."""
    from .database import engine, push_tokens
    from sqlalchemy import select
    with engine.connect() as conn:
        rows = conn.execute(select(push_tokens)).fetchall()
    return [dict(r._mapping) for r in rows]

@app.websocket("/ws")
async def ws_endpoint(ws: WebSocket):
    await ws.accept()
    user_id: str | None = None
    avatar: str | None = None
    try:
        while True:
            raw = await ws.receive_text()
            try:
                data = json.loads(raw)
            except Exception:
                await ws.send_text(json.dumps(ErrorEvt(message="Invalid JSON").model_dump()))
                continue
            t = data.get("type")
            if t == "join_queue":
                user_id = data.get("userId")
                avatar = data.get("avatar")
                if not user_id or not avatar:
                    await ws.send_text(json.dumps(ErrorEvt(message="Missing userId/avatar").model_dump()))
                    continue
                await mm.register(user_id, ws, avatar)
                await mm.join_queue(user_id)
            elif t == "register_push":
                token = data.get("token")
                p_user_id = data.get("userId") or user_id
                device_name = data.get("deviceName")
                
                if p_user_id and token:
                    database.add_token(p_user_id, token, device_name=device_name)
            elif t == "message":
                if not user_id:
                    await ws.send_text(json.dumps(ErrorEvt(message="Not joined").model_dump()))
                    continue
                await mm.relay_message(user_id, data.get("room"), data.get("text"), data.get("sentAt"))
            elif t == "typing":
                if not user_id:
                    await ws.send_text(json.dumps(ErrorEvt(message="Not joined").model_dump()))
                    continue
                await mm.relay_typing(user_id, data.get("room"), data.get("isTyping", False))
            elif t == "next":
                if user_id:
                    await mm.handle_next(user_id)
            elif t == "leave":
                # immediate idle response handled inside remove_user/teardown
                if user_id:
                    await mm.remove_user(user_id)
            else:
                await ws.send_text(json.dumps(ErrorEvt(message="Unknown type").model_dump()))
    except WebSocketDisconnect:
        if user_id:
            await mm.remove_user(user_id)