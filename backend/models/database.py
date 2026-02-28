"""
StyleSense - Database Models
SQLite database setup using Python's built-in sqlite3
"""

import sqlite3
import os

# Database file location
DB_PATH = os.path.join(os.path.dirname(__file__), "..", "stylesense.db")


def get_db_connection():
    """Create and return a database connection with row factory."""
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row  # Enables dict-like access to rows
    return conn


def init_db():
    """Initialize the database and create tables if they don't exist."""
    conn = get_db_connection()
    cursor = conn.cursor()

    # Create users table
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT UNIQUE NOT NULL,
            email TEXT UNIQUE NOT NULL,
            password_hash TEXT NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    """)

    # Create recommendations history table
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS recommendations (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            body_type TEXT,
            occasion TEXT,
            weather TEXT,
            budget TEXT,
            style_preference TEXT,
            color_preference TEXT,
            recommendation_json TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users(id)
        )
    """)

    conn.commit()
    conn.close()
    print("✅ Database initialized successfully!")
