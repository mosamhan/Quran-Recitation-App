"""
Initialize the database
"""
import sys
import os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))

from app import app, db

with app.app_context():
    db.create_all()
    print("Database initialized successfully!")
