import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUser } from '../context/UserContext';
import { useTheme } from '../context/ThemeContext';
import api from '../services/api';
import Navigation from '../components/Navigation';
import XPBar from '../components/XPBar';
import StreakCounter from '../components/StreakCounter';
import BadgeGrid from '../components/BadgeGrid';
import './ProgressPage.css';

const ProgressPage = () => {
  const { user } = useUser();
  const { isChild } = useTheme();
  const navigate = useNavigate();
  const [progress, setProgress] = useState(null);
  const [sessions, setSessions] = useState([]);
  const [gamification, setGamification] = useState(null);
  const [allBadges, setAllBadges] = useState({});
  const [loading, setLoading] = useState(true);

  const loadProgress = useCallback(async () => {
    try {
      const response = await api.getProgress(user.id);
      setProgress(response.data);
    } catch (error) {
      console.error('Error loading progress:', error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  const loadSessions = useCallback(async () => {
    try {
      const response = await api.getSessions(user.id);
      setSessions(response.data.sessions);
    } catch (error) {
      console.error('Error loading sessions:', error);
    }
  }, [user]);

  const loadGamification = useCallback(async () => {
    try {
      const [statsRes, badgesRes] = await Promise.all([
        api.getGamificationStats(user.id),
        api.getAllBadges()
      ]);
      setGamification(statsRes.data);
      setAllBadges(badgesRes.data.badges || {});
    } catch (error) {
      console.error('Error loading gamification:', error);
    }
  }, [user]);

  useEffect(() => {
    if (!user) {
      navigate('/');
      return;
    }

    loadProgress();
    loadSessions();
    loadGamification();
  }, [user, navigate, loadProgress, loadSessions, loadGamification]);

  if (!user || loading) {
    return (
      <div className="progress-page">
        <div className="loading">Loading...</div>
      </div>
    );
  }

  return (
    <div className="progress-page">
      <Navigation />
      <div className="container">

        {gamification && (
          <div className="gamification-section">
            <h2 className="page-title">
              {isChild ? 'Your Adventure' : 'Your Progress'}
            </h2>
            <div className="gamification-top-row">
              <XPBar
                level={gamification.level}
                totalXP={gamification.total_xp}
                xpForNextLevel={gamification.xp_for_next_level}
              />
              <StreakCounter
                currentStreak={gamification.current_streak}
                longestStreak={gamification.longest_streak}
              />
            </div>
            <BadgeGrid
              earnedBadges={gamification.badges || []}
              allBadges={allBadges}
            />
          </div>
        )}

        {progress && (
          <div className="stats-grid">
            <div className="stat-card">
              <div className="stat-emoji">🎯</div>
              <div className="stat-value">{progress.total_sessions}</div>
              <div className="stat-label">Practice Sessions</div>
            </div>

            <div className="stat-card">
              <div className="stat-emoji">⭐</div>
              <div className="stat-value">{progress.average_accuracy}%</div>
              <div className="stat-label">Average Accuracy</div>
            </div>

            <div className="stat-card">
              <div className="stat-emoji">📖</div>
              <div className="stat-value">{progress.verses_memorized}</div>
              <div className="stat-label">Verses Memorized</div>
            </div>
          </div>
        )}

        <div className="recent-sessions">
          <h3 className="section-title">Recent Practice Sessions</h3>
          {sessions.length > 0 ? (
            <div className="sessions-list">
              {sessions.map((session) => (
                <div key={session.id} className="session-card">
                  <div className="session-header">
                    <span className="session-verse">Verse {session.verse_id}</span>
                    <span className="session-date">
                      {new Date(session.date).toLocaleDateString()}
                    </span>
                  </div>
                  <div className="session-accuracy">
                    Accuracy: <strong>{session.accuracy}%</strong>
                  </div>
                  {session.mistakes_count > 0 && (
                    <div className="session-mistakes">
                      {session.mistakes_count} mistake(s) found
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="no-sessions">
              <p>No practice sessions yet. Start practicing to see your progress!</p>
              <button
                onClick={() => navigate('/practice')}
                className="btn-primary"
              >
                Start Practicing
              </button>
            </div>
          )}
        </div>

        {progress && progress.recent_mistakes && progress.recent_mistakes.length > 0 && (
          <div className="recent-mistakes">
            <h3 className="section-title">Common Mistakes to Work On</h3>
            <div className="mistakes-list">
              {progress.recent_mistakes.map((mistake, index) => (
                <div key={index} className="mistake-card">
                  <div className="mistake-type-badge">{mistake.type}</div>
                  <div className="mistake-content">
                    <div className="mistake-text">
                      <span className="incorrect">❌ {mistake.incorrect || 'Missing'}</span>
                      <span className="arrow">→</span>
                      <span className="correct">✅ {mistake.correct}</span>
                    </div>
                    {mistake.suggestion && (
                      <div className="mistake-suggestion">💡 {mistake.suggestion}</div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProgressPage;

