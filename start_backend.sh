#!/bin/bash

# Quick start script for backend

echo "🚀 Starting Quran Recitation App Backend..."

cd backend

# Check if virtual environment exists
if [ ! -d "venv" ]; then
    echo "📦 Creating virtual environment..."
    python3 -m venv venv
fi

# Activate virtual environment
echo "🔧 Activating virtual environment..."
source venv/bin/activate

# Install dependencies
echo "📥 Installing dependencies..."
pip install -r requirements.txt

# Check if .env exists
if [ ! -f ".env" ]; then
    echo "⚙️  Creating .env file from template..."
    cp env.example .env
    echo "⚠️  Please edit backend/.env with your NVIDIA Riva configuration"
fi

# Initialize database
echo "🗄️  Initializing database..."
python scripts/init_db.py

# Start server
echo "✅ Starting Flask server..."
echo "📍 Backend will be available at http://localhost:5000"
python app.py





