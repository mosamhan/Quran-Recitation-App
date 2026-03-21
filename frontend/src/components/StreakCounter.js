import React from 'react';
import { useTheme } from '../context/ThemeContext';
import './StreakCounter.css';

const StreakCounter = ({ currentStreak, longestStreak }) => {
  const { isChild } = useTheme();

  return (
    <div className="streak-container">
      <div className="streak-current">
        <div className="streak-flame">
          {currentStreak > 0 ? (
            <span className="flame-icon active" role="img" aria-label="streak">
              {isChild ? '\uD83D\uDD25' : '\uD83D\uDD25'}
            </span>
          ) : (
            <span className="flame-icon inactive" role="img" aria-label="no streak">
              {isChild ? '\u2744\uFE0F' : '\u2014'}
            </span>
          )}
        </div>
        <div className="streak-info">
          <span className="streak-number">{currentStreak}</span>
          <span className="streak-label">
            {currentStreak === 1 ? 'Day Streak' : 'Day Streak'}
          </span>
        </div>
      </div>
      <div className="streak-best">
        Best: {longestStreak} {longestStreak === 1 ? 'day' : 'days'}
      </div>
    </div>
  );
};

export default StreakCounter;
