import React from 'react';
import './AccuracyRing.css';

/**
 * Circular progress ring showing live accuracy percentage.
 */
const AccuracyRing = ({ accuracy = 0, size = 100 }) => {
  const strokeWidth = 8;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (accuracy / 100) * circumference;

  // Color based on accuracy
  let color;
  if (accuracy >= 80) color = '#27ae60';
  else if (accuracy >= 50) color = '#f39c12';
  else color = '#e74c3c';

  return (
    <div className="accuracy-ring" style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        {/* Background circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="rgba(0,0,0,0.08)"
          strokeWidth={strokeWidth}
        />
        {/* Progress arc */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
          style={{ transition: 'stroke-dashoffset 0.6s ease, stroke 0.6s ease' }}
        />
      </svg>
      <div className="accuracy-ring-label">
        <span className="accuracy-ring-value" style={{ color }}>
          {Math.round(accuracy)}%
        </span>
      </div>
    </div>
  );
};

export default AccuracyRing;
