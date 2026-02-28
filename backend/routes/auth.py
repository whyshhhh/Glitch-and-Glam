"""
StyleSense - Authentication Routes
Endpoints for user registration and login
"""

from fastapi import APIRouter, HTTPException, Header
from typing import Optional
from models.schemas import UserRegister, UserLogin, TokenResponse
from services.auth_service import register_user, login_user, get_user_from_token, invalidate_token

router = APIRouter()


@router.post("/register", summary="Register a new user")
async def register(user_data: UserRegister):
    """
    Register a new user account.
    - Validates unique username and email
    - Hashes password securely
    - Returns user info and access token
    """
    try:
        user = register_user(user_data.username, user_data.email, user_data.password)
        # Auto-login after registration
        token_data = login_user(user_data.username, user_data.password)
        return {"message": "Registration successful!", **token_data}
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/login", summary="Login with credentials")
async def login(credentials: UserLogin):
    """
    Authenticate a user and return an access token.
    """
    try:
        token_data = login_user(credentials.username, credentials.password)
        return {"message": "Login successful!", **token_data}
    except ValueError as e:
        raise HTTPException(status_code=401, detail=str(e))


@router.post("/logout", summary="Logout current user")
async def logout(authorization: Optional[str] = Header(None)):
    """
    Invalidate the current session token.
    """
    if authorization and authorization.startswith("Bearer "):
        token = authorization.split(" ")[1]
        invalidate_token(token)
    return {"message": "Logged out successfully!"}


@router.get("/me", summary="Get current user info")
async def get_me(authorization: Optional[str] = Header(None)):
    """
    Return the currently authenticated user's profile.
    """
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Not authenticated")

    token = authorization.split(" ")[1]
    user = get_user_from_token(token)

    if not user:
        raise HTTPException(status_code=401, detail="Invalid or expired token")

    return user
