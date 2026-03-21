import React from 'react';
import { useTheme } from '../context/ThemeContext';
import './SessionReward.css';

/**
 * Shows XP earned and any new badges after a practice session.
 * Displayed in the results section of PracticePage.
 */
const SessionReward = ({ gamification }) => {
  const { isChild } = useTheme();

  if (!gamification) return null;

  const { xp_earned, level, current_streak, streak_continued, new_badges } = gamification;

  return (
    <div className="session-reward">
      <div className="reward-xp">
        <span className="reward-xp-amount">+{xp_earned} XP</span>
        <span className="reward-level">Level {level}</span>
      </div>

      {streak_continued && current_streak > 1 && (
        <div className="reward-streak">
          {isChild
            ? `${current_streak} day streak! Keep it up!`
            : `${current_streak}-day streak`
          }
        </div>
      )}

      {new_badges && new_badges.length > 0 && (
        <div className="reward-badges">
          <div className="reward-badges-title">
            {isChild ? 'New Badge Earned!' : 'Achievement Unlocked'}
          </div>
          {new_badges.map((badge) => (
            <div key={badge.badge_id} className="reward-badge-item">
              <span className="reward-badge-name">{badge.name}</span>
              <span className="reward-badge-desc">{badge.description}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default SessionReward;
