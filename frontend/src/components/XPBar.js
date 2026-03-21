import React from 'react';
import { useTheme } from '../context/ThemeContext';
import './XPBar.css';

const XPBar = ({ totalXp, level, xpInLevel, xpForNextLevel }) => {
  const { isChild } = useTheme();
  const progress = xpForNextLevel > 0 ? (xpInLevel / xpForNextLevel) * 100 : 0;

  return (
    <div className="xp-bar-container">
      <div className="xp-header">
        <span className="xp-level">
          {isChild ? `Level ${level}` : `Level ${level}`}
        </span>
        <span className="xp-total">{totalXp} XP</span>
      </div>
      <div className="xp-bar">
        <div
          className="xp-fill"
          style={{ width: `${Math.min(progress, 100)}%` }}
        />
      </div>
      <div className="xp-footer">
        <span>{xpInLevel} / {xpForNextLevel} XP to next level</span>
      </div>
    </div>
  );
};

export default XPBar;
