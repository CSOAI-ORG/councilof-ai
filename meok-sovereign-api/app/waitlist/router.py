from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session, select
from app.database import get_session
from app.models import WaitlistEntry, WaitlistCreate

router = APIRouter(prefix="/waitlist", tags=["waitlist"])


@router.post("/join")
def join_waitlist(data: WaitlistCreate, session: Session = Depends(get_session)):
    existing = session.exec(select(WaitlistEntry).where(WaitlistEntry.email == data.email)).first()
    if existing:
        return {"message": "You are already on the list", "status": "existing"}
    entry = WaitlistEntry(email=data.email, referrer=data.referrer)
    session.add(entry)
    session.commit()
    return {"message": "You are on the list", "status": "new"}
