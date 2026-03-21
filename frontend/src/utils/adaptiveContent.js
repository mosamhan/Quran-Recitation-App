/**
 * Adaptive content utilities for age-based and experience-based UI.
 */

// Surahs recommended for beginners (short, commonly memorized)
const BEGINNER_SURAHS = [1, 112, 113, 114, 111, 110, 108, 107, 106, 105, 104, 103, 102, 101, 100, 99, 97, 96, 95, 94, 93];

// Difficulty ratings for chapters (1-3 scale based on length and complexity)
const SURAH_DIFFICULTY = {};
// Juz 30 (short surahs) = easy
for (let i = 78; i <= 114; i++) SURAH_DIFFICULTY[i] = 1;
// Mid-length surahs = medium
for (let i = 50; i <= 77; i++) SURAH_DIFFICULTY[i] = 2;
// Long surahs = advanced
for (let i = 1; i <= 49; i++) SURAH_DIFFICULTY[i] = 3;
// Override: Al-Fatiha is beginner
SURAH_DIFFICULTY[1] = 1;

/**
 * Get difficulty level for a surah number.
 * Returns 1 (beginner), 2 (intermediate), or 3 (advanced).
 */
export const getSurahDifficulty = (surahNumber) => {
  return SURAH_DIFFICULTY[surahNumber] || 2;
};

/**
 * Get a display label for difficulty.
 */
export const getDifficultyLabel = (level, ageGroup) => {
  if (ageGroup === 'child') {
    return ['', 'Easy', 'Medium', 'Challenge'][level] || '';
  }
  return ['', 'Beginner', 'Intermediate', 'Advanced'][level] || '';
};

/**
 * Get a CSS class for difficulty badge coloring.
 */
export const getDifficultyClass = (level) => {
  return ['', 'difficulty-easy', 'difficulty-medium', 'difficulty-hard'][level] || '';
};

/**
 * Check if a surah is recommended for the user's experience level.
 */
export const isRecommended = (surahNumber, experienceLevel) => {
  const difficulty = getSurahDifficulty(surahNumber);
  switch (experienceLevel) {
    case 'beginner':
      return difficulty === 1;
    case 'intermediate':
      return difficulty <= 2;
    case 'advanced':
      return true;
    default:
      return true;
  }
};

/**
 * Get encouragement message based on accuracy, age group, and experience level.
 */
export const getEncouragement = (accuracy, ageGroup, experienceLevel) => {
  if (ageGroup === 'child') {
    if (accuracy >= 90) return 'Amazing job! You are a Quran superstar!';
    if (accuracy >= 70) return 'Great work! Keep going, you are doing so well!';
    if (accuracy >= 50) return 'Good try! Practice makes perfect!';
    return 'Nice effort! Let\'s try again together!';
  }

  if (ageGroup === 'teen') {
    if (accuracy >= 90) return 'Excellent recitation! You\'re really mastering this.';
    if (accuracy >= 70) return 'Solid work! A bit more practice and you\'ll nail it.';
    if (accuracy >= 50) return 'Getting there! Focus on the highlighted mistakes.';
    return 'Keep at it! Every practice session brings improvement.';
  }

  // Adult
  if (accuracy >= 90) return 'Excellent. Your recitation is highly accurate.';
  if (accuracy >= 70) return 'Good progress. Review the noted corrections.';
  if (accuracy >= 50) return 'Moderate accuracy. Consider practicing individual words.';
  return 'Review the verse structure and try again at a slower pace.';
};

/**
 * Get suggested surahs for the user's experience level.
 */
export const getSuggestedSurahs = (experienceLevel) => {
  switch (experienceLevel) {
    case 'beginner':
      return BEGINNER_SURAHS;
    case 'intermediate':
      return Object.entries(SURAH_DIFFICULTY)
        .filter(([, diff]) => diff <= 2)
        .map(([num]) => parseInt(num));
    case 'advanced':
      return []; // No filter - show all
    default:
      return [];
  }
};
