import React, { useState, useEffect } from 'react';
import AudioRecorder from './components/AudioRecorder';
import recordingService from './services/recordingService';
import './AudioRecordingContainer.css';

const AudioRecordingContainer = ({ userId }) => {
  const [recordings, setRecordings] = useState([]);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState(null);
  const [recordingMetadata, setRecordingMetadata] = useState({
    title: '',
    description: '',
    tags: []
  });
  
  // Handle completed recording
  const handleRecordingComplete = async (audioFile) => {
    try {
      setIsUploading(true);
      setError(null);
      
      // Process the audio file (in a real app, this would include noise reduction, etc.)
      const audioBlob = await recordingService.processAudio(audioFile);
      
      // Upload the recording
      await recordingService.uploadRecording(
        audioBlob,
        userId,
        {
          title: recordingMetadata.title || `Recording ${new Date().toLocaleString()}`,
          description: recordingMetadata.description,
          tags: recordingMetadata.tags,
          duration: audioFile.duration || 0
        },
        (progress) => {
          setUploadProgress(progress);
        },
        (result) => {
          // Add the new recording to the list
          setRecordings(prev => [result, ...prev]);
          setIsUploading(false);
          setUploadProgress(0);
          
          // Reset metadata
          setRecordingMetadata({
            title: '',
            description: '',
            tags: []
          });
        }
      );
    } catch (err) {
      console.error('Error handling recording:', err);
      setError('Failed to process and upload recording. Please try again.');
      setIsUploading(false);
    }
  };
  
  // Handle metadata change
  const handleMetadataChange = (e) => {
    const { name, value } = e.target;
    setRecordingMetadata(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  // Handle tag addition
  const handleAddTag = (tag) => {
    if (tag && !recordingMetadata.tags.includes(tag)) {
      setRecordingMetadata(prev => ({
        ...prev,
        tags: [...prev.tags, tag]
      }));
    }
  };
  
  // Handle tag removal
  const handleRemoveTag = (tagToRemove) => {
    setRecordingMetadata(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove)
    }));
  };
  
  return (
    <div className="audio-recording-container">
      <h1>Record Your Musical Ideas</h1>
      <p className="intro-text">
        Sing, hum, or play an instrument to capture your musical ideas.
        Cowriter will analyze your recordings to learn your unique style and help you create music that feels authentically yours.
      </p>
      
      <div className="recording-section">
        <AudioRecorder onRecordingComplete={handleRecordingComplete} />
        
        {isUploading && (
          <div className="upload-progress">
            <h3>Uploading Recording</h3>
            <div className="progress-bar">
              <div 
                className="progress-bar-fill" 
                style={{ width: `${uploadProgress}%` }}
              ></div>
              <span className="progress-text">{Math.round(uploadProgress)}%</span>
            </div>
          </div>
        )}
        
        {error && (
          <div className="recording-error">
            <p>{error}</p>
            <button onClick={() => setError(null)}>Dismiss</button>
          </div>
        )}
      </div>
      
      <div className="metadata-section">
        <h3>Recording Details</h3>
        <div className="form-group">
          <label htmlFor="title">Title</label>
          <input
            type="text"
            id="title"
            name="title"
            value={recordingMetadata.title}
            onChange={handleMetadataChange}
            placeholder="My awesome melody"
          />
        </div>
        
        <div className="form-group">
          <label htmlFor="description">Description</label>
          <textarea
            id="description"
            name="description"
            value={recordingMetadata.description}
            onChange={handleMetadataChange}
            placeholder="Describe your musical idea..."
            rows="3"
          />
        </div>
        
        <div className="form-group">
          <label>Tags</label>
          <div className="tag-input-container">
            <input
              type="text"
              id="tag-input"
              placeholder="Add tags and press Enter"
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleAddTag(e.target.value);
                  e.target.value = '';
                }
              }}
            />
          </div>
          
          <div className="tags-container">
            {recordingMetadata.tags.map(tag => (
              <div key={tag} className="tag">
                {tag}
                <button 
                  type="button"
                  className="remove-tag"
                  onClick={() => handleRemoveTag(tag)}
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
      
      <div className="recording-instructions">
        <h3>Tips for Great Recordings</h3>
        <ul>
          <li>Find a quiet environment with minimal background noise</li>
          <li>Position yourself about 6-12 inches from your microphone</li>
          <li>Do a test recording to check your levels before capturing your idea</li>
          <li>Don't worry about perfection - Cowriter learns from your raw creativity</li>
          <li>Try recording different aspects of your style: melodies, chord progressions, rhythms</li>
        </ul>
      </div>
    </div>
  );
};

export default AudioRecordingContainer;
