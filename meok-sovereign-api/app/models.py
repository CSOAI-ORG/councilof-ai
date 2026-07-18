from datetime import datetime
from typing import Optional, List
from sqlmodel import SQLModel, Field, Relationship


# ─── Users ────────────────────────────────────────────────────
class UserBase(SQLModel):
    email: str = Field(unique=True, index=True)
    name: Optional[str] = None
    is_active: bool = True
    is_pro: bool = False
    created_at: datetime = Field(default_factory=datetime.utcnow)


class User(UserBase, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    hashed_password: str
    characters: List["Character"] = Relationship(back_populates="user")
    memories: List["Memory"] = Relationship(back_populates="user")


class UserCreate(SQLModel):
    email: str
    password: str
    name: Optional[str] = None


class UserPublic(UserBase):
    id: int


class UserLogin(SQLModel):
    email: str
    password: str


# ─── Characters ───────────────────────────────────────────────
class CharacterBase(SQLModel):
    name: str = "My MEOK"
    evolution_stage: str = "egg"  # egg, pulse, fracture, sovereign
    dominant_archetype: Optional[str] = None
    experience_points: int = 0
    created_at: datetime = Field(default_factory=datetime.utcnow)


class Character(CharacterBase, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    user_id: int = Field(foreign_key="user.id")
    user: User = Relationship(back_populates="characters")
    traits: List["Trait"] = Relationship(back_populates="character")


class CharacterCreate(SQLModel):
    name: str = "My MEOK"


class CharacterPublic(CharacterBase):
    id: int
    user_id: int


# ─── Traits ───────────────────────────────────────────────────
class Trait(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    character_id: int = Field(foreign_key="character.id")
    name: str
    value: int = 50  # 0-100
    character: Character = Relationship(back_populates="traits")


# ─── Memories ─────────────────────────────────────────────────
class MemoryBase(SQLModel):
    content: str
    category: str = "general"  # general, gaming, work, conversation
    sentiment: Optional[float] = None  # -1.0 to 1.0
    created_at: datetime = Field(default_factory=datetime.utcnow)


class Memory(MemoryBase, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    user_id: int = Field(foreign_key="user.id")
    user: User = Relationship(back_populates="memories")


class MemoryCreate(SQLModel):
    content: str
    category: str = "general"


class MemoryPublic(MemoryBase):
    id: int
    user_id: int


# ─── Waitlist ─────────────────────────────────────────────────
class WaitlistEntry(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    email: str = Field(unique=True, index=True)
    referrer: Optional[str] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)


class WaitlistCreate(SQLModel):
    email: str
    referrer: Optional[str] = None


# ─── LLM Provider Status ──────────────────────────────────────
class LLMProvider(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    name: str = Field(unique=True)
    api_base: str
    is_available: bool = True
    priority: int = 100
    last_checked: Optional[datetime] = None
