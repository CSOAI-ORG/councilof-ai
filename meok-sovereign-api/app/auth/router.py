from fastapi import APIRouter, Depends, HTTPException, Request, Response, status
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from sqlmodel import Session, select
from app.database import get_session
from app.models import User, UserCreate, UserPublic, UserLogin
from app.auth.security import verify_password, get_password_hash, create_access_token, decode_token

router = APIRouter(prefix="/auth", tags=["auth"])
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="auth/login", auto_error=False)

COOKIE_NAME = "meok_token"
COOKIE_MAX_AGE = 60 * 60 * 24 * 7  # 7 days


async def get_current_user(
    request: Request,
    token: str = Depends(oauth2_scheme),
    session: Session = Depends(get_session),
) -> User:
    # Try header first, then cookie
    effective_token = token
    if not effective_token:
        effective_token = request.cookies.get(COOKIE_NAME)
    if not effective_token:
        raise HTTPException(status_code=401, detail="Not authenticated")

    payload = decode_token(effective_token)
    if not payload or "sub" not in payload:
        raise HTTPException(status_code=401, detail="Invalid token")
    user = session.exec(select(User).where(User.email == payload["sub"])).first()
    if not user:
        raise HTTPException(status_code=401, detail="User not found")
    return user


@router.post("/register", response_model=UserPublic)
def register(user_in: UserCreate, session: Session = Depends(get_session)):
    existing = session.exec(select(User).where(User.email == user_in.email)).first()
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")
    user = User(
        email=user_in.email,
        name=user_in.name,
        hashed_password=get_password_hash(user_in.password),
    )
    session.add(user)
    session.commit()
    session.refresh(user)
    return user


@router.post("/login")
def login(
    response: Response,
    form_data: OAuth2PasswordRequestForm = Depends(),
    session: Session = Depends(get_session),
):
    user = session.exec(select(User).where(User.email == form_data.username)).first()
    if not user or not verify_password(form_data.password, user.hashed_password):
        raise HTTPException(status_code=401, detail="Incorrect email or password")
    token = create_access_token({"sub": user.email})
    response.set_cookie(
        key=COOKIE_NAME,
        value=token,
        httponly=True,
        secure=False,  # Set to True in production with HTTPS
        samesite="lax",
        max_age=COOKIE_MAX_AGE,
    )
    return {"access_token": token, "token_type": "bearer", "user": UserPublic.model_validate(user)}


@router.post("/logout")
def logout(response: Response):
    response.delete_cookie(key=COOKIE_NAME)
    return {"message": "Logged out"}


@router.get("/me", response_model=UserPublic)
def me(current_user: User = Depends(get_current_user)):
    return current_user
