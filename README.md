# ✦ StyleSense – AI Fashion Recommendation System

> A full-stack Generative AI platform for personalized fashion recommendations powered by Google Gemini.

---

## 🚀 Quick Start

### 1. Prerequisites
- Python 3.12+
- A Gemini API key (free at https://aistudio.google.com/app/apikey)

### 2. Setup

```bash
# Clone / navigate to project folder
cd stylesense

# Create and activate virtual environment
python -m venv venv
source venv/bin/activate        # macOS / Linux
venv\Scripts\activate           # Windows

# Install dependencies
pip install -r requirements.txt

# Configure environment
cp .env.example .env
# → Edit .env and add your GEMINI_API_KEY
```

### 3. Run the Server

```bash
cd backend
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

### 4. Open in Browser

```
http://localhost:8000
```

---

## 📁 Project Structure

```
stylesense/
├── backend/
│   ├── main.py                      # FastAPI app entry point
│   ├── models/
│   │   ├── database.py              # SQLite setup & init
│   │   └── schemas.py               # Pydantic request/response models
│   ├── routes/
│   │   ├── auth.py                  # Login, register, logout endpoints
│   │   └── recommendations.py      # AI recommendation endpoints
│   └── services/
│       ├── auth_service.py          # Password hashing, token management
│       └── recommendation_service.py # Gemini API integration
├── frontend/
│   ├── index.html                   # Login / Register page
│   ├── dashboard.html               # Main dashboard
│   ├── style.css                    # All styles
│   └── script.js                    # Frontend logic
├── requirements.txt
├── .env.example
└── README.md
```

---

## 🔑 API Endpoints

| Method | Endpoint              | Description                    |
|--------|-----------------------|--------------------------------|
| POST   | `/api/auth/register`  | Register new user              |
| POST   | `/api/auth/login`     | Login, returns token           |
| POST   | `/api/auth/logout`    | Invalidate session token       |
| GET    | `/api/auth/me`        | Get current user profile       |
| POST   | `/api/recommend`      | Generate AI outfit (auth req.) |
| GET    | `/api/history`        | Get recommendation history     |

Interactive API docs: `http://localhost:8000/docs`

---

## 🎨 Features

- **AI Outfit Generator** – Gemini generates structured outfit recommendations
- **Weather-Aware** – Suggests fabrics and layers based on weather
- **Budget Smart** – Tailors suggestions to your price range
- **Pinterest Integration** – Auto-generates search links for visual inspiration
- **Color of the Day** – Highlights a hero color with live color swatch
- **Recommendation History** – Saves your past looks to SQLite
- **Demo Mode** – Works without an API key for testing

---

## 🛠 Demo Mode

If you don't have a Gemini API key yet, StyleSense runs in **Demo Mode** automatically — showing sample recommendations so you can explore the full UI.

---

## 🔐 Authentication Notes

- Passwords are hashed using bcrypt via passlib
- Tokens are random 64-char hex strings stored in memory
- For production: replace in-memory token store with Redis
