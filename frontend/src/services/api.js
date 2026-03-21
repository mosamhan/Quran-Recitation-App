import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Attach JWT token to every request if available
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle 401 responses globally (expired/invalid token)
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      // Only redirect if not already on auth pages
      if (!window.location.pathname.startsWith('/login') &&
          !window.location.pathname.startsWith('/register')) {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default {
  // Auth endpoints
  register: (data) => api.post('/auth/register', data),
  login: (data) => api.post('/auth/login', data),
  getMe: () => api.get('/auth/me'),
  updateProfile: (data) => api.put('/auth/profile', data),

  // Legacy user endpoints
  createUser: (username) => api.post('/users', { username }),
  getUser: (userId) => api.get(`/users/${userId}`),
  getDemographic: (userId) => api.get(`/users/${userId}/demographic`),
  updateDemographic: (userId, data) => api.put(`/users/${userId}/demographic`, data),

  // Recitation endpoints
  analyzeRecitation: (data) => api.post('/recitation/analyze', data),
  startStreamingAnalysis: (data) => api.post('/recitation/start-streaming', data),
  analyzeChunk: (data) => api.post('/recitation/analyze-chunk', data),
  finishStreamingAnalysis: (data) => api.post('/recitation/finish-streaming', data),

  // Progress endpoints
  getProgress: (userId) => api.get(`/progress/${userId}`),
  markMemorized: (userId, verseId) => api.post('/progress/memorize', { user_id: userId, verse_id: verseId }),
  getSessions: (userId) => api.get(`/sessions/${userId}`),

  // Verses endpoints (legacy)
  getVerses: () => api.get('/verses'),
  getVerse: (verseId) => api.get(`/verses/${verseId}`),

  // Quran API endpoints
  getQuranChapters: () => api.get('/quran/chapters'),
  getQuranChapter: (chapterNumber, translation = 'en.sahih') =>
    api.get(`/quran/chapters/${chapterNumber}`, { params: { translation } }),
  getQuranVerse: (chapterNumber, verseNumber, translation = 'en.sahih') =>
    api.get(`/quran/verses/${chapterNumber}/${verseNumber}`, { params: { translation } }),
  getChapterAudio: (chapterNumber, verseNumber = null, reciter = 'alafasy', absoluteNumber = null) => {
    const params = { reciter };
    if (verseNumber) params.verse = verseNumber;
    if (absoluteNumber) params.absolute_number = absoluteNumber;
    return api.get(`/quran/audio/${chapterNumber}`, { params });
  },
  getReciters: () => api.get('/quran/reciters'),

  // Tajweed endpoints
  getTajweedRules: () => api.get('/tajweed/rules'),
  analyzeTajweed: (text) => api.post('/tajweed/analyze', { text }),

  // Gamification endpoints
  getGamificationStats: (userId) => api.get(`/gamification/stats/${userId}`),
  getAllBadges: () => api.get('/gamification/badges'),
};
