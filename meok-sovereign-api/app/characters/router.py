from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session, select
from app.database import get_session
from app.models import Character, CharacterCreate, CharacterPublic, Trait
from app.auth.router import get_current_user, User

router = APIRouter(prefix="/characters", tags=["characters"])


@router.get("/", response_model=list[CharacterPublic])
def list_characters(current_user: User = Depends(get_current_user), session: Session = Depends(get_session)):
    return session.exec(select(Character).where(Character.user_id == current_user.id)).all()


@router.post("/", response_model=CharacterPublic)
def create_character(data: CharacterCreate, current_user: User = Depends(get_current_user), session: Session = Depends(get_session)):
    char = Character(name=data.name, user_id=current_user.id)
    session.add(char)
    session.commit()
    session.refresh(char)
    # Seed default traits
    for trait_name in ["presence", "memory", "growth", "protection", "partnership", "culture", "sovereignty"]:
        session.add(Trait(character_id=char.id, name=trait_name, value=50))
    session.commit()
    return char


@router.get("/{character_id}", response_model=CharacterPublic)
def get_character(character_id: int, current_user: User = Depends(get_current_user), session: Session = Depends(get_session)):
    char = session.exec(select(Character).where(Character.id == character_id, Character.user_id == current_user.id)).first()
    if not char:
        raise HTTPException(status_code=404, detail="Character not found")
    return char
