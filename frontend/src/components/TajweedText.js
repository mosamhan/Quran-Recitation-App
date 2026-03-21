import React, { useState, useEffect } from 'react';
import api from '../services/api';
import './TajweedText.css';

/**
 * Renders Arabic text with tajweed rules color-coded.
 * Fetches rule positions from the backend and wraps matching
 * character ranges in colored <span> elements.
 */
const TajweedText = ({ text, showRules = true }) => {
  const [rules, setRules] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!text || !showRules) {
      setRules([]);
      return;
    }

    let cancelled = false;
    const fetchRules = async () => {
      setLoading(true);
      try {
        const response = await api.analyzeTajweed(text);
        if (!cancelled) {
          setRules(response.data.rules || []);
        }
      } catch {
        // Silently fail - just show unhighlighted text
        if (!cancelled) setRules([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    fetchRules();
    return () => { cancelled = true; };
  }, [text, showRules]);

  if (!text) return null;

  // If no rules or still loading, render plain text
  if (!showRules || rules.length === 0) {
    return <span className="tajweed-text">{text}</span>;
  }

  // Build highlighted segments
  const segments = buildSegments(text, rules);

  return (
    <span className="tajweed-text">
      {segments.map((seg, idx) => (
        seg.rule ? (
          <span
            key={idx}
            className="tajweed-highlight"
            style={{ color: seg.rule.rule_info.color }}
            title={`${seg.rule.rule_info.name} (${seg.rule.rule_info.arabic_name})`}
          >
            {seg.text}
          </span>
        ) : (
          <span key={idx}>{seg.text}</span>
        )
      ))}
    </span>
  );
};

/**
 * Break text into segments: plain text and rule-highlighted spans.
 * Rules may overlap; we take the first rule at each position.
 */
function buildSegments(text, rules) {
  if (!rules.length) return [{ text, rule: null }];

  // Sort rules by start position
  const sorted = [...rules].sort((a, b) => a.start - b.start);
  const segments = [];
  let cursor = 0;

  for (const rule of sorted) {
    // Skip rules that start before cursor (overlap)
    if (rule.start < cursor) continue;

    // Add plain text before this rule
    if (rule.start > cursor) {
      segments.push({ text: text.slice(cursor, rule.start), rule: null });
    }

    // Add highlighted segment
    const end = Math.min(rule.end, text.length);
    segments.push({ text: text.slice(rule.start, end), rule });
    cursor = end;
  }

  // Add remaining text
  if (cursor < text.length) {
    segments.push({ text: text.slice(cursor), rule: null });
  }

  return segments;
}

export default TajweedText;
