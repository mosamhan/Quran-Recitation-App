import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import './App.css';
import HomePage from './pages/HomePage';
import PracticePage from './pages/PracticePage';
import ProgressPage from './pages/ProgressPage';
import QuranPage from './pages/QuranPage';
import { UserProvider } from './context/UserContext';

function App() {
  return (
    <UserProvider>
      <Router>
        <div className="App">
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/quran" element={<QuranPage />} />
            <Route path="/practice" element={<PracticePage />} />
            <Route path="/progress" element={<ProgressPage />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </div>
      </Router>
    </UserProvider>
  );
}

export default App;

