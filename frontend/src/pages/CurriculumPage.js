import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUser } from '../context/UserContext';
import { useTheme } from '../context/ThemeContext';
import api from '../services/api';
import Navigation from '../components/Navigation';
import './CurriculumPage.css';

const LEVEL_ORDER = ['beginner', 'intermediate', 'advanced'];

const CurriculumPage = () => {
  const { user } = useUser();
  const { isChild } = useTheme();
  const navigate = useNavigate();
  const [curriculum, setCurriculum] = useState(null);
  const [activeLevel, setActiveLevel] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) { navigate('/'); return; }
    loadCurriculum();
  }, [user, navigate]);

  const loadCurriculum = async () => {
    try {
      const res = await api.getCurriculum(user.id);
      setCurriculum(res.data);
      // Default to user's experience level, or beginner
      const defaultLevel = user.experience_level || 'beginner';
      setActiveLevel(LEVEL_ORDER.includes(defaultLevel) ? defaultLevel : 'beginner');
    } catch (err) {
      console.error('Error loading curriculum:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleStartLesson = (lesson) => {
    if (lesson.status === 'locked') return;
    const verse = lesson.verses ? lesson.verses[0] : 1;
    navigate('/practice', { state: { chapter: lesson.chapter, verse } });
  };

  if (!user || loading) {
    return (
      <div className="curriculum-page">
        <Navigation />
        <div className="container"><div className="loading">Loading...</div></div>
      </div>
    );
  }

  const levelData = curriculum && activeLevel ? curriculum[activeLevel] : null;

  return (
    <div className="curriculum-page">
      <Navigation />
      <div className="container">
        <h2 className="curriculum-title">
          {isChild ? 'My Learning Path' : 'Curriculum'}
        </h2>

        {/* Level tabs */}
        <div className="level-tabs">
          {LEVEL_ORDER.map((lvl) => {
            const data = curriculum?.[lvl];
            if (!data) return null;
            const completedCount = data.lessons.filter(l => l.status === 'completed').length;
            return (
              <button
                key={lvl}
                className={`level-tab ${activeLevel === lvl ? 'active' : ''}`}
                onClick={() => setActiveLevel(lvl)}
              >
                <span className="level-tab-name">
                  {isChild ? data.title_child : data.title}
                </span>
                <span className="level-tab-progress">
                  {completedCount}/{data.lessons.length}
                </span>
              </button>
            );
          })}
        </div>

        {/* Level description */}
        {levelData && (
          <p className="level-description">{levelData.description}</p>
        )}

        {/* Lesson list */}
        {levelData && (
          <div className="lessons-list">
            {levelData.lessons.map((lesson, idx) => (
              <div
                key={lesson.id}
                className={`lesson-card lesson-card--${lesson.status}`}
                onClick={() => handleStartLesson(lesson)}
              >
                <div className="lesson-number">{idx + 1}</div>
                <div className="lesson-body">
                  <div className="lesson-header-row">
                    <h3 className="lesson-title">
                      {isChild ? lesson.title_child : lesson.title}
                    </h3>
                    <LessonStatusBadge status={lesson.status} isChild={isChild} />
                  </div>
                  <p className="lesson-desc">{lesson.description}</p>

                  {/* Objectives */}
                  <ul className="lesson-objectives">
                    {lesson.objectives.map((obj, i) => (
                      <li key={i}>{obj}</li>
                    ))}
                  </ul>

                  {/* Verse progress bar */}
                  {lesson.verses_total > 0 && lesson.status !== 'locked' && (
                    <div className="lesson-verse-progress">
                      <div className="lesson-verse-bar">
                        <div
                          className="lesson-verse-fill"
                          style={{
                            width: `${(lesson.verses_completed / lesson.verses_total) * 100}%`,
                          }}
                        />
                      </div>
                      <span className="lesson-verse-text">
                        {lesson.verses_completed}/{lesson.verses_total} verses
                      </span>
                    </div>
                  )}

                  {/* XP reward */}
                  <div className="lesson-xp">+{lesson.xp_reward} XP</div>
                </div>

                {/* Connector line between lessons */}
                {idx < levelData.lessons.length - 1 && (
                  <div className="lesson-connector" />
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

const LessonStatusBadge = ({ status, isChild }) => {
  const labels = {
    completed: isChild ? 'Done!' : 'Completed',
    unlocked: isChild ? 'Ready!' : 'Unlocked',
    locked: isChild ? 'Locked' : 'Locked',
  };
  return <span className={`lesson-status lesson-status--${status}`}>{labels[status]}</span>;
};

export default CurriculumPage;
