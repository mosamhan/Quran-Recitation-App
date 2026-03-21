import React from 'react';
import './LiveVerseHighlighter.css';

/**
 * Displays verse words with real-time color highlighting based on recitation progress.
 * word_statuses: array of 'pending' | 'correct' | 'incorrect' | 'current'
 */
const LiveVerseHighlighter = ({ words = [], wordStatuses = [] }) => {
  if (words.length === 0) return null;

  return (
    <div className="live-verse-highlighter" dir="rtl">
      {words.map((word, idx) => {
        const status = wordStatuses[idx] || 'pending';
        return (
          <span key={idx} className={`live-word live-word--${status}`}>
            {word}
          </span>
        );
      })}
    </div>
  );
};

export default LiveVerseHighlighter;
