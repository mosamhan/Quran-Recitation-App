import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useUser } from '../context/UserContext';
import Logo from '../components/Logo';
import './AuthPages.css';

const RegisterPage = () => {
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
    display_name: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { register } = useUser();
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    const { username, email, password, confirmPassword, display_name } = formData;

    if (!username.trim() || !email.trim() || !password) {
      setError('Please fill in all required fields');
      return;
    }

    if (password.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setLoading(true);
    try {
      await register({
        username: username.trim(),
        email: email.trim(),
        password,
        display_name: display_name.trim() || username.trim(),
      });
      navigate('/onboarding');
    } catch (err) {
      setError(err.response?.data?.error || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-container">
        <div className="auth-card">
          <Logo size="large" showTagline={true} showText={true} />

          <h2 className="auth-title">Create Your Account</h2>
          <p className="auth-subtitle">Start your Quran learning journey today</p>

          <form onSubmit={handleSubmit} className="auth-form">
            <div className="form-group">
              <label htmlFor="display_name">Display Name</label>
              <input
                id="display_name"
                type="text"
                name="display_name"
                placeholder="What should we call you?"
                value={formData.display_name}
                onChange={handleChange}
                className="auth-input"
                maxLength={80}
              />
            </div>

            <div className="form-group">
              <label htmlFor="username">Username *</label>
              <input
                id="username"
                type="text"
                name="username"
                placeholder="Choose a username"
                value={formData.username}
                onChange={handleChange}
                className="auth-input"
                maxLength={80}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="email">Email *</label>
              <input
                id="email"
                type="email"
                name="email"
                placeholder="your@email.com"
                value={formData.email}
                onChange={handleChange}
                className="auth-input"
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="password">Password *</label>
              <input
                id="password"
                type="password"
                name="password"
                placeholder="At least 8 characters"
                value={formData.password}
                onChange={handleChange}
                className="auth-input"
                minLength={8}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="confirmPassword">Confirm Password *</label>
              <input
                id="confirmPassword"
                type="password"
                name="confirmPassword"
                placeholder="Confirm your password"
                value={formData.confirmPassword}
                onChange={handleChange}
                className="auth-input"
                required
              />
            </div>

            {error && <p className="error-message">{error}</p>}

            <button type="submit" className="btn-primary" disabled={loading}>
              {loading ? 'Creating Account...' : 'Create Account'}
            </button>
          </form>

          <p className="auth-switch">
            Already have an account? <Link to="/login">Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;
