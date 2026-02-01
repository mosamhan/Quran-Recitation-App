import React, { useState, useEffect } from 'react';
import api from '../services/api';
import './ChapterVerseSelector.css';

const ChapterVerseSelector = ({ isOpen, onClose, onSelect, currentChapter, currentVerse }) => {
  const [chapters, setChapters] = useState([]);
  const [selectedChapter, setSelectedChapter] = useState(null);
  const [verses, setVerses] = useState([]);
  const [loadingChapters, setLoadingChapters] = useState(true);
  const [loadingVerses, setLoadingVerses] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    if (isOpen) {
      loadChapters();
      if (currentChapter) {
        loadChapterVerses(currentChapter);
      }
    }
  }, [isOpen, currentChapter]);

  const loadChapters = async () => {
    try {
      const response = await api.getQuranChapters();
      setChapters(response.data?.chapters || response.data || []);
    } catch (error) {
      console.error('Error loading chapters:', error);
    } finally {
      setLoadingChapters(false);
    }
  };

  const loadChapterVerses = async (chapterNumber) => {
    setLoadingVerses(true);
    try {
      const response = await api.getQuranChapter(chapterNumber);
      setSelectedChapter(response.data);
      setVerses(response.data.verses || []);
    } catch (error) {
      console.error('Error loading verses:', error);
    } finally {
      setLoadingVerses(false);
    }
  };

  const handleChapterSelect = (chapter) => {
    setSelectedChapter(chapter);
    loadChapterVerses(chapter.number);
    setSearchTerm(''); // Clear search when selecting chapter
  };

  const handleVerseSelect = (verse) => {
    if (onSelect) {
      onSelect(selectedChapter.number, verse.number_in_surah);
    }
    onClose();
  };

  const handleBack = () => {
    setSelectedChapter(null);
    setVerses([]);
    setSearchTerm('');
  };

  const filteredChapters = chapters.filter(chapter =>
    chapter.name_simple?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    chapter.english_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    chapter.number?.toString().includes(searchTerm)
  );

  if (!isOpen) return null;

  return (
    <div className="selector-modal-overlay" onClick={onClose}>
      <div className="selector-modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="selector-modal-header">
          <h3>Select Chapter & Verse</h3>
          <button className="selector-close-btn" onClick={onClose}>×</button>
        </div>

        <div className="selector-modal-body">
          {!selectedChapter ? (
            // Chapter Selection View
            <>
              <div className="selector-search">
                <input
                  type="text"
                  placeholder="🔍 Search chapters..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="selector-search-input"
                />
              </div>

              {loadingChapters ? (
                <div className="selector-loading">Loading chapters...</div>
              ) : (
                <div className="chapters-grid">
                  {filteredChapters.map((chapter) => (
                    <div
                      key={chapter.number}
                      className={`chapter-card ${currentChapter === chapter.number ? 'current' : ''}`}
                      onClick={() => handleChapterSelect(chapter)}
                    >
                      <div className="chapter-card-number">{chapter.number}</div>
                      <div className="chapter-card-content">
                        <div className="chapter-card-arabic">{chapter.name_arabic}</div>
                        <div className="chapter-card-english">{chapter.name_simple}</div>
                        <div className="chapter-card-meta">
                          {chapter.number_of_verses} verses
                        </div>
                      </div>
                      <div className="chapter-card-arrow">→</div>
                    </div>
                  ))}
                </div>
              )}
            </>
          ) : (
            // Verse Selection View
            <>
              <div className="verse-selector-header">
                <button onClick={handleBack} className="back-button">
                  ← Back to Chapters
                </button>
                <div className="selected-chapter-info">
                  <span className="chapter-name-arabic">{selectedChapter.name_arabic}</span>
                  <span className="chapter-name-english">{selectedChapter.name_simple}</span>
                </div>
              </div>

              {loadingVerses ? (
                <div className="selector-loading">Loading verses...</div>
              ) : (
                <div className="verses-grid">
                  {verses.map((verse) => (
                    <div
                      key={verse.number}
                      className={`verse-card ${currentChapter === selectedChapter.number && currentVerse === verse.number_in_surah ? 'current' : ''}`}
                      onClick={() => handleVerseSelect(verse)}
                    >
                      <div className="verse-card-number">{verse.number_in_surah}</div>
                      <div className="verse-card-preview">
                        <div className="verse-card-text">{verse.text.substring(0, 50)}...</div>
                        {verse.translation && (
                          <div className="verse-card-translation">
                            {verse.translation.substring(0, 60)}...
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default ChapterVerseSelector;





