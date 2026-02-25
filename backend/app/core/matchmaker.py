import asyncio
import json
import time
import uuid
import logging
from collections import deque
from typing import Dict

from fastapi import WebSocket

from app.models.schemas import (
    Paired, Partner, QueueSize, ServerMessage, ServerTyping, System,
)
from app.models.types import Room, UserConn
from app.core.push_service import push_service
from app.db import database

logger = logging.getLogger("uvicorn.error")


class Matchmaker:
    def __init__(self) -> None:
        self.users: Dict[str, UserConn] = {}
        self.waiting: deque[str] = deque()
        self.rooms: Dict[str, Room] = {}
        self.lock = asyncio.Lock()
        self.previous_wait_count = 0

    async def register(self, user_id: str, ws: WebSocket, avatar: str) -> None:
        self.users[user_id] = {"id": user_id, "ws": ws, "avatar": avatar, "disconnect_task": None}

    async def join_queue(self, user_id: str) -> None:
        async with self.lock:
            if user_id not in self.waiting and not self.users.get(user_id, {}).get("room_id"):
                self.waiting.append(user_id)

                current_count = len(self.waiting)
                if current_count >= 1:
                    logger.info(f"Liquidity event detected: {current_count} in queue. Triggering notifications.")
                    await self._trigger_notifications(current_count)

                self.previous_wait_count = current_count
                await self._broadcast_queue_size()
            await self._try_pair()

    async def handle_reconnect(self, user_id: str, ws: WebSocket) -> bool:
        async with self.lock:
            user = self.users.get(user_id)
            if not user:
                return False
                
            room_id = user.get("room_id")
            if not room_id:
                return False

            # Cancel the teardown task if it's running
            task = user.get("disconnect_task")
            if task and not task.done():
                task.cancel()
            user["disconnect_task"] = None
            
            # Update websocket
            user["ws"] = ws
            logger.info(f"[WS] {user_id} successfully reconnected to room {room_id}.")
            return True

    async def handle_next(self, user_id: str) -> None:
        async with self.lock:
            room_id = self.users.get(user_id, {}).get("room_id")
            if not room_id:
                return
            room = self.rooms.get(room_id)
            if not room:
                return
            clicker = room["u1"] if room["u1"] == user_id else room["u2"]
            await self._teardown_room(room_id, leaver=clicker, partner_idle=True)
            await self._send_system(clicker, code="searching", message="Searching for the next stranger…")
            if clicker not in self.waiting:
                self.waiting.append(clicker)
            await self._broadcast_queue_size()
            await self._try_pair()

    async def remove_user(self, user_id: str, is_disconnect: bool = True) -> None:
        async with self.lock:
            try:
                self.waiting.remove(user_id)
            except ValueError:
                pass
            
            user = self.users.get(user_id)
            if not user:
                return

            room_id = user.get("room_id")
            if room_id:
                if is_disconnect:
                    # User is in a room. Give them a 30s grace period to reconnect.
                    if not user.get("disconnect_task"):
                        logger.info(f"[WS] {user_id} disconnected while in room {room_id}. Starting 30s grace period.")
                        user["disconnect_task"] = asyncio.create_task(self._delayed_teardown(user_id, room_id))
                else:
                    # User explicitly left the room, tear down immediately.
                    await self._teardown_room(room_id, leaver=user_id, partner_idle=True)
                    self.users.pop(user_id, None)
                    await self._broadcast_queue_size()
            else:
                # User not in a room, remove immediately.
                self.users.pop(user_id, None)
                await self._broadcast_queue_size()

    async def relay_message(self, sender_id: str, room: str, text: str, sent_at: int) -> None:
        r = self.rooms.get(room)
        if not r:
            return
        evt = ServerMessage(room=room, text=text, sentAt=sent_at).model_dump()
        await asyncio.gather(*[self._safe_send(uid, evt) for uid in (r["u1"], r["u2"])])

    async def relay_typing(self, sender_id: str, room: str, is_typing: bool) -> None:
        r = self.rooms.get(room)
        if not r:
            return
        other = r["u2"] if r["u1"] == sender_id else r["u1"]
        evt = ServerTyping(room=room, isTyping=is_typing).model_dump()
        await self._safe_send(other, evt)

    # ─── private ────────────────────────────────────────────────────────────

    async def _trigger_notifications(self, pool_size: int) -> None:
        connected_users = list(self.users.keys())
        # 30-minute cooldown: each device gets at most 1 push per 30 minutes
        eligible_tokens = database.get_eligible_tokens(
            limit=100, cooldown_minutes=30, exclude_user_ids=connected_users
        )
        logger.info(f"Found {len(eligible_tokens)} eligible tokens for push (active users: {len(connected_users)})")
        if eligible_tokens:
            asyncio.create_task(push_service.send_push_notifications(eligible_tokens, pool_size))

    async def _delayed_teardown(self, user_id: str, room_id: str) -> None:
        """Wait 30 seconds before tearing down the room."""
        try:
            await asyncio.sleep(30)
            async with self.lock:
                logger.info(f"[WS] 30s grace period ended for {user_id} in room {room_id}. Tearing down.")
                user = self.users.get(user_id)
                # If the task completed and wasn't cancelled, we do the teardown.
                if user and user.get("room_id") == room_id:
                    await self._teardown_room(room_id, leaver=user_id, partner_idle=True)
                self.users.pop(user_id, None)
        except asyncio.CancelledError:
            logger.info(f"[WS] Reconnected {user_id} before grace period ended.")

    async def _teardown_room(self, room_id: str, leaver: str | None, partner_idle: bool) -> None:
        room = self.rooms.pop(room_id, None)
        if not room:
            return
        for uid in (room["u1"], room["u2"]):
            if uid in self.users:
                self.users[uid]["room_id"] = None
        if leaver is not None:
            other = room["u2"] if room["u1"] == leaver else room["u1"]
            if partner_idle:
                await self._send_system(other, code="idle", message="Partner left.")

    async def _try_pair(self) -> None:
        while len(self.waiting) >= 2:
            u1 = self.waiting.popleft()
            if u1 not in self.users:
                continue
            u2 = None
            while self.waiting and not u2:
                candidate = self.waiting.popleft()
                if candidate in self.users:
                    u2 = candidate
            if not u2:
                self.waiting.appendleft(u1)
                break
            room_id = uuid.uuid4().hex
            now = int(time.time() * 1000)
            self.rooms[room_id] = {"id": room_id, "u1": u1, "u2": u2, "created_at": now}
            self.users[u1]["room_id"] = room_id
            self.users[u2]["room_id"] = room_id
            await self._send_paired(u1, partner_id=u2, room_id=room_id, started_at=now)
            await self._send_paired(u2, partner_id=u1, room_id=room_id, started_at=now)
            await self._broadcast_queue_size()

    async def _broadcast_queue_size(self) -> None:
        evt = QueueSize(count=len(self.waiting)).model_dump()
        await asyncio.gather(*[self._safe_send(uid, evt) for uid in list(self.users.keys())])

    async def _send_paired(self, uid: str, partner_id: str, room_id: str, started_at: int) -> None:
        partner = self.users.get(partner_id)
        if not partner:
            return
        evt = Paired(
            room=room_id,
            partner=Partner(id=partner_id, avatar=partner["avatar"]),
            startedAt=started_at,
        )
        await self._safe_send(uid, evt.model_dump())

    async def _send_system(self, uid: str, code: str, message: str) -> None:
        await self._safe_send(uid, System(code=code, message=message).model_dump())

    async def _safe_send(self, uid: str, payload: dict) -> None:
        user = self.users.get(uid)
        if not user:
            return
        try:
            await user["ws"].send_text(json.dumps(payload))
        except Exception:
            pass
