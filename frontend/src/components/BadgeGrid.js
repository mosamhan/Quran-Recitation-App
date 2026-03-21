import React from 'react';
import { useTheme } from '../context/ThemeContext';
import './BadgeGrid.css';

const ICON_MAP = {
  star: '\u2B50',
  fire: '\uD83D\uDD25',
  trophy: '\uD83C\uDFC6',
  crown: '\uD83D\uDC51',
  gem: '\uD83D\uDC8E',
  bullseye: '\uD83C\uDFAF',
  flame: '\uD83D\uDD25',
  lightning: '\u26A1',
  medal: '\uD83C\uDFC5',
  book: '\uD83D\uDCD6',
  books: '\uD83D\uDCDA',
  scroll: '\uD83D\uDCDC',
  rocket: '\uD83D\uDE80',
  sparkles: '\u2728',
};

const BadgeGrid = ({ earnedBadges = [], allBadges = {} }) => {
  const { isChild } = useTheme();

  const earnedIds = new Set(earnedBadges.map(b => b.badge_id));
  const allBadgeEntries = Object.entries(allBadges);

  if (allBadgeEntries.length === 0 && earnedBadges.length === 0) {
    return null;
  }

  return (
    <div className="badge-grid-container">
      <h3 className="badge-grid-title">
        {isChild ? 'Your Badges' : 'Achievements'}
        <span className="badge-count">{earnedBadges.length} / {allBadgeEntries.length}</span>
      </h3>
      <div className="badge-grid">
        {allBadgeEntries.map(([badgeId, badge]) => {
          const earned = earnedIds.has(badgeId);
          const earnedData = earned ? earnedBadges.find(b => b.badge_id === badgeId) : null;
          return (
            <div
              key={badgeId}
              className={`badge-card ${earned ? 'earned' : 'locked'}`}
              title={earned
                ? `${badge.name} - Earned ${earnedData?.earned_at ? new Date(earnedData.earned_at).toLocaleDateString() : ''}`
                : `${badge.name} - ${badge.description}`
              }
            >
              <span className="badge-icon">
                {ICON_MAP[badge.icon] || '\uD83C\uDFC5'}
              </span>
              <span className="badge-name">{badge.name}</span>
              <span className="badge-desc">{badge.description}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default BadgeGrid;
