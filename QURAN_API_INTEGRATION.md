# Quran API Integration Guide

This document explains how the app integrates with the Al-Quran Cloud API to provide access to all 114 chapters, verses, and audio recitations.

## API Service

The backend includes a `quran_api.py` service that interfaces with the Al-Quran Cloud API (https://api.alquran.cloud).

### Features

1. **All 114 Chapters**: Access to every chapter (Surah) of the Quran
2. **Complete Verses**: All verses with Arabic text and translations
3. **Multiple Reciters**: 19 different reciters available
4. **Audio Playback**: Direct audio URLs for listening

## Available Reciters

The app supports the following reciters:

- Abdul Basit (Murattal & Mujawwad)
- Abdullah Basfar
- Abdur-Rahman As-Sudais
- Abu Bakr Ash-Shaatree
- Ahmed Ibn Ali Al-Ajamy
- **Mishary Rashid Alafasy** (default)
- Ali Jaber
- Hani Ar-Rifai
- Mahmoud Khalil Al-Husary
- Maher Al Muaiqly
- Abdul Rahman Al-Minshawi
- Muhammad Ayyoub
- Muhammad Jibreel
- Saad Al-Ghamdi
- Salaah Bukhatir
- Yasser Ad-Dussary

## API Endpoints

### Backend Endpoints

- `GET /api/quran/chapters` - Get all 114 chapters
- `GET /api/quran/chapters/<number>` - Get specific chapter with all verses
- `GET /api/quran/verses/<chapter>/<verse>` - Get specific verse
- `GET /api/quran/audio/<chapter>` - Get audio URL for chapter/verse
- `GET /api/quran/reciters` - Get list of available reciters

### Frontend Usage

```javascript
// Get all chapters
const chapters = await api.getQuranChapters();

// Get a chapter
const chapter = await api.getQuranChapter(1); // Al-Fatiha

// Get audio
const audio = await api.getChapterAudio(1, 1, 'alafasy'); // Chapter 1, Verse 1

// Get reciters
const reciters = await api.getReciters();
```

## Pages

### 1. Quran Browser Page (`/quran`)

- Browse all 114 chapters
- Search chapters by name
- View all verses in a chapter
- Listen to recitations from different reciters
- Navigate to practice page with pre-selected chapter/verse

### 2. Practice Page (`/practice`)

- Select any chapter and verse from the full Quran
- Listen to correct recitation before practicing
- Record and analyze your recitation
- Get feedback on pronunciation and Tajweed

## Audio URLs

The audio URLs are generated based on the reciter and verse/chapter. The format follows:

```
https://cdn.islamic.network/quran/audio/128/{reciter}/{chapter}/{verse}.mp3
```

Note: Some verses may not have audio available for all reciters. The app handles this gracefully.

## Translation Support

Currently using English translation (Sahih International) by default. The API supports multiple translations which can be added by modifying the `translation` parameter in API calls.

## Error Handling

- Network errors are caught and logged
- Missing audio gracefully fails without breaking the UI
- Fallback to sample verses if API is unavailable (for development)

## Future Enhancements

1. **Caching**: Cache chapters and verses locally to reduce API calls
2. **Offline Support**: Store frequently accessed chapters for offline use
3. **More Translations**: Add support for multiple languages
4. **Bookmarks**: Save favorite verses and chapters
5. **Reading Plans**: Structured reading schedules
6. **Tafsir**: Add commentary and explanations

## API Rate Limits

The Al-Quran Cloud API is free and public, but be mindful of:
- Rate limiting (though generous)
- Caching responses when possible
- Using appropriate timeouts

## Testing

To test the integration:

1. Start the backend server
2. Visit `/quran` page
3. Select a chapter (e.g., Al-Fatiha)
4. Click on a verse to hear the recitation
5. Try different reciters
6. Navigate to practice page and practice recitation

## Troubleshooting

**Chapters not loading:**
- Check internet connection
- Verify API endpoint is accessible
- Check browser console for errors

**Audio not playing:**
- Some verses may not have audio for all reciters
- Try a different reciter
- Check audio URL format

**Slow loading:**
- Consider implementing caching
- Load chapters on demand
- Use pagination for verses





