"""
StyleSense - Recommendation Routes
"""

import json
from fastapi import APIRouter, HTTPException, Header
from typing import Optional
from models.schemas import StyleInput
from models.database import get_db_connection
from services.auth_service import get_user_from_token
from services.recommendation_service import generate_recommendation, generate_pinterest_links

router = APIRouter()


def require_auth(authorization: Optional[str]) -> dict:
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Authentication required")

    token = authorization.split(" ")[1]
    user = get_user_from_token(token)

    if not user:
        raise HTTPException(status_code=401, detail="Invalid or expired token")

    return user


@router.post("/recommend")
async def get_recommendation(
    style_input: StyleInput,
    authorization: Optional[str] = Header(None)
):
    user = require_auth(authorization)

    try:
        recommendation = generate_recommendation(
            body_type=style_input.body_type,
            occasion=style_input.occasion,
            weather=style_input.weather,
            budget=style_input.budget,
            style_preference=style_input.style_preference,
            color_preference=style_input.color_preference
        )

        pinterest_links = generate_pinterest_links(
            recommendation,
            style_input.occasion,
            style_input.style_preference
        )

        conn = get_db_connection()
        conn.execute("""
            INSERT INTO recommendations
                (user_id, body_type, occasion, weather,
                 budget, style_preference, color_preference,
                 recommendation_json)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            user["id"],
            style_input.body_type,
            style_input.occasion,
            style_input.weather,
            style_input.budget,
            style_input.style_preference,
            style_input.color_preference,
            json.dumps(recommendation)
        ))
        conn.commit()
        conn.close()

        return {
            "recommendation": recommendation,
            "pinterest_links": pinterest_links
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/history")
async def get_history(
    authorization: Optional[str] = Header(None),
    limit: int = 5
):
    user = require_auth(authorization)

    conn = get_db_connection()
    rows = conn.execute("""
        SELECT id, occasion, style_preference,
               created_at, recommendation_json
        FROM recommendations
        WHERE user_id = ?
        ORDER BY created_at DESC
        LIMIT ?
    """, (user["id"], limit)).fetchall()
    conn.close()

    history = []

    for row in rows:
        rec_data = json.loads(row["recommendation_json"])

        history.append({
            "id": row["id"],
            "occasion": row["occasion"],
            "style_preference": row["style_preference"],
            "created_at": row["created_at"],
            "outfit_title": rec_data.get("outfit_title", ""),
            "color_of_the_day": rec_data.get("color_of_the_day", "")
        })

    return {"history": history}