import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import Logo from './Logo';
import './Navigation.css';

const Navigation = () => {
  const location = useLocation();

  return (
    <nav className="nav">
      <Link to="/" className="nav-logo">
        <Logo size="small" showTagline={false} />
      </Link>
      <div className="nav-links">
        <Link
          to="/quran"
          className={`nav-link ${location.pathname === '/quran' ? 'active' : ''}`}
        >
          📖 Quran
        </Link>
        <Link
          to="/practice"
          className={`nav-link ${location.pathname === '/practice' ? 'active' : ''}`}
        >
          🎤 Practice
        </Link>
        <Link
          to="/progress"
          className={`nav-link ${location.pathname === '/progress' ? 'active' : ''}`}
        >
          📊 Progress
        </Link>
        <Link
          to="/"
          className={`nav-link ${location.pathname === '/' ? 'active' : ''}`}
        >
          🏠 Home
        </Link>
      </div>
    </nav>
  );
};

export default Navigation;

