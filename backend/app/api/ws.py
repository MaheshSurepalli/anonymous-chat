import json

from fastapi import APIRouter, WebSocket, WebSocketDisconnect

from app.core.matchmaker import Matchmaker
from app.models.schemas import ErrorEvt
from app.db import database

router = APIRouter(tags=["websocket"])

# Single shared matchmaker instance for the lifetime of the process
mm = Matchmaker()


@router.websocket("/ws")
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

            elif t == "reconnect":
                user_id = data.get("userId")
                if not user_id:
                    await ws.send_text(json.dumps(ErrorEvt(message="Missing userId").model_dump()))
                    continue
                    
                success = await mm.handle_reconnect(user_id, ws)
                if success:
                    await ws.send_text(json.dumps({"type": "system", "code": "reconnected", "message": "Restored"}))
                else:
                    await ws.send_text(json.dumps({"type": "system", "code": "idle", "message": "Session expired"}))

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
                if user_id:
                    await mm.remove_user(user_id, is_disconnect=False)

            else:
                await ws.send_text(json.dumps(ErrorEvt(message="Unknown type").model_dump()))

    except WebSocketDisconnect:
        if user_id:
            await mm.remove_user(user_id)
