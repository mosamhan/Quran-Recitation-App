import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useUser } from '../context/UserContext';
import api from '../services/api';
import Navigation from '../components/Navigation';
import FloatingAudioPlayer from '../components/FloatingAudioPlayer';
import Bismillah from '../components/Bismillah';
import ChapterVerseSelector from '../components/ChapterVerseSelector';
import { useTheme } from '../context/ThemeContext';
import { getEncouragement, getSurahDifficulty, getDifficultyLabel, getDifficultyClass } from '../utils/adaptiveContent';
import './PracticePage.css';

const PracticePage = () => {
  const { user } = useUser();
  const { ageGroup } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const [isRecording, setIsRecording] = useState(false);
  const [audioBlob, setAudioBlob] = useState(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [result, setResult] = useState(null);
  const [streamingSessionKey, setStreamingSessionKey] = useState(null);
  const [realTimeMistakes, setRealTimeMistakes] = useState([]);
  const [recordingProgress, setRecordingProgress] = useState(0);
  const errorAudioRef = useRef(null);
  
  // Chapter and verse selection
  const [chapters, setChapters] = useState([]);
  const [selectedChapter, setSelectedChapter] = useState(null);
  const [selectedVerseIndex, setSelectedVerseIndex] = useState(0);
  const [verses, setVerses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingChapter, setLoadingChapter] = useState(false);
  
  // Audio
  const [audioUrl, setAudioUrl] = useState(null);
  const [selectedReciter, setSelectedReciter] = useState('alafasy');
  const [reciters, setReciters] = useState([]);
  const [showChapterVerseSelector, setShowChapterVerseSelector] = useState(false);
  
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const streamRef = useRef(null);
  const streamingSessionKeyRef = useRef(null);
  const isRecordingRef = useRef(false);

  useEffect(() => {
    if (!user) {
      navigate('/');
      return;
    }
    loadChapters();
    loadReciters();
    
    // Check if coming from QuranPage with pre-selected chapter/verse
    if (location.state?.chapter) {
      handleChapterSelect(location.state.chapter, location.state.verse);
    }
  }, [user, navigate]);

  const loadChapters = async () => {
    try {
      const response = await api.getQuranChapters();
      console.log('Chapters response:', response.data);
      const chaptersData = response.data?.chapters || response.data || [];
      setChapters(chaptersData);
      if (chaptersData.length > 0 && !location.state?.chapter) {
        // Default to first chapter
        handleChapterSelect(1);
      }
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

  const handleChapterVerseSelect = async (chapterNumber, verseNumber) => {
    setShowChapterVerseSelector(false);
    await handleChapterSelect(chapterNumber, verseNumber);
  };

  const handleChapterSelect = async (chapterNumber, verseNumber = 1) => {
    setLoadingChapter(true);
    setSelectedVerseIndex(0);
    setAudioUrl(null);
    setResult(null);
    setAudioBlob(null);
    
    try {
      const response = await api.getQuranChapter(chapterNumber);
      const chapterData = response.data;
      setSelectedChapter(chapterData);
      setVerses(chapterData.verses || []);
      
      // Find verse index if verseNumber provided
      if (verseNumber && chapterData.verses) {
        const verseIndex = chapterData.verses.findIndex(v => v.number_in_surah === verseNumber);
        if (verseIndex >= 0) {
          setSelectedVerseIndex(verseIndex);
          loadAudio(chapterNumber, verseNumber);
        } else if (chapterData.verses.length > 0) {
          loadAudio(chapterNumber, chapterData.verses[0].number_in_surah);
        }
      } else if (chapterData.verses && chapterData.verses.length > 0) {
        loadAudio(chapterNumber, chapterData.verses[0].number_in_surah);
      }
    } catch (error) {
      console.error('Error loading chapter:', error);
      alert('Error loading chapter. Please try again.');
    } finally {
      setLoadingChapter(false);
    }
  };

  const handleVerseSelect = (index) => {
    setSelectedVerseIndex(index);
    setResult(null);
    setAudioBlob(null);
    if (selectedChapter && verses[index]) {
      loadAudio(selectedChapter.number, verses[index].number_in_surah);
    }
  };

  const goToPreviousVerse = () => {
    if (selectedVerseIndex > 0) {
      handleVerseSelect(selectedVerseIndex - 1);
    }
  };

  const goToNextVerse = () => {
    if (selectedVerseIndex < verses.length - 1) {
      handleVerseSelect(selectedVerseIndex + 1);
    }
  };

  const loadAudio = async (chapterNumber, verseNumber, reciterId = null) => {
    try {
      const reciterToUse = reciterId || selectedReciter;
      const currentVerse = verses.find(v => v.number_in_surah === verseNumber);
      const absoluteNumber = currentVerse?.number; // Use absolute verse number if available
      
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
      }, 50);
    } catch (error) {
      console.error('Error loading audio:', error);
      // Audio might not be available for all verses
      setAudioUrl(null);
    }
  };

  const handleReciterChange = async (reciterId) => {
    console.log('Reciter changed to:', reciterId, 'from:', selectedReciter);
    const oldReciter = selectedReciter;
    setSelectedReciter(reciterId);
    
    // Force clear audio URL
    setAudioUrl(null);
    
    // Wait a bit for state to clear, then load new audio
    setTimeout(async () => {
      if (selectedChapter && verses[selectedVerseIndex]) {
        console.log('Loading audio with NEW reciter:', reciterId);
        await loadAudio(selectedChapter.number, verses[selectedVerseIndex].number_in_surah, reciterId);
      }
    }, 100);
  };

  // Create error sound
  useEffect(() => {
    // Create a simple error beep sound using Web Audio API
    const createErrorSound = () => {
      const audioContext = new (window.AudioContext || window.webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      oscillator.frequency.value = 400; // Error tone frequency
      oscillator.type = 'sine';
      
      gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.2);
      
      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.2);
      
      return audioContext;
    };
    
    errorAudioRef.current = createErrorSound;
  }, []);

  const playErrorSound = () => {
    if (errorAudioRef.current) {
      try {
        errorAudioRef.current();
      } catch (error) {
        console.error('Error playing sound:', error);
      }
    }
  };

  const startRecording = async () => {
    try {
      if (!verses[selectedVerseIndex] || !selectedChapter) {
        alert('Please select a verse first!');
        return;
      }

      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          sampleRate: 16000,
          channelCount: 1,
          echoCancellation: true,
          noiseSuppression: true
        }
      });
      
      streamRef.current = stream;
      
      // Start streaming analysis session
      const currentVerse = verses[selectedVerseIndex];
      const verseId = `${selectedChapter.number}:${currentVerse.number_in_surah}`;
      
      try {
        console.log('Starting streaming analysis session...');
        console.log('User ID:', user.id);
        console.log('Verse ID:', verseId);
        console.log('Expected text:', currentVerse.text);
        
        const sessionResponse = await api.startStreamingAnalysis({
          user_id: user.id,
          expected_text: currentVerse.text,
          verse_id: verseId
        });
        
        console.log('Session response:', sessionResponse.data);
        
        if (!sessionResponse.data.session_key) {
          throw new Error('No session key received from server');
        }
        
        const sessionKey = sessionResponse.data.session_key;
        setStreamingSessionKey(sessionKey);
        streamingSessionKeyRef.current = sessionKey; // Store in ref for event handlers
        setRealTimeMistakes([]);
        setRecordingProgress(0);
      } catch (error) {
        console.error('Error starting streaming session:', error);
        console.error('Error details:', error.response?.data || error.message);
        const errorMessage = error.response?.data?.error || error.message || 'Unknown error occurred';
        alert(`Error starting analysis session: ${errorMessage}\n\nPlease check:\n1. Backend server is running\n2. You are logged in\n3. Try refreshing the page`);
        stream.getTracks().forEach(track => track.stop());
        return;
      }

      // Set up MediaRecorder for final audio and real-time chunks
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'audio/webm;codecs=opus'
      });
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];
      
      // Track last analyzed chunk to avoid duplicates
      let lastChunkTime = 0;
      const CHUNK_INTERVAL_MS = 2000; // Analyze every 2 seconds

      // Handle data available events for real-time analysis
      mediaRecorder.ondataavailable = async (event) => {
        if (event.data.size > 0) {
          console.log('Audio chunk received, size:', event.data.size);
          // Store for final recording
          audioChunksRef.current.push(event.data);
          
          // Real-time analysis: convert chunk to base64 and analyze
          // Use refs instead of state (state might not be updated in event handlers)
          const currentSessionKey = streamingSessionKeyRef.current;
          const currentlyRecording = isRecordingRef.current;
          
          console.log('Checking if should analyze:', { currentSessionKey, currentlyRecording });
          
          if (currentSessionKey && currentlyRecording) {
            const currentTime = Date.now();
            
            // Only analyze if enough time has passed (avoid too frequent analysis)
            if (currentTime - lastChunkTime >= CHUNK_INTERVAL_MS) {
              lastChunkTime = currentTime;
              
              console.log('Processing chunk for real-time analysis...');
              
              try {
                // Convert blob to base64
                const reader = new FileReader();
                reader.onloadend = async () => {
                  try {
                    const base64Audio = reader.result;
                    console.log('Sending chunk for analysis, size:', base64Audio.length);
                    
                    // Send chunk for real-time analysis
                    const analysisResponse = await api.analyzeChunk({
                      session_key: currentSessionKey,
                      audio_chunk: base64Audio
                    });

                    const analysis = analysisResponse.data;
                    
                    console.log('Real-time analysis result:', analysis);
                    
                    // Update progress
                    if (analysis.progress !== undefined) {
                      setRecordingProgress(analysis.progress);
                    }

                    // If mistake detected, play error sound immediately
                    if (analysis.has_mistake && analysis.mistake_details) {
                      console.log('Mistake detected!', analysis.mistake_details);
                      playErrorSound();
                      setRealTimeMistakes(prev => {
                        // Avoid duplicate mistakes
                        const isDuplicate = prev.some(m => 
                          m.position === analysis.mistake_details.position &&
                          m.correct === analysis.mistake_details.correct
                        );
                        if (!isDuplicate) {
                          return [...prev, analysis.mistake_details];
                        }
                        return prev;
                      });
                    }
                  } catch (error) {
                    console.error('Error in real-time analysis:', error);
                    console.error('Error details:', error.response?.data || error.message);
                  }
                };
                
                reader.onerror = (error) => {
                  console.error('Error reading audio chunk:', error);
                };
                
                reader.readAsDataURL(event.data);
              } catch (error) {
                console.error('Error processing chunk for analysis:', error);
              }
            } else {
              console.log('Skipping chunk analysis - too soon since last analysis');
            }
          } else {
            console.log('Skipping chunk analysis - no session key or not recording');
          }
        }
      };

      mediaRecorder.onstop = async () => {
        console.log('Recording stopped, processing final audio...');
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        setAudioBlob(audioBlob);
        
        console.log('Audio blob size:', audioBlob.size);
        
        // Convert final audio to base64 for storage
        const reader = new FileReader();
        reader.onloadend = async () => {
          try {
            const finalAudioBase64 = reader.result;
            console.log('Final audio base64 length:', finalAudioBase64.length);
            
            // Get current session key from ref (more reliable than state)
            const currentSessionKey = streamingSessionKeyRef.current;
            console.log('Finishing analysis with session key:', currentSessionKey);
            
            // Finish streaming analysis with final audio
            if (currentSessionKey) {
              try {
                setAnalyzing(true);
                console.log('Calling finishStreamingAnalysis...');
                
                const finalResponse = await api.finishStreamingAnalysis({
                  session_key: currentSessionKey,
                  user_id: user.id,
                  verse_id: verseId,
                  audio_data: finalAudioBase64,
                  client_session_id: `session_${Date.now()}`,
                  platform: 'web'
                });
                
                console.log('Final analysis response:', finalResponse.data);
                
                setResult(finalResponse.data);
                setStreamingSessionKey(null);
                streamingSessionKeyRef.current = null; // Clear ref too
              } catch (error) {
                console.error('Error finishing analysis:', error);
                console.error('Error details:', error.response?.data || error.message);
                alert(`Error finishing analysis: ${error.response?.data?.error || error.message || 'Unknown error'}\n\nPlease try again!`);
              } finally {
                setAnalyzing(false);
              }
            } else {
              console.error('No session key available for finishing analysis');
              alert('Error: No active analysis session. Please try recording again.');
            }
          } catch (error) {
            console.error('Error processing final audio:', error);
            alert('Error processing final audio. Please try again!');
            setAnalyzing(false);
          }
        };
        
        reader.onerror = (error) => {
          console.error('FileReader error:', error);
          alert('Error reading audio file. Please try again!');
          setAnalyzing(false);
        };
        
        reader.readAsDataURL(audioBlob);
        stream.getTracks().forEach(track => track.stop());
      };

      // Start recording with timeslice to get chunks for real-time analysis
      // timeslice: 2000ms = get chunks every 2 seconds for analysis
      console.log('Starting MediaRecorder with 2 second timeslice...');
      isRecordingRef.current = true; // Set ref immediately
      mediaRecorder.start(2000);
      setIsRecording(true);
      console.log('Recording started, isRecording set to true');

    } catch (error) {
      console.error('Error accessing microphone:', error);
      alert('Please allow microphone access to use this feature!');
    }
  };


  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      console.log('Stopping recording...');
      isRecordingRef.current = false; // Set ref immediately
      // Stop media recorder (this will trigger onstop which handles final analysis)
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const analyzeRecitation = async () => {
    console.log('Analyze button clicked');
    console.log('audioBlob:', audioBlob);
    console.log('user:', user);
    console.log('verses[selectedVerseIndex]:', verses[selectedVerseIndex]);
    console.log('selectedChapter:', selectedChapter);
    
    if (!audioBlob) {
      console.error('No audio blob available');
      alert('Please record your recitation first!');
      return;
    }
    
    if (!user) {
      console.error('No user available');
      alert('Please log in first!');
      return;
    }
    
    if (!verses[selectedVerseIndex]) {
      console.error('No verse selected');
      alert('Please select a verse first!');
      return;
    }

    setAnalyzing(true);
    setResult(null);

    const reader = new FileReader();
    
    reader.onloadend = async () => {
      try {
        const base64Audio = reader.result;
        if (!base64Audio) {
          throw new Error('Failed to read audio file');
        }
        
        const currentVerse = verses[selectedVerseIndex];
        if (!currentVerse) {
          throw new Error('No verse selected');
        }
        
        const verseId = `${selectedChapter.number}:${currentVerse.number_in_surah}`;

        console.log('Sending analysis request...');
        console.log('Verse ID:', verseId);
        console.log('Expected text length:', currentVerse.text?.length);
        console.log('Audio data length:', base64Audio.length);

        const response = await api.analyzeRecitation({
          user_id: user.id,
          audio_data: base64Audio,
          expected_text: currentVerse.text,
          verse_id: verseId
        });

        console.log('Analysis response:', response.data);
        setResult(response.data);
        setAnalyzing(false);
      } catch (error) {
        console.error('Error in reader.onloadend:', error);
        console.error('Error details:', error.response?.data || error.message);
        console.error('Full error:', error);
        alert(`Error analyzing your recitation: ${error.response?.data?.error || error.message || 'Unknown error'}. Please try again!`);
        setAnalyzing(false);
      }
    };
    
    reader.onerror = (error) => {
      console.error('FileReader error:', error);
      alert('Error reading audio file. Please try again!');
      setAnalyzing(false);
    };
    
    try {
      reader.readAsDataURL(audioBlob);
    } catch (error) {
      console.error('Error starting FileReader:', error);
      alert('Error processing audio file. Please try again!');
      setAnalyzing(false);
    }
  };

  const resetPractice = () => {
    setAudioBlob(null);
    setResult(null);
    setIsRecording(false);
    setStreamingSessionKey(null);
    setRealTimeMistakes([]);
    setRecordingProgress(0);
    
    // Clean up stream
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
  };

  const markAsMemorized = async () => {
    if (!user || !verses[selectedVerseIndex]) return;
    try {
      const currentVerse = verses[selectedVerseIndex];
      const verseId = `${selectedChapter.number}:${currentVerse.number_in_surah}`;
      await api.markMemorized(user.id, verseId);
      alert('Great job! This verse has been marked as memorized! 🎉');
    } catch (error) {
      console.error('Error marking as memorized:', error);
    }
  };

  if (!user || loading) {
    return (
      <div className="practice-page">
        <Navigation />
        <div className="container">
          <div className="practice-card">
            <div className="loading">Loading...</div>
          </div>
        </div>
      </div>
    );
  }

  const currentVerse = verses[selectedVerseIndex];
  const verseInfo = currentVerse && selectedChapter 
    ? `${selectedChapter.name_arabic} - Verse ${currentVerse.number_in_surah} of ${selectedChapter.number_of_verses}`
    : null;

  return (
    <div className="practice-page">
      <Navigation />
      <div className="container">
        <div className="practice-card">

          <div className="selection-section">
            <div className="chapter-verse-selector-button">
              <button
                onClick={() => setShowChapterVerseSelector(true)}
                className="btn-primary select-chapter-verse-btn"
              >
                {selectedChapter && verses[selectedVerseIndex]
                  ? `📖 ${selectedChapter.name_arabic} - Verse ${verses[selectedVerseIndex].number_in_surah}`
                  : '📖 Select Chapter & Verse'}
              </button>
            </div>
          </div>

          {loadingChapter ? (
            <div className="loading">Loading chapter...</div>
          ) : verses[selectedVerseIndex] ? (
            <>
              <div className="verse-navigation">
                <button
                  onClick={goToPreviousVerse}
                  disabled={selectedVerseIndex === 0}
                  className="nav-arrow-btn"
                  title="Previous verse"
                >
                  ← Previous
                </button>
                
                <div className="verse-indicator">
                  <span className="verse-counter">
                    Verse {currentVerse.number_in_surah} of {selectedChapter.number_of_verses}
                  </span>
                  <span className="verse-chapter-info">
                    {selectedChapter.name_arabic} ({selectedChapter.number})
                  </span>
                </div>
                
                <button
                  onClick={goToNextVerse}
                  disabled={selectedVerseIndex === verses.length - 1}
                  className="nav-arrow-btn"
                  title="Next verse"
                >
                  Next →
                </button>
              </div>

              {/* Show Bismillah for all chapters except Al-Fatiha (chapter 1) */}
              {selectedChapter.number !== 1 && <Bismillah />}

              <div className="verse-display">
                <div className="verse-header">
                  <span className="verse-label">
                    {selectedChapter.name_arabic} - Verse {currentVerse.number_in_surah}
                  </span>
                  <span className={`difficulty-badge ${getDifficultyClass(getSurahDifficulty(selectedChapter.number))}`}>
                    {getDifficultyLabel(getSurahDifficulty(selectedChapter.number), ageGroup)}
                  </span>
                </div>
                <div className="arabic-text">{currentVerse.text}</div>
                {currentVerse.translation && (
                  <div className="verse-translation">{currentVerse.translation}</div>
                )}
              </div>

              <div className="recording-controls">
                {!isRecording && !audioBlob && (
                  <button onClick={startRecording} className="btn-primary record-btn">
                    🎤 Start Recording
                  </button>
                )}

                {isRecording && (
                  <div className="recording-status">
                    <div className="recording-indicator"></div>
                    <div className="recording-info">
                      <p>Recording... {recordingProgress > 0 && `${recordingProgress.toFixed(0)}%`}</p>
                      {realTimeMistakes.length > 0 && (
                        <p className="mistakes-count">⚠️ {realTimeMistakes.length} mistake{realTimeMistakes.length !== 1 ? 's' : ''} detected</p>
                      )}
                    </div>
                    <button onClick={stopRecording} className="btn-secondary">
                      ⏹ Stop Recording
                    </button>
                  </div>
                )}

                {audioBlob && !analyzing && !result && (
                  <div className="audio-actions">
                    <p className="recording-complete">Recording complete! Analysis in progress...</p>
                    <button onClick={resetPractice} className="btn-secondary">
                      🔄 Try Again
                    </button>
                  </div>
                )}

                {analyzing && (
                  <div className="analyzing">
                    <div className="spinner"></div>
                    <p>Analyzing your recitation...</p>
                  </div>
                )}
              </div>

              {result && (
                <div className="result-card">
                  <div className="accuracy-display">
                    <h3>Your Score: {result.accuracy}%</h3>
                    <div className="accuracy-bar">
                      <div
                        className="accuracy-fill"
                        style={{ width: `${result.accuracy}%` }}
                      ></div>
                    </div>
                  </div>

                  <div className="feedback-message">
                    {getEncouragement(result.accuracy, ageGroup, user?.experience_level)}
                  </div>

                  {result.mistakes && result.mistakes.length > 0 && (
                    <div className="mistakes-section">
                      <h4>Mistakes to Fix:</h4>
                      {result.mistakes.map((mistake, index) => (
                        <div key={index} className="mistake-item">
                          <div className="mistake-type">{mistake.type}</div>
                          <div className="mistake-details">
                            <span className="incorrect">❌ {mistake.incorrect || 'Missing'}</span>
                            <span className="correct">✅ {mistake.correct || 'Should be'}</span>
                          </div>
                          {mistake.suggestion && (
                            <div className="mistake-suggestion">💡 {mistake.suggestion}</div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="result-actions">
                    <button onClick={resetPractice} className="btn-primary">
                      🔄 Practice Again
                    </button>
                    <button onClick={markAsMemorized} className="btn-secondary">
                      ⭐ Mark as Memorized
                    </button>
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="welcome-message">
              <p>Select a chapter to start practicing!</p>
              <button
                onClick={() => navigate('/quran')}
                className="btn-primary"
              >
                📖 Browse Quran
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Floating Audio Player */}
      {audioUrl && (
        <FloatingAudioPlayer
          audioUrl={audioUrl}
          reciterName={reciters.find(r => r.id === selectedReciter)?.name}
          verseInfo={verseInfo}
          reciters={reciters}
          selectedReciter={selectedReciter}
          onReciterChange={handleReciterChange}
        />
      )}

      {/* Chapter & Verse Selector Modal */}
      <ChapterVerseSelector
        isOpen={showChapterVerseSelector}
        onClose={() => setShowChapterVerseSelector(false)}
        onSelect={handleChapterVerseSelect}
        currentChapter={selectedChapter?.number}
        currentVerse={verses[selectedVerseIndex]?.number_in_surah}
      />
    </div>
  );
};

export default PracticePage;
