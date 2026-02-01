import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUser } from '../context/UserContext';
import Logo from '../components/Logo';
import './HomePage.css';

const HomePage = () => {
  const [username, setUsername] = useState('');
  const [error, setError] = useState('');
  const { createUser, user, loading } = useUser();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!username.trim()) {
      setError('Please enter your name!');
      return;
    }

    try {
      await createUser(username);
      navigate('/practice');
    } catch (err) {
      setError(err.response?.data?.error || 'Something went wrong. Please try again!');
    }
  };

  const handleContinue = () => {
    if (user) {
      navigate('/practice');
    }
  };

  return (
    <div className="home-page">
      <div className="home-container">
        <div className="welcome-card">
          <Logo size="large" showTagline={true} showText={true} />
          <p className="welcome-subtitle">
            Iqra means "Read" in Arabic. Learn to recite the Quran with proper pronunciation and Tajweed rules.
            Our AI will help you improve every step of the way!
          </p>

          {!user ? (
            <form onSubmit={handleSubmit} className="username-form">
              <input
                type="text"
                placeholder="Enter your name"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="username-input"
                maxLength={20}
              />
              {error && <p className="error-message">{error}</p>}
              <button type="submit" className="btn-primary" disabled={loading}>
                {loading ? 'Starting...' : 'Start Learning 🚀'}
              </button>
            </form>
          ) : (
            <div className="welcome-back">
              <p className="welcome-message">Welcome back, {user.username}! 👋</p>
              <button onClick={handleContinue} className="btn-primary">
                Continue Learning →
              </button>
            </div>
          )}

          <div className="features-preview">
            <div className="feature-item">
              <span className="feature-emoji">🎤</span>
              <span>Voice Recognition</span>
            </div>
            <div className="feature-item">
              <span className="feature-emoji">📊</span>
              <span>Progress Tracking</span>
            </div>
            <div className="feature-item">
              <span className="feature-emoji">✅</span>
              <span>Mistake Correction</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HomePage;

