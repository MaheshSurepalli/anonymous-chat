import asyncio
import httpx
import logging
from typing import List, Any, Dict

from app.db import database

logger = logging.getLogger("uvicorn.error")

EXPO_PUSH_API_URL = "https://exp.host/--/api/v2/push/send"


class PushService:
    async def send_push_notifications(self, tokens: List[str], pool_size: int) -> None:
        if not tokens:
            return

        message_body = (
            f"🔥 {pool_size} people are waiting to chat!"
            if pool_size > 1
            else "🔥 someone is waiting to chat!"
        )

        messages = []
        for token in tokens:
            if not token.startswith("ExponentPushToken") and not token.startswith("ExpoPushToken"):
                continue
            messages.append({
                "to": token,
                "sound": "default",
                "title": "Stranger Chat",
                "body": message_body,
                "priority": "high",          # FCM high-priority → heads-up on Android / immediate on iOS
                "channelId": "default",      # matches AndroidImportance.MAX channel in the app
                "data": {"pool_size": pool_size},
            })

        if not messages:
            return

        # Expo recommends batches of 100; production should chunk this list.
        async with httpx.AsyncClient() as client:
            try:
                response = await client.post(
                    EXPO_PUSH_API_URL,
                    json=messages,
                    headers={
                        "Accept": "application/json",
                        "Accept-Encoding": "gzip, deflate",
                        "Content-Type": "application/json",
                    },
                )
                response.raise_for_status()
                await self._handle_expo_response(response.json(), tokens)
            except Exception as e:
                logger.error(f"Failed to send push notifications: {e}")

    async def _handle_expo_response(self, data: Dict[str, Any], tokens: List[str]) -> None:
        tickets = data.get("data", [])
        successful_tokens: List[str] = []
        invalid_tokens: List[str] = []

        for i, ticket in enumerate(tickets):
            status = ticket.get("status")
            if status == "ok":
                successful_tokens.append(tokens[i])
                logger.info(f"push_sent: {tokens[i]}")
            elif status == "error":
                details = ticket.get("details", {})
                error_code = details.get("error")
                logger.error(f"push_failed: {tokens[i]} - {error_code}")
                if error_code == "DeviceNotRegistered":
                    invalid_tokens.append(tokens[i])

        if successful_tokens:
            database.update_last_sent(successful_tokens)

        for token in invalid_tokens:
            logger.info(f"Removing invalid token: {token}")
            database.delete_token(token)


push_service = PushService()
