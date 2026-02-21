from pydantic import BaseModel, Field

# ──────────────────────────────────────────────
# Client → Server events
# ──────────────────────────────────────────────

class JoinQueue(BaseModel):
    type: str = Field("join_queue", frozen=True)
    userId: str
    avatar: str

class ClientMessage(BaseModel):
    type: str = Field("message", frozen=True)
    room: str
    text: str
    sentAt: int

class Typing(BaseModel):
    type: str = Field("typing", frozen=True)
    room: str
    isTyping: bool

class Next(BaseModel):
    type: str = Field("next", frozen=True)

class Leave(BaseModel):
    type: str = Field("leave", frozen=True)

ClientEvent = JoinQueue | ClientMessage | Typing | Next | Leave

# ──────────────────────────────────────────────
# Server → Client events
# ──────────────────────────────────────────────

class Partner(BaseModel):
    id: str
    avatar: str

class Paired(BaseModel):
    type: str = Field("paired", frozen=True)
    room: str
    partner: Partner
    startedAt: int

class ServerMessage(BaseModel):
    type: str = Field("message", frozen=True)
    room: str
    text: str
    sentAt: int

class ServerTyping(BaseModel):
    type: str = Field("typing", frozen=True)
    room: str
    isTyping: bool

class System(BaseModel):
    type: str = Field("system", frozen=True)
    code: str  # "idle" | "searching"
    message: str

class QueueSize(BaseModel):
    type: str = Field("queue_size", frozen=True)
    count: int

class ErrorEvt(BaseModel):
    type: str = Field("error", frozen=True)
    message: str

ServerEvent = Paired | ServerMessage | ServerTyping | System | QueueSize | ErrorEvt
