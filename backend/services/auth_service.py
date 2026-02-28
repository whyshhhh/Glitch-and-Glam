"""
StyleSense - Authentication Service
Handles user registration, login, and token management
"""

import secrets
import hashlib
from passlib.context import CryptContext
from models.database import get_db_connection

# Password hashing context using bcrypt
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# In-memory token store (use Redis in production)
active_tokens: dict = {}


def hash_password(password: str) -> str:
    """Hash a plain text password."""
    return pwd_context.hash(password)


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify a plain text password against its hash."""
    return pwd_context.verify(plain_password, hashed_password)


def generate_token(user_id: int) -> str:
    """Generate a secure random token for the user session."""
    token = secrets.token_hex(32)
    active_tokens[token] = user_id
    return token


def get_user_from_token(token: str) -> dict | None:
    """Retrieve user details from a valid token."""
    user_id = active_tokens.get(token)
    if not user_id:
        return None

    conn = get_db_connection()
    user = conn.execute(
        "SELECT id, username, email FROM users WHERE id = ?", (user_id,)
    ).fetchone()
    conn.close()

    return dict(user) if user else None


def invalidate_token(token: str):
    """Remove token on logout."""
    active_tokens.pop(token, None)


def register_user(username: str, email: str, password: str) -> dict:
    """
    Register a new user.
    Returns user dict on success, raises ValueError on failure.
    """
    conn = get_db_connection()

    # Check if username or email already exists
    existing = conn.execute(
        "SELECT id FROM users WHERE username = ? OR email = ?", (username, email)
    ).fetchone()

    if existing:
        conn.close()
        raise ValueError("Username or email already exists.")

    # Hash password and insert user
    password_hash = hash_password(password)
    cursor = conn.execute(
        "INSERT INTO users (username, email, password_hash) VALUES (?, ?, ?)",
        (username, email, password_hash)
    )
    conn.commit()
    user_id = cursor.lastrowid

    user = {"id": user_id, "username": username, "email": email}
    conn.close()
    return user


def login_user(username: str, password: str) -> dict:
    """
    Authenticate a user and return token.
    Returns token dict on success, raises ValueError on failure.
    """
    conn = get_db_connection()
    user = conn.execute(
        "SELECT id, username, email, password_hash FROM users WHERE username = ?",
        (username,)
    ).fetchone()
    conn.close()

    if not user or not verify_password(password, user["password_hash"]):
        raise ValueError("Invalid username or password.")

    token = generate_token(user["id"])
    return {
        "access_token": token,
        "token_type": "bearer",
        "user": {
            "id": user["id"],
            "username": user["username"],
            "email": user["email"]
        }
    }
