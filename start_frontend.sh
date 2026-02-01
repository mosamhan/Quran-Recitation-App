#!/bin/bash

# Quick start script for frontend

echo "🚀 Starting Quran Recitation App Frontend..."

cd frontend

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm install
fi

# Check if .env exists
if [ ! -f ".env" ]; then
    echo "⚙️  Creating .env file..."
    echo "REACT_APP_API_URL=http://localhost:5000/api" > .env
fi

# Start development server
echo "✅ Starting React development server..."
echo "📍 Frontend will be available at http://localhost:3000"
npm start





