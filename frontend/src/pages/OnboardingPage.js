import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUser } from '../context/UserContext';
import Logo from '../components/Logo';
import './OnboardingPage.css';

const AGE_GROUPS = [
  { value: 'child', label: 'Child', description: 'Ages 5-12', icon: '\uD83C\uDF1F' },
  { value: 'teen', label: 'Teen', description: 'Ages 13-17', icon: '\uD83D\uDE80' },
  { value: 'adult', label: 'Adult', description: 'Ages 18+', icon: '\uD83D\uDCDA' },
];

const EXPERIENCE_LEVELS = [
  { value: 'beginner', label: 'Beginner', description: 'Just starting to learn Quran recitation' },
  { value: 'intermediate', label: 'Intermediate', description: 'Can read Arabic and know some Tajweed rules' },
  { value: 'advanced', label: 'Advanced', description: 'Comfortable with recitation, refining Tajweed' },
];

const OnboardingPage = () => {
  const [step, setStep] = useState(1);
  const [ageGroup, setAgeGroup] = useState('');
  const [experienceLevel, setExperienceLevel] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { user, updateProfile } = useUser();
  const navigate = useNavigate();

  const handleNext = () => {
    if (step === 1 && !ageGroup) {
      setError('Please select your age group');
      return;
    }
    setError('');
    setStep(2);
  };

  const handleFinish = async () => {
    if (!experienceLevel) {
      setError('Please select your experience level');
      return;
    }

    setLoading(true);
    setError('');
    try {
      await updateProfile({
        age_group: ageGroup,
        experience_level: experienceLevel,
        onboarding_completed: true,
      });
      navigate('/practice');
    } catch (err) {
      setError('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="onboarding-page">
      <div className="onboarding-container">
        <div className="onboarding-card">
          <Logo size="medium" showTagline={false} showText={true} />

          <div className="onboarding-progress">
            <div className={`progress-dot ${step >= 1 ? 'active' : ''}`} />
            <div className="progress-line" />
            <div className={`progress-dot ${step >= 2 ? 'active' : ''}`} />
          </div>

          <h2 className="onboarding-greeting">
            Assalamu Alaikum{user?.display_name ? `, ${user.display_name}` : ''}!
          </h2>

          {step === 1 && (
            <div className="onboarding-step">
              <h3 className="step-title">Who will be using this app?</h3>
              <p className="step-description">
                We'll personalize your experience based on your age group.
              </p>

              <div className="option-grid">
                {AGE_GROUPS.map((group) => (
                  <button
                    key={group.value}
                    className={`option-card ${ageGroup === group.value ? 'selected' : ''}`}
                    onClick={() => { setAgeGroup(group.value); setError(''); }}
                  >
                    <span className="option-icon">{group.icon}</span>
                    <span className="option-label">{group.label}</span>
                    <span className="option-description">{group.description}</span>
                  </button>
                ))}
              </div>

              {error && <p className="error-message">{error}</p>}

              <button className="btn-primary" onClick={handleNext}>
                Next
              </button>
            </div>
          )}

          {step === 2 && (
            <div className="onboarding-step">
              <h3 className="step-title">What's your experience level?</h3>
              <p className="step-description">
                This helps us tailor lessons and feedback to your skill level.
              </p>

              <div className="option-list">
                {EXPERIENCE_LEVELS.map((level) => (
                  <button
                    key={level.value}
                    className={`option-row ${experienceLevel === level.value ? 'selected' : ''}`}
                    onClick={() => { setExperienceLevel(level.value); setError(''); }}
                  >
                    <span className="option-label">{level.label}</span>
                    <span className="option-description">{level.description}</span>
                  </button>
                ))}
              </div>

              {error && <p className="error-message">{error}</p>}

              <div className="onboarding-buttons">
                <button className="btn-secondary" onClick={() => setStep(1)}>
                  Back
                </button>
                <button className="btn-primary" onClick={handleFinish} disabled={loading}>
                  {loading ? 'Saving...' : 'Start Learning'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default OnboardingPage;
