# Quick Setup Guide

Follow these steps to get the Quran Recitation App running:

## 1. Backend Setup

```bash
# Navigate to backend directory
cd backend

# Create virtual environment
python3 -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Copy environment file
cp env.example .env
# Edit .env with your NVIDIA Riva configuration

# Initialize database
python init_db.py

# Run the server
python app.py
```

The backend will be available at `http://localhost:5000`

## 2. Frontend Setup

```bash
# Navigate to frontend directory (in a new terminal)
cd frontend

# Install dependencies
npm install

# Copy environment file (optional)
cp .env.example .env
# Edit .env if your backend is on a different URL

# Start development server
npm start
```

The frontend will be available at `http://localhost:3000`

## 3. NVIDIA Riva Setup

See `backend/RIVA_SETUP.md` for detailed instructions on setting up NVIDIA Riva.

For quick testing, the app includes a mock transcription mode that will work without Riva, but you'll need to set up Riva for actual speech recognition.

## 4. First Run

1. Open `http://localhost:3000` in your browser
2. Enter your name to create a user profile
3. Start practicing recitation!

## Troubleshooting

### Backend won't start
- Make sure Python 3.8+ is installed
- Check that all dependencies are installed: `pip install -r requirements.txt`
- Verify the database file is created: `ls -la *.db`

### Frontend won't start
- Make sure Node.js 16+ is installed
- Try deleting `node_modules` and running `npm install` again
- Check that port 3000 is not in use

### Microphone not working
- Make sure you've granted microphone permissions in your browser
- Test microphone in browser settings
- Try a different browser (Chrome/Firefox recommended)

### Riva connection errors
- Check that Riva server is running
- Verify the API URL in `.env` is correct
- See `backend/RIVA_SETUP.md` for Riva setup instructions





