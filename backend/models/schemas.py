"""
StyleSense - Pydantic Schemas
Request and response data models
"""

from pydantic import BaseModel, EmailStr
from typing import Optional, List


# ─── Authentication Schemas ───────────────────────────────────────────────────

class UserRegister(BaseModel):
    username: str
    email: str
    password: str


class UserLogin(BaseModel):
    username: str
    password: str


class UserResponse(BaseModel):
    id: int
    username: str
    email: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str
    user: UserResponse


# ─── Recommendation Schemas ───────────────────────────────────────────────────

class StyleInput(BaseModel):
    body_type: str
    occasion: str
    weather: str
    budget: str
    style_preference: str
    color_preference: Optional[str] = None


class OutfitRecommendation(BaseModel):
    outfit_title: str
    outfit_description: str
    color_palette: List[str]
    accessories: List[str]
    hairstyle: str
    styling_explanation: str
    color_of_the_day: str
    budget_note: str


class RecommendationResponse(BaseModel):
    recommendation: OutfitRecommendation
    pinterest_links: dict
