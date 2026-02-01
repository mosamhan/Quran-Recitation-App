import React, { useState, useRef, useEffect } from 'react';
import ReciterModal from './ReciterModal';
import './FloatingAudioPlayer.css';

const FloatingAudioPlayer = ({ 
  audioUrl, 
  reciterName, 
  verseInfo, 
  onClose, 
  reciters, 
  selectedReciter, 
  onReciterChange,
  onPrevious,
  onNext,
  showNavigation = false,
  autoplay = false
}) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMinimized, setIsMinimized] = useState(false);
  const [showReciterModal, setShowReciterModal] = useState(false);
  const audioRef = useRef(null);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const updateTime = () => setCurrentTime(audio.currentTime);
    const updateDuration = () => setDuration(audio.duration);
    const handleEnded = () => {
      setIsPlaying(false);
      // Auto-advance to next verse if navigation is available
      if (onNext && showNavigation) {
        setTimeout(() => {
          if (onNext) {
            onNext();
          }
        }, 500); // Small delay for smooth transition
      }
    };
    const handleError = (e) => {
      console.error('Audio error:', e);
      setIsPlaying(false);
    };

    audio.addEventListener('timeupdate', updateTime);
    audio.addEventListener('loadedmetadata', updateDuration);
    audio.addEventListener('ended', handleEnded);
    audio.addEventListener('error', handleError);

    return () => {
      audio.removeEventListener('timeupdate', updateTime);
      audio.removeEventListener('loadedmetadata', updateDuration);
      audio.removeEventListener('ended', handleEnded);
      audio.removeEventListener('error', handleError);
    };
  }, [audioUrl, onNext, showNavigation]);

  useEffect(() => {
    if (audioUrl && audioRef.current) {
      const audio = audioRef.current;
      
      // Stop current playback
      audio.pause();
      audio.currentTime = 0;
      setIsPlaying(false);
      setCurrentTime(0);
      setDuration(0);
      
      // Add cache-busting to URL
      const cleanUrl = audioUrl.split('?')[0];
      const newUrl = `${cleanUrl}?t=${Date.now()}`;
      
      // Set new source
      audio.src = newUrl;
      audio.load();
      
      console.log('Audio player loaded new URL:', newUrl);
      
      // Autoplay if autoplay prop is true
      if (autoplay) {
        const attemptAutoplay = () => {
          if (!audioRef.current) {
            return;
          }
          
          const audioEl = audioRef.current;
          
          // Check if audio is ready
          if (audioEl.readyState >= 2) {
            audioEl.play()
              .then(() => {
                setIsPlaying(true);
              })
              .catch(err => {
                console.error('Error autoplaying:', err);
              });
          } else {
            // Wait for audio to be ready
            const canPlayHandler = () => {
              if (audioRef.current) {
                audioRef.current.play()
                  .then(() => {
                    setIsPlaying(true);
                  })
                  .catch(err => {
                    console.error('Error autoplaying after canplay:', err);
                  });
              }
            };
            
            audioEl.addEventListener('canplay', canPlayHandler, { once: true });
            
            // Fallback timeout
            setTimeout(() => {
              if (audioRef.current && audioRef.current.readyState >= 2) {
                if (audioRef.current.paused) {
                  audioRef.current.play()
                    .then(() => {
                      setIsPlaying(true);
                    })
                    .catch(err => {
                      console.error('Error autoplaying (fallback):', err);
                    });
                }
              }
            }, 2000);
          }
        };
        
        // Try to play after audio loads
        setTimeout(attemptAutoplay, 300);
      }
    }
  }, [audioUrl, autoplay]);

  const togglePlay = () => {
    const audio = audioRef.current;
    if (!audio) return;

    if (isPlaying) {
      audio.pause();
      setIsPlaying(false);
    } else {
      // Ensure audio is loaded before playing
      if (!audio.src || audio.readyState === 0) {
        audio.load();
      }
      
      const playPromise = audio.play();
      if (playPromise !== undefined) {
        playPromise
          .then(() => {
            setIsPlaying(true);
          })
          .catch(err => {
            console.error('Error playing audio:', err);
            console.log('Audio URL:', audioUrl);
            console.log('Audio src:', audio.src);
            console.log('Audio readyState:', audio.readyState);
            setIsPlaying(false);
          });
      }
    }
  };

  const handleSeek = (e) => {
    const audio = audioRef.current;
    if (!audio) return;
    const newTime = (e.target.value / 100) * duration;
    audio.currentTime = newTime;
    setCurrentTime(newTime);
  };

  const handleVolumeChange = (e) => {
    const newVolume = e.target.value;
    setVolume(newVolume);
    if (audioRef.current) {
      audioRef.current.volume = newVolume;
    }
  };

  const formatTime = (seconds) => {
    if (!seconds || isNaN(seconds)) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (!audioUrl) return null;

  const progress = duration ? (currentTime / duration) * 100 : 0;

  return (
    <div className={`floating-audio-player ${isMinimized ? 'minimized' : ''}`}>
      <audio ref={audioRef} preload="metadata" />
      
      <div className="player-header">
        <div className="player-info">
          {verseInfo && (
            <div className="verse-info-small">
              {verseInfo}
            </div>
          )}
          {reciterName && (
            <div className="reciter-info-small">
              {reciterName}
              {reciters && reciters.length > 0 && (
                <button 
                  onClick={() => setShowReciterModal(true)}
                  className="change-reciter-btn"
                  title="Change reciter"
                >
                  🔄
                </button>
              )}
            </div>
          )}
        </div>
        <div className="player-controls-header">
          <button onClick={() => setIsMinimized(!isMinimized)} className="minimize-btn">
            {isMinimized ? '▲' : '▼'}
          </button>
          {onClose && (
            <button onClick={onClose} className="close-btn">×</button>
          )}
        </div>
      </div>

      {!isMinimized && (
        <div className="player-body">
          <div className="audio-controls-main">
            {showNavigation && onPrevious && (
              <button 
                onClick={onPrevious} 
                className="nav-audio-btn"
                title="Previous verse"
              >
                ⏮️
              </button>
            )}
            
            <button onClick={togglePlay} className="play-pause-btn-floating">
              {isPlaying ? '⏸️' : '▶️'}
            </button>
            
            {showNavigation && onNext && (
              <button 
                onClick={onNext} 
                className="nav-audio-btn"
                title="Next verse"
              >
                ⏭️
              </button>
            )}
            
            <div className="progress-container-floating">
              <span className="time-display-floating">{formatTime(currentTime)}</span>
              <input
                type="range"
                min="0"
                max="100"
                value={progress}
                onChange={handleSeek}
                className="progress-bar-floating"
              />
              <span className="time-display-floating">{formatTime(duration)}</span>
            </div>

            <div className="volume-container-floating">
              <span>🔊</span>
              <input
                type="range"
                min="0"
                max="1"
                step="0.1"
                value={volume}
                onChange={handleVolumeChange}
                className="volume-bar-floating"
              />
            </div>
          </div>
        </div>
      )}

      {reciters && reciters.length > 0 && (
        <ReciterModal
          isOpen={showReciterModal}
          onClose={() => setShowReciterModal(false)}
          reciters={reciters}
          selectedReciter={selectedReciter}
          onSelectReciter={(reciterId) => {
            if (onReciterChange) {
              onReciterChange(reciterId);
            }
          }}
        />
      )}
    </div>
  );
};

export default FloatingAudioPlayer;

