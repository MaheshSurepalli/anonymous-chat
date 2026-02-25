from typing import TypedDict, Optional

class UserConn(TypedDict, total=False):
    id: str
    ws: any
    avatar: str
    room_id: Optional[str]
    disconnect_task: Optional[any]

class Room(TypedDict):
    id: str
    u1: str
    u2: str
    created_at: int
