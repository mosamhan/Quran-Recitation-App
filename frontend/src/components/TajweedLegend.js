import React, { useState } from 'react';
import { useTheme } from '../context/ThemeContext';
import './TajweedLegend.css';

const RULES = [
  { id: 'ghunnah', name: 'Ghunnah', arabic: '\u063A\u0646\u0651\u0629', color: '#FF7043', short: 'Nasalization (2 counts)' },
  { id: 'idhar', name: 'Idhar', arabic: '\u0625\u0638\u0647\u0627\u0631', color: '#66BB6A', short: 'Clear Noon before throat letters' },
  { id: 'idgham_ghunnah', name: 'Idgham w/ Ghunnah', arabic: '\u0625\u062F\u063A\u0627\u0645 \u0628\u063A\u0646\u0651\u0629', color: '#42A5F5', short: 'Merge with nasalization' },
  { id: 'idgham_no_ghunnah', name: 'Idgham w/o Ghunnah', arabic: '\u0625\u062F\u063A\u0627\u0645 \u0628\u0644\u0627 \u063A\u0646\u0651\u0629', color: '#AB47BC', short: 'Full merge, no nasalization' },
  { id: 'iqlab', name: 'Iqlab', arabic: '\u0625\u0642\u0644\u0627\u0628', color: '#26A69A', short: 'Noon becomes Meem before Ba' },
  { id: 'ikhfa', name: 'Ikhfa', arabic: '\u0625\u062E\u0641\u0627\u0621', color: '#FFA726', short: 'Hidden Noon with nasal' },
  { id: 'qalqalah', name: 'Qalqalah', arabic: '\u0642\u0644\u0642\u0644\u0629', color: '#EF5350', short: 'Echoing bounce' },
  { id: 'madd_natural', name: 'Madd Tabee\'i', arabic: '\u0645\u062F\u0651 \u0637\u0628\u064A\u0639\u064A', color: '#5C6BC0', short: 'Natural elongation (2 counts)' },
  { id: 'madd_extended', name: 'Madd Far\'i', arabic: '\u0645\u062F\u0651 \u0641\u0631\u0639\u064A', color: '#29B6F6', short: 'Extended elongation (4-6 counts)' },
  { id: 'lam_shamsiyyah', name: 'Lam Shamsiyyah', arabic: '\u0644\u0627\u0645 \u0634\u0645\u0633\u064A\u0629', color: '#FFCA28', short: 'Silent Lam' },
  { id: 'lam_qamariyyah', name: 'Lam Qamariyyah', arabic: '\u0644\u0627\u0645 \u0642\u0645\u0631\u064A\u0629', color: '#78909C', short: 'Pronounced Lam' },
];

const TajweedLegend = ({ compact = false }) => {
  const [expanded, setExpanded] = useState(false);
  const { isChild } = useTheme();

  const displayRules = compact && !expanded ? RULES.slice(0, 5) : RULES;

  return (
    <div className={`tajweed-legend ${compact ? 'compact' : ''}`}>
      <button
        className="legend-toggle"
        onClick={() => setExpanded(!expanded)}
      >
        {expanded ? 'Hide' : 'Show'} Tajweed Rules
        {isChild && ' Guide'}
      </button>

      {(expanded || !compact) && (
        <div className="legend-grid">
          {displayRules.map((rule) => (
            <div key={rule.id} className="legend-item">
              <span
                className="legend-color"
                style={{ backgroundColor: rule.color }}
              />
              <div className="legend-info">
                <span className="legend-name">{rule.name}</span>
                <span className="legend-arabic">{rule.arabic}</span>
                {!compact && <span className="legend-desc">{rule.short}</span>}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default TajweedLegend;
