"""
StyleSense - AI Recommendation Service
Uses Google Gemini API to generate personalized fashion recommendations
"""

import os
import json
import urllib.parse
from dotenv import load_dotenv
from google import genai

load_dotenv()

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
client = genai.Client(api_key=GEMINI_API_KEY)


def build_fashion_prompt(
    body_type: str,
    occasion: str,
    weather: str,
    budget: str,
    style_preference: str,
    color_preference: str = None
) -> str:

    color_note = f"Preferred colors: {color_preference}." if color_preference else "No specific color preference."

    return f"""
You are a professional fashion stylist AI.

User Profile:
- Body type: {body_type}
- Occasion: {occasion}
- Weather: {weather}
- Budget: {budget}
- Style preference: {style_preference}
- {color_note}

Return ONLY a valid JSON object with:

{{
  "outfit_title": "",
  "outfit_description": "",
  "color_palette": [],
  "accessories": [],
  "hairstyle": "",
  "styling_explanation": "",
  "color_of_the_day": "",
  "budget_note": ""
}}
"""


def generate_recommendation(
    body_type: str,
    occasion: str,
    weather: str,
    budget: str,
    style_preference: str,
    color_preference: str = None
) -> dict:

    prompt = build_fashion_prompt(
        body_type,
        occasion,
        weather,
        budget,
        style_preference,
        color_preference
    )

    response = client.models.generate_content(
        model="gemini-2.5-flash",
        contents=prompt,
    )

    raw_text = response.text.strip()

    if raw_text.startswith("```"):
        raw_text = raw_text.split("```")[1]
        if raw_text.startswith("json"):
            raw_text = raw_text[4:]

    return json.loads(raw_text)


def generate_pinterest_links(recommendation: dict, occasion: str, style_preference: str) -> dict:

    outfit_title = recommendation.get("outfit_title", "outfit")
    accessories = recommendation.get("accessories", [])
    hairstyle = recommendation.get("hairstyle", "hairstyle")
    color_of_day = recommendation.get("color_of_the_day", "")

    def pinterest_url(query: str) -> str:
        return f"https://www.pinterest.com/search/pins/?q={urllib.parse.quote(query)}"

    return {
        "full_outfit": {
            "url": pinterest_url(f"{style_preference} {occasion} outfit {color_of_day}")
        },
        "accessories": {
            "url": pinterest_url(" ".join(accessories[:2]))
        },
        "hairstyle": {
            "url": pinterest_url(f"{hairstyle} hairstyle")
        },
        "color_palette": {
            "url": pinterest_url(f"{color_of_day} outfit color palette")
        },
    }