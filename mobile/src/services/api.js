import axios from 'axios';
import * as SecureStore from 'expo-secure-store';

// Change this to your backend URL
// For local dev on physical device, use your computer's local IP
// For emulator: Android uses 10.0.2.2, iOS simulator uses localhost
const API_BASE_URL = __DEV__
  ? 'http://localhost:5000/api'
  : 'https://your-production-url.com/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: { 'Content-Type': 'application/json' },
  timeout: 30000,
});

// Attach JWT token to every request
api.interceptors.request.use(async (config) => {
  try {
    const token = await SecureStore.getItemAsync('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  } catch {
    // SecureStore not available (web fallback)
  }
  return config;
});

const apiService = {
  // Auth
  register: (data) => api.post('/auth/register', data),
  login: (data) => api.post('/auth/login', data),
  getMe: () => api.get('/auth/me'),
  updateProfile: (data) => api.put('/auth/profile', data),

  // Recitation
  startStreamingAnalysis: (data) => api.post('/recitation/start-streaming', data),
  analyzeChunk: (data) => api.post('/recitation/analyze-chunk', data),
  finishStreamingAnalysis: (data) => api.post('/recitation/finish-streaming', data),

  // Progress
  getProgress: (userId) => api.get(`/progress/${userId}`),
  markMemorized: (userId, verseId) =>
    api.post('/progress/memorize', { user_id: userId, verse_id: verseId }),
  getSessions: (userId) => api.get(`/sessions/${userId}`),

  // Quran
  getQuranChapters: () => api.get('/quran/chapters'),
  getQuranChapter: (chapterNumber) => api.get(`/quran/chapters/${chapterNumber}`),
  getChapterAudio: (chapterNumber, verseNumber, reciter = 'alafasy', absoluteNumber = null) => {
    const params = { reciter };
    if (verseNumber) params.verse = verseNumber;
    if (absoluteNumber) params.absolute_number = absoluteNumber;
    return api.get(`/quran/audio/${chapterNumber}`, { params });
  },
  getReciters: () => api.get('/quran/reciters'),

  // Tajweed
  getTajweedRules: () => api.get('/tajweed/rules'),
  analyzeTajweed: (text) => api.post('/tajweed/analyze', { text }),

  // Gamification
  getGamificationStats: (userId) => api.get(`/gamification/stats/${userId}`),
  getAllBadges: () => api.get('/gamification/badges'),

  // Curriculum
  getCurriculum: (userId) => api.get('/curriculum', { params: { user_id: userId } }),
  getCurriculumLesson: (lessonId, userId) =>
    api.get(`/curriculum/lesson/${lessonId}`, { params: { user_id: userId } }),
};

export default apiService;
