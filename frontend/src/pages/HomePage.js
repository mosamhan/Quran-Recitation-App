import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useUser } from '../context/UserContext';
import Navigation from '../components/Navigation';
import Logo from '../components/Logo';
import './HomePage.css';

const HomePage = () => {
  const { user } = useUser();
  const navigate = useNavigate();

  return (
    <div className="home-page">
      <Navigation />
      <div className="home-container">
        <div className="welcome-card">
          <Logo size="large" showTagline={true} showText={true} />
          <p className="welcome-subtitle">
            Iqra means "Read" in Arabic. Learn to recite the Quran with proper pronunciation and Tajweed rules.
            Our AI will help you improve every step of the way!
          </p>

          <div className="welcome-back">
            <p className="welcome-message">
              Welcome back, {user?.display_name || user?.username}!
            </p>
            <button onClick={() => navigate('/practice')} className="btn-primary">
              Continue Learning
            </button>
          </div>

          <div className="features-preview">
            <div className="feature-item">
              <span className="feature-emoji">Voice Recognition</span>
            </div>
            <div className="feature-item">
              <span className="feature-emoji">Progress Tracking</span>
            </div>
            <div className="feature-item">
              <span className="feature-emoji">Mistake Correction</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HomePage;
