import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUser } from '../context/UserContext';
import api from '../services/api';
import Navigation from '../components/Navigation';
import FloatingAudioPlayer from '../components/FloatingAudioPlayer';
import Bismillah from '../components/Bismillah';
import { useTheme } from '../context/ThemeContext';
import { getSurahDifficulty, getDifficultyLabel, getDifficultyClass, isRecommended } from '../utils/adaptiveContent';
import TajweedText from '../components/TajweedText';
import './QuranPage.css';

const QuranPage = () => {
  const { user } = useUser();
  const { ageGroup } = useTheme();
  const navigate = useNavigate();
  const [chapters, setChapters] = useState([]);
  const [selectedChapter, setSelectedChapter] = useState(null);
  const [selectedVerse, setSelectedVerse] = useState(null);
  const [reciters, setReciters] = useState([]);
  const [selectedReciter, setSelectedReciter] = useState('alafasy');
  const [audioUrl, setAudioUrl] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadingChapter, setLoadingChapter] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [shouldAutoplay, setShouldAutoplay] = useState(false);

  useEffect(() => {
    if (!user) {
      navigate('/');
      return;
    }
    loadChapters();
    loadReciters();
  }, [user, navigate]);

  const loadChapters = async () => {
    try {
      const response = await api.getQuranChapters();
      console.log('Chapters response:', response.data);
      const chaptersData = response.data?.chapters || response.data || [];
      setChapters(chaptersData);
    } catch (error) {
      console.error('Error loading chapters:', error);
      setChapters([]);
    } finally {
      setLoading(false);
    }
  };

  const loadReciters = async () => {
    try {
      const response = await api.getReciters();
      console.log('Reciters response:', response.data);
      const recitersData = response.data?.reciters || response.data || [];
      setReciters(recitersData);
    } catch (error) {
      console.error('Error loading reciters:', error);
      setReciters([]);
    }
  };

  const handleChapterSelect = async (chapterNumber) => {
    setLoadingChapter(true);
    setSelectedVerse(null);
    setAudioUrl(null);
    
    try {
      const response = await api.getQuranChapter(chapterNumber);
      setSelectedChapter(response.data);
      // Auto-load audio for first verse
      if (response.data.verses && response.data.verses.length > 0) {
        loadAudio(chapterNumber, response.data.verses[0].number_in_surah);
      }
    } catch (error) {
      console.error('Error loading chapter:', error);
      alert('Error loading chapter. Please try again.');
    } finally {
      setLoadingChapter(false);
    }
  };

  const handleVerseSelect = (verse, autoplay = false) => {
    setSelectedVerse(verse);
    setShouldAutoplay(autoplay);
    if (selectedChapter) {
      loadAudio(selectedChapter.number, verse.number_in_surah);
    }
  };

  const handlePreviousVerse = async () => {
    if (!selectedChapter || !selectedVerse) return;
    
    const currentIndex = selectedChapter.verses.findIndex(v => v.number === selectedVerse.number);
    if (currentIndex > 0) {
      // Go to previous verse in same chapter
      const previousVerse = selectedChapter.verses[currentIndex - 1];
      handleVerseSelect(previousVerse, true); // Autoplay enabled
    } else if (selectedChapter.number > 1) {
      // Go to last verse of previous chapter
      try {
        const prevChapterResponse = await api.getQuranChapter(selectedChapter.number - 1);
        const prevChapter = prevChapterResponse.data;
        setSelectedChapter(prevChapter);
        if (prevChapter.verses && prevChapter.verses.length > 0) {
          const lastVerse = prevChapter.verses[prevChapter.verses.length - 1];
          handleVerseSelect(lastVerse, true); // Autoplay enabled
        }
      } catch (error) {
        console.error('Error loading previous chapter:', error);
      }
    }
  };

  const handleNextVerse = async () => {
    if (!selectedChapter || !selectedVerse) return;
    
    const currentIndex = selectedChapter.verses.findIndex(v => v.number === selectedVerse.number);
    if (currentIndex < selectedChapter.verses.length - 1) {
      // Go to next verse in same chapter
      const nextVerse = selectedChapter.verses[currentIndex + 1];
      handleVerseSelect(nextVerse, true); // Autoplay enabled
    } else if (selectedChapter.number < 114) {
      // Go to first verse of next chapter
      try {
        const nextChapterResponse = await api.getQuranChapter(selectedChapter.number + 1);
        const nextChapter = nextChapterResponse.data;
        setSelectedChapter(nextChapter);
        if (nextChapter.verses && nextChapter.verses.length > 0) {
          const firstVerse = nextChapter.verses[0];
          handleVerseSelect(firstVerse, true); // Autoplay enabled
        }
      } catch (error) {
        console.error('Error loading next chapter:', error);
      }
    }
  };

  const loadAudio = async (chapterNumber, verseNumber, reciterId = null) => {
    try {
      const reciterToUse = reciterId || selectedReciter;
      // Find the verse to get its absolute number
      const verse = selectedChapter?.verses?.find(v => v.number_in_surah === verseNumber);
      const absoluteNumber = verse?.number;
      
      console.log('Loading audio with reciter:', reciterToUse, 'for verse:', verseNumber);
      
      const response = await api.getChapterAudio(
        chapterNumber, 
        verseNumber, 
        reciterToUse,
        absoluteNumber
      );
      
      // Use the base URL without adding timestamp here - let the player handle it
      const baseUrl = response.data.audio_url;
      console.log('Audio URL received:', baseUrl);
      console.log('Setting audio URL to trigger reload');
      
      // Clear first, then set to force React to see it as a new value
      setAudioUrl(null);
      
      // Use setTimeout to ensure state update happens
      setTimeout(() => {
        setAudioUrl(baseUrl);
        // Reset autoplay flag after a delay to allow it to be used
        if (shouldAutoplay) {
          setTimeout(() => {
            setShouldAutoplay(false);
          }, 1000);
        }
      }, 50);
    } catch (error) {
      console.error('Error loading audio:', error);
      // Audio might not be available for all verses
      setAudioUrl(null);
      setShouldAutoplay(false);
    }
  };

  const handleReciterChange = async (reciterId) => {
    console.log('Reciter changed to:', reciterId, 'from:', selectedReciter);
    setSelectedReciter(reciterId);
    
    // Force clear audio URL
    setAudioUrl(null);
    
    // Wait a bit for state to clear, then load new audio
    setTimeout(async () => {
      if (selectedChapter && selectedVerse) {
        console.log('Loading audio with NEW reciter:', reciterId);
        await loadAudio(selectedChapter.number, selectedVerse.number_in_surah, reciterId);
      } else if (selectedChapter && selectedChapter.verses && selectedChapter.verses.length > 0) {
        console.log('Loading audio with NEW reciter:', reciterId);
        await loadAudio(selectedChapter.number, selectedChapter.verses[0].number_in_surah, reciterId);
      }
    }, 100);
  };

  const filteredChapters = chapters.filter(chapter =>
    chapter.name_simple?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    chapter.english_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    chapter.number?.toString().includes(searchTerm)
  );

  const selectedReciterName = reciters.find(r => r.id === selectedReciter)?.name || selectedReciter;

  if (!user || loading) {
    return (
      <div className="quran-page">
        <Navigation />
        <div className="container">
          <div className="loading">Loading chapters...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="quran-page">
      <Navigation />
      <div className="container">

        <div className="quran-layout">
          {/* Chapters Sidebar */}
          <div className="chapters-sidebar">
            <div className="search-box">
              <input
                type="text"
                placeholder="🔍 Search chapters..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="search-input"
              />
            </div>
            
            <div className="chapters-list">
              {filteredChapters.map((chapter) => {
                const difficulty = getSurahDifficulty(chapter.number);
                const recommended = isRecommended(chapter.number, user?.experience_level);
                return (
                  <div
                    key={chapter.number}
                    className={`chapter-item ${selectedChapter?.number === chapter.number ? 'active' : ''}`}
                    onClick={() => handleChapterSelect(chapter.number)}
                  >
                    <div className="chapter-number">{chapter.number}</div>
                    <div className="chapter-info">
                      <div className="chapter-name-arabic">{chapter.name_arabic}</div>
                      <div className="chapter-name-english">
                        {chapter.name_simple}
                        {user?.experience_level === 'beginner' && recommended && (
                          <span className="recommended-badge">Recommended</span>
                        )}
                      </div>
                      <div className="chapter-meta">
                        {chapter.number_of_verses} verses • {chapter.revelation_type}
                        <span className={`difficulty-badge ${getDifficultyClass(difficulty)}`}>
                          {getDifficultyLabel(difficulty, ageGroup)}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Main Content */}
          <div className="quran-content">
            {loadingChapter ? (
              <div className="loading">Loading chapter...</div>
            ) : selectedChapter ? (
              <>
                <div className="chapter-header">
                  <h3 className="chapter-title">
                    {selectedChapter.name_arabic} ({selectedChapter.number})
                  </h3>
                  <p className="chapter-subtitle">
                    {selectedChapter.english_name} • {selectedChapter.english_name_translation}
                  </p>
                  <p className="chapter-info-text">
                    {selectedChapter.number_of_verses} verses • {selectedChapter.revelation_type}
                  </p>
                </div>

                <div className="chapter-navigation">
                  <button
                    onClick={() => {
                      if (selectedChapter && selectedChapter.number > 1) {
                        handleChapterSelect(selectedChapter.number - 1);
                      }
                    }}
                    disabled={!selectedChapter || selectedChapter.number === 1}
                    className="chapter-nav-btn"
                  >
                    ← Previous Chapter
                  </button>
                  
                  <div className="chapter-nav-info">
                    Chapter {selectedChapter.number} of 114
                  </div>
                  
                  <button
                    onClick={() => {
                      if (selectedChapter && selectedChapter.number < 114) {
                        handleChapterSelect(selectedChapter.number + 1);
                      }
                    }}
                    disabled={!selectedChapter || selectedChapter.number === 114}
                    className="chapter-nav-btn"
                  >
                    Next Chapter →
                  </button>
                </div>

                {/* Show Bismillah for all chapters except Al-Fatiha (chapter 1) */}
                {selectedChapter.number !== 1 && <Bismillah />}

                <div className="verses-container">
                  {selectedChapter.verses?.map((verse) => (
                    <div
                      key={verse.number}
                      className={`verse-item ${selectedVerse?.number === verse.number ? 'selected' : ''}`}
                      onClick={() => handleVerseSelect(verse)}
                    >
                      <div className="verse-number">{verse.number_in_surah}</div>
                      <div className="verse-content">
                        <div className="verse-text-arabic">
                          <TajweedText text={verse.text} showRules={true} />
                        </div>
                        {verse.translation && (
                          <div className="verse-text-translation">{verse.translation}</div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                <div className="chapter-actions">
                  <button
                    onClick={() => navigate('/practice', { 
                      state: { 
                        chapter: selectedChapter.number,
                        verse: selectedVerse?.number_in_surah || 1
                      }
                    })}
                    className="btn-primary"
                  >
                    🎤 Practice This Chapter
                  </button>
                </div>
              </>
            ) : (
              <div className="welcome-message">
                <div className="welcome-emoji">📖✨</div>
                <h3>Welcome to the Quran Browser!</h3>
                <p>Select a chapter from the sidebar to start reading and listening.</p>
                <p>You can also practice recitation by clicking "Practice This Chapter" after selecting a chapter.</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Floating Audio Player */}
      {audioUrl && selectedVerse && (
        <FloatingAudioPlayer
          audioUrl={audioUrl}
          reciterName={selectedReciterName}
          verseInfo={selectedChapter ? `${selectedChapter.name_arabic} - Verse ${selectedVerse.number_in_surah}` : null}
          reciters={reciters}
          selectedReciter={selectedReciter}
          onReciterChange={handleReciterChange}
          onPrevious={handlePreviousVerse}
          onNext={handleNextVerse}
          showNavigation={true}
          autoplay={shouldAutoplay}
        />
      )}
    </div>
  );
};

export default QuranPage;

