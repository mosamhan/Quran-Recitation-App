import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useUser } from '../context/UserContext';
import Logo from './Logo';
import './Navigation.css';

const Navigation = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout, isAuthenticated } = useUser();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

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
          Quran
        </Link>
        <Link
          to="/practice"
          className={`nav-link ${location.pathname === '/practice' ? 'active' : ''}`}
        >
          Practice
        </Link>
        <Link
          to="/curriculum"
          className={`nav-link ${location.pathname === '/curriculum' ? 'active' : ''}`}
        >
          Learn
        </Link>
        <Link
          to="/progress"
          className={`nav-link ${location.pathname === '/progress' ? 'active' : ''}`}
        >
          Progress
        </Link>
        {isAuthenticated && (
          <button onClick={handleLogout} className="nav-link nav-logout">
            Logout
          </button>
        )}
      </div>
      {user?.display_name && (
        <span className="nav-user">{user.display_name}</span>
      )}
    </nav>
  );
};

export default Navigation;
