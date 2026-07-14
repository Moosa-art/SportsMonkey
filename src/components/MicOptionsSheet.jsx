import { useState, useEffect } from 'react';
import { FiX, FiMic, FiVideo, FiImage, FiPlay, FiSquare, FiCamera, FiCheck, FiShare2 } from 'react-icons/fi';
import './MicOptionsSheet.css';

const MOCK_GALLERY_IMAGES = [
  'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?w=150&q=80', // Football pitch
  'https://images.unsplash.com/photo-1544698310-74ea9d1c8258?w=150&q=80', // Football boot
  'https://images.unsplash.com/photo-1518063319789-7217e6706b04?w=150&q=80', // Stadium lights
  'https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?w=150&q=80', // Stadium seats
  'https://images.unsplash.com/photo-1579952362874-86ed42d83290?w=150&q=80', // Ball
  'https://images.unsplash.com/photo-1614632537190-23e414d4094a?w=150&q=80'  // Trophy
];

export default function MicOptionsSheet({ onClose, onShareMedia }) {
  const [activeMode, setActiveMode] = useState(null); // 'voice' | 'video' | 'image' | null
  
  // Voice recording states
  const [isRecordingVoice, setIsRecordingVoice] = useState(false);
  const [voiceSeconds, setVoiceSeconds] = useState(0);
  const [recordedVoice, setRecordedVoice] = useState(false);

  // Video recording states
  const [isRecordingVideo, setIsRecordingVideo] = useState(false);
  const [videoSeconds, setVideoSeconds] = useState(0);
  const [recordedVideo, setRecordedVideo] = useState(false);

  // Image share states
  const [selectedImage, setSelectedImage] = useState(null);

  // Voice timer
  useEffect(() => {
    let interval = null;
    if (isRecordingVoice) {
      interval = setInterval(() => {
        setVoiceSeconds(s => s + 1);
      }, 1000);
    } else {
      clearInterval(interval);
    }
    return () => clearInterval(interval);
  }, [isRecordingVoice]);

  // Video timer
  useEffect(() => {
    let interval = null;
    if (isRecordingVideo) {
      interval = setInterval(() => {
        setVideoSeconds(s => s + 1);
      }, 1000);
    } else {
      clearInterval(interval);
    }
    return () => clearInterval(interval);
  }, [isRecordingVideo]);

  const formatTime = (secs) => {
    const mins = Math.floor(secs / 60);
    const remainder = secs % 60;
    return `${mins.toString().padStart(2, '0')}:${remainder.toString().padStart(2, '0')}`;
  };

  const handleStartVoice = () => {
    setIsRecordingVoice(true);
    setVoiceSeconds(0);
    setRecordedVoice(false);
  };

  const handleStopVoice = () => {
    setIsRecordingVoice(false);
    setRecordedVoice(true);
  };

  const handleStartVideo = () => {
    setIsRecordingVideo(true);
    setVideoSeconds(0);
    setRecordedVideo(false);
  };

  const handleStopVideo = () => {
    setIsRecordingVideo(false);
    setRecordedVideo(true);
  };

  const handlePostMedia = (type, content) => {
    if (onShareMedia) {
      onShareMedia(type, content);
    }
    onClose();
  };

  return (
    <div className="mic-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="mic-sheet">
        <div className="mic-drag" />
        <div className="mic-header">
          <h3>{activeMode ? 'Record & Share' : 'Create Feed Media'}</h3>
          <button className="mic-close" onClick={onClose} id="mic-close-btn"><FiX size={20} /></button>
        </div>

        {activeMode === null && (
          <div className="mic-options-list">
            <button className="mic-option-btn voice" onClick={() => setActiveMode('voice')} id="mic-opt-voice">
              <div className="mic-option-icon-wrap"><FiMic size={24} /></div>
              <div className="mic-option-meta">
                <span className="mic-option-title">Voice Record</span>
                <span className="mic-option-desc">Share a quick audio note or reaction</span>
              </div>
            </button>
            <button className="mic-option-btn video" onClick={() => setActiveMode('video')} id="mic-opt-video">
              <div className="mic-option-icon-wrap"><FiVideo size={24} /></div>
              <div className="mic-option-meta">
                <span className="mic-option-title">Video Record</span>
                <span className="mic-option-desc">Record match reactions via video camera</span>
              </div>
            </button>
            <button className="mic-option-btn image" onClick={() => setActiveMode('image')} id="mic-opt-image">
              <div className="mic-option-icon-wrap"><FiImage size={24} /></div>
              <div className="mic-option-meta">
                <span className="mic-option-title">Image Share</span>
                <span className="mic-option-desc">Post photos or match snapshots directly</span>
              </div>
            </button>
          </div>
        )}

        {activeMode === 'voice' && (
          <div className="mic-mode-container voice-mode">
            <h4>Voice recorder</h4>
            <div className="voice-visualization">
              {isRecordingVoice ? (
                <div className="audio-bars">
                  <div className="bar bar-1"></div>
                  <div className="bar bar-2"></div>
                  <div className="bar bar-3"></div>
                  <div className="bar bar-4"></div>
                  <div className="bar bar-5"></div>
                  <div className="bar bar-6"></div>
                  <div className="bar bar-5"></div>
                  <div className="bar bar-4"></div>
                  <div className="bar bar-3"></div>
                  <div className="bar bar-2"></div>
                  <div className="bar bar-1"></div>
                </div>
              ) : (
                <div className="voice-mic-static">
                  <FiMic size={40} color="var(--gray-400)" />
                </div>
              )}
            </div>
            
            <div className="timer-display">{formatTime(voiceSeconds)}</div>

            <div className="mic-controls">
              {!isRecordingVoice && !recordedVoice && (
                <button className="mic-ctrl-btn record" onClick={handleStartVoice} id="voice-record-start">
                  <FiPlay size={20} /> Start Recording
                </button>
              )}
              {isRecordingVoice && (
                <button className="mic-ctrl-btn stop" onClick={handleStopVoice} id="voice-record-stop">
                  <FiSquare size={20} /> Stop
                </button>
              )}
              {recordedVoice && (
                <div className="mic-save-actions">
                  <button className="mic-ctrl-btn retry" onClick={handleStartVoice}>Re-Record</button>
                  <button className="mic-ctrl-btn save" onClick={() => handlePostMedia('voice', `Voice Reaction (${formatTime(voiceSeconds)})`)} id="voice-record-share">
                    <FiShare2 size={16} /> Share Note
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {activeMode === 'video' && (
          <div className="mic-mode-container video-mode">
            <h4>Video Recorder</h4>
            <div className="video-viewfinder">
              <div className="video-camera-glass">
                <FiCamera size={44} color="rgba(255,255,255,0.7)" />
              </div>
              {isRecordingVideo && (
                <div className="video-rec-badge">
                  <span className="rec-dot" /> REC
                </div>
              )}
              <div className="video-timer">{formatTime(videoSeconds)}</div>
            </div>

            <div className="mic-controls">
              {!isRecordingVideo && !recordedVideo && (
                <button className="mic-ctrl-btn record" onClick={handleStartVideo} id="video-record-start">
                  <FiPlay size={20} /> Record Clip
                </button>
              )}
              {isRecordingVideo && (
                <button className="mic-ctrl-btn stop" onClick={handleStopVideo} id="video-record-stop">
                  <FiSquare size={20} /> Stop Recording
                </button>
              )}
              {recordedVideo && (
                <div className="mic-save-actions">
                  <button className="mic-ctrl-btn retry" onClick={handleStartVideo}>Retry</button>
                  <button className="mic-ctrl-btn save" onClick={() => handlePostMedia('video', `Video Reaction (${formatTime(videoSeconds)})`)} id="video-record-share">
                    <FiShare2 size={16} /> Share Video
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {activeMode === 'image' && (
          <div className="mic-mode-container image-mode">
            <h4>Select Image</h4>
            <div className="image-grid-selector">
              {MOCK_GALLERY_IMAGES.map((img, i) => (
                <button 
                  key={i} 
                  className={`image-grid-item ${selectedImage === img ? 'selected' : ''}`}
                  onClick={() => setSelectedImage(img)}
                  type="button"
                >
                  <img src={img} alt="Gallery item" />
                  {selectedImage === img && <div className="selected-overlay"><FiCheck size={20} /></div>}
                </button>
              ))}
            </div>

            <div className="mic-controls">
              <button 
                className="mic-ctrl-btn save" 
                disabled={!selectedImage} 
                onClick={() => handlePostMedia('image', selectedImage)}
                id="image-record-share"
              >
                <FiShare2 size={16} /> Post Image
              </button>
            </div>
          </div>
        )}

        {activeMode !== null && (
          <button className="mic-back-btn" onClick={() => setActiveMode(null)}>Back to options</button>
        )}
      </div>
    </div>
  );
}
