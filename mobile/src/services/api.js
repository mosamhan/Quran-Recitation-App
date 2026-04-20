import axios from 'axios';
import * as SecureStore from 'expo-secure-store';

// Change this to your backend URL
// For local dev on physical device, use your computer's local IP
// For emulator: Android uses 10.0.2.2, iOS simulator uses localhost
const API_BASE_URL = __DEV__
  ? 'http://localhost:8000/api'
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

/* ── Quran.com public API ── */
const quranApi = axios.create({
  baseURL: 'https://api.quran.com/api/v4',
  headers: { 'Content-Type': 'application/json' },
  timeout: 30000,
});

const quranCdnApi = axios.create({
  baseURL: 'https://api.qurancdn.com/api/qdc',
  headers: { 'Content-Type': 'application/json' },
  timeout: 30000,
});

const QURAN_AUDIO_CDN = 'https://audio.qurancdn.com';
const QURAN_WBW_CDN = 'https://audio.qurancdn.com';

const apiService = {
  // Auth
  register: (data) => api.post('/auth/register', data),
  login: (data) => api.post('/auth/login', data),
  getMe: () => api.get('/auth/me'),
  updateProfile: (data) => api.put('/auth/profile', data),

  // Recitation (local backend — speech analysis)
  startStreamingAnalysis: (data) => api.post('/recitation/start-streaming', data),
  analyzeChunk: (data) => api.post('/recitation/analyze-chunk', data),
  finishStreamingAnalysis: (data) => api.post('/recitation/finish-streaming', data),

  // Free recitation (auto-detect position & verse-by-verse following)
  startFreeRecitation: (data) => api.post('/recitation/start-free', data),
  sendFreeChunk: (data) => api.post('/recitation/free-chunk', data),
  finishFreeRecitation: (data) => api.post('/recitation/finish-free', data),

  // Progress
  getProgress: (userId) => api.get(`/progress/${userId}`),
  markMemorized: (userId, verseId) =>
    api.post('/progress/memorize', { user_id: userId, verse_id: verseId }),
  getSessions: (userId) => api.get(`/sessions/${userId}`),

  // Quran (local backend)
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

  /* ══════════════════════════════════════════════════
     Quran.com API — rich verse data, audio, reciters
     ══════════════════════════════════════════════════ */

  /**
   * Fetch verses with word-by-word data for a chapter.
   * Returns words with: text_uthmani, tajweed markup, translation, transliteration
   * @param {number} chapterNumber 1-114
   * @param {number} page pagination page (default 1)
   * @param {number} perPage results per page (default 50, max 50)
   * @param {number} translationId e.g. 20 = Sahih International
   */
  getVersesWithWords: (chapterNumber, { page = 1, perPage = 50, translationId = 20 } = {}) =>
    quranApi.get(`/verses/by_chapter/${chapterNumber}`, {
      params: {
        language: 'en',
        words: true,
        word_fields: 'text_uthmani,text_uthmani_tajweed,location',
        translations: translationId,
        translation_fields: 'text',
        word_translation_language: 'en',
        per_page: perPage,
        page,
      },
    }),

  /**
   * Fetch tajweed-annotated verse text for a chapter.
   * Returns text_uthmani_tajweed with <tajweed class=...> markup.
   */
  getTajweedVerses: (chapterNumber) =>
    quranApi.get('/quran/verses/uthmani_tajweed', {
      params: { chapter_number: chapterNumber },
    }),

  /**
   * Fetch all available reciters from Quran.com.
   */
  getQuranComReciters: () =>
    quranApi.get('/resources/recitations', { params: { language: 'en' } }),

  /**
   * Fetch per-verse audio URLs for a reciter + chapter.
   * @param {number} reciterId e.g. 7 = Mishari al-Afasy
   * @param {number} chapterNumber
   */
  getVerseAudioUrls: (reciterId, chapterNumber) =>
    quranApi.get(`/recitations/${reciterId}/by_chapter/${chapterNumber}`),

  /**
   * Fetch chapter audio file with word-level timing segments.
   * Returns: audio_url (full chapter), verse_timings with segments [wordPos, startMs, endMs]
   * @param {number} reciterId e.g. 7 = Mishari al-Afasy
   * @param {number} chapterNumber
   */
  getAudioSegments: (reciterId, chapterNumber) =>
    quranCdnApi.get(`/audio/reciters/${reciterId}/audio_files`, {
      params: { chapter: chapterNumber, segments: true },
    }),

  /**
   * Build the full audio CDN URL from a relative path.
   */
  buildAudioUrl: (relativePath) => `${QURAN_AUDIO_CDN}/${relativePath}`,

  /**
   * Build word-by-word audio URL.
   * e.g. "wbw/001_001_001.mp3" → full CDN URL
   */
  buildWordAudioUrl: (relativePath) =>
    relativePath ? `${QURAN_WBW_CDN}/${relativePath}` : null,

  /* ── Quran.com Reciter ID mapping ── */
  QURAN_COM_RECITERS: {
    alafasy: 7,
    abdulbasit_murattal: 2,
    abdulbasit_mujawwad: 1,
    sudais: 3,
    shatri: 4,
    rifai: 5,
    husary: 6,
    husary_muallim: 12,
    minshawi_murattal: 9,
    minshawi_mujawwad: 8,
    shuraym: 10,
    tablawi: 11,
  },

  /**
   * Fetch verse-level translations for a chapter.
   * Returns array of { resource_id, text } in verse order.
   * @param {number} translationId resource ID (e.g. 20 = Sahih International)
   * @param {number} chapterNumber 1-114
   */
  getTranslations: (translationId, chapterNumber) =>
    quranApi.get(`/quran/translations/${translationId}`, {
      params: { chapter_number: chapterNumber },
    }),

  /* ── Translation ID mapping (matches Quran.com resource IDs) ── */
  TRANSLATION_IDS: {
    'en.sahih': 20,           // Saheeh International
    'en.khattab': 149,        // Fadel Soliman / Bridges (closest available)
    'en.yusufali': 22,        // Abdullah Yusuf Ali
    'en.pickthall': 19,       // Mohammed Marmaduke Pickthall
    'en.asad': 84,            // Mufti Taqi Usmani (closest available)
    'en.hilali': 203,         // Al-Hilali & Khan
  },

  /* ══════════════════════════════════════════════════
     Tafsir (commentary)
     ══════════════════════════════════════════════════ */

  /**
   * Fetch available tafsir sources filtered by language.
   * Returns array of { id, name, slug, language_name, translated_name }
   */
  getTafsirList: (language = 'en') =>
    quranApi.get('/resources/tafsirs', { params: { language } }),

  /**
   * Fetch tafsir content for a specific verse.
   * @param {number|string} tafsirId  e.g. 169 or 'en-tafisr-ibn-kathir'
   * @param {string} verseKey  e.g. '2:255'
   * Returns { tafsir: { text (HTML), resource_name, translated_name, verses } }
   */
  getTafsirContent: (tafsirId, verseKey) =>
    quranApi.get(`/tafsirs/${tafsirId}/by_ayah/${verseKey}`),

  /* ── Tafsir ID mapping ── */
  TAFSIR_IDS: {
    'en.ibn-kathir': 169,       // Ibn Kathir (Abridged) — English
    'en.tazkirul': 817,         // Tazkirul Quran — English
    'ar.tabari': 16,            // Tafsir al-Tabari — Arabic
    'ar.qurtubi': 93,           // Tafsir al-Qurtubi — Arabic
    'ar.ibn-kathir': 14,        // Tafsir Ibn Kathir — Arabic
    'ar.muyassar': 91,          // al-Tafsir al-Muyassar — Arabic
    'ar.baghawi': 94,           // Tafsir al-Baghawi — Arabic
  },

  /* ══════════════════════════════════════════════════
     Verses by Page (for mushaf rendering)
     ══════════════════════════════════════════════════ */

  /**
   * Fetch verses for a specific mushaf page with word-level data.
   * Words include line_number for proper mushaf line layout.
   * @param {number} pageNumber 1-604
   */
  getVersesByPage: (pageNumber) =>
    quranApi.get(`/verses/by_page/${pageNumber}`, {
      params: {
        language: 'en',
        words: true,
        word_fields: 'text_uthmani,code_v2,v2_page,line_number',
        per_page: 50,
      },
    }),
};

export default apiService;
