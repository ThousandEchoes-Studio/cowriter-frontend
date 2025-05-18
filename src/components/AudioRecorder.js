import React, { useState, useEffect, useRef } from 'react';
import './AudioRecorder.css';

const AudioRecorder = ({ onRecordingComplete }) => {
  const [isRecording, setIsRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [audioBlob, setAudioBlob] = useState(null);
  const [audioUrl, setAudioUrl] = useState(null);
  const [permissionGranted, setPermissionGranted] = useState(false);
  const [error, setError] = useState(null);
  
  // References for audio recording
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const streamRef = useRef(null);
  const timerRef = useRef(null);
  const canvasRef = useRef(null);
  const analyserRef = useRef(null);
  const animationFrameRef = useRef(null);
  
  // Request microphone permission on component mount
  useEffect(() => {
    const requestMicrophonePermission = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        streamRef.current = stream;
        setPermissionGranted(true);
        setError(null);
        
        // Set up audio analyzer for visualization
        const audioContext = new (window.AudioContext || window.webkitAudioContext)();
        const analyser = audioContext.createAnalyser();
        const microphone = audioContext.createMediaStreamSource(stream);
        microphone.connect(analyser);
        analyser.fftSize = 256;
        analyserRef.current = analyser;
        
        // Initialize canvas for visualization
        if (canvasRef.current) {
          initializeVisualization();
        }
      } catch (err) {
        console.error('Error accessing microphone:', err);
        setError('Microphone access denied. Please grant permission to use the recording feature.');
        setPermissionGranted(false);
      }
    };
    
    requestMicrophonePermission();
    
    // Cleanup function
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      if (audioUrl) {
        URL.revokeObjectURL(audioUrl);
      }
    };
  }, []);
  
  // Initialize audio visualization
  const initializeVisualization = () => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const analyser = analyserRef.current;
    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);
    
    const draw = () => {
      if (!analyser) return;
      
      animationFrameRef.current = requestAnimationFrame(draw);
      
      analyser.getByteTimeDomainData(dataArray);
      
      ctx.fillStyle = 'rgb(35, 35, 35)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      ctx.lineWidth = 2;
      ctx.strokeStyle = isRecording ? 'rgb(255, 0, 0)' : 'rgb(0, 255, 0)';
      ctx.beginPath();
      
      const sliceWidth = canvas.width * 1.0 / bufferLength;
      let x = 0;
      
      for (let i = 0; i < bufferLength; i++) {
        const v = dataArray[i] / 128.0;
        const y = v * canvas.height / 2;
        
        if (i === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }
        
        x += sliceWidth;
      }
      
      ctx.lineTo(canvas.width, canvas.height / 2);
      ctx.stroke();
    };
    
    draw();
  };
  
  // Start recording
  const startRecording = () => {
    if (!permissionGranted || !streamRef.current) {
      setError('Microphone permission is required to record audio.');
      return;
    }
    
    try {
      audioChunksRef.current = [];
      const mediaRecorder = new MediaRecorder(streamRef.current);
      
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };
      
      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/wav' });
        const audioUrl = URL.createObjectURL(audioBlob);
        setAudioBlob(audioBlob);
        setAudioUrl(audioUrl);
      };
      
      mediaRecorder.start();
      mediaRecorderRef.current = mediaRecorder;
      setIsRecording(true);
      setIsPaused(false);
      setError(null);
      
      // Start timer
      timerRef.current = setInterval(() => {
        setRecordingTime((prevTime) => prevTime + 1);
      }, 1000);
    } catch (err) {
      console.error('Error starting recording:', err);
      setError('Failed to start recording. Please try again.');
    }
  };
  
  // Pause recording
  const pauseRecording = () => {
    if (mediaRecorderRef.current && isRecording && !isPaused) {
      mediaRecorderRef.current.pause();
      clearInterval(timerRef.current);
      setIsPaused(true);
    }
  };
  
  // Resume recording
  const resumeRecording = () => {
    if (mediaRecorderRef.current && isRecording && isPaused) {
      mediaRecorderRef.current.resume();
      timerRef.current = setInterval(() => {
        setRecordingTime((prevTime) => prevTime + 1);
      }, 1000);
      setIsPaused(false);
    }
  };
  
  // Stop recording
  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      clearInterval(timerRef.current);
      setIsRecording(false);
      setIsPaused(false);
    }
  };
  
  // Reset recording
  const resetRecording = () => {
    if (audioUrl) {
      URL.revokeObjectURL(audioUrl);
    }
    setAudioBlob(null);
    setAudioUrl(null);
    setRecordingTime(0);
  };
  
  // Save recording
  const saveRecording = () => {
    if (audioBlob && onRecordingComplete) {
      const file = new File([audioBlob], `recording-${Date.now()}.wav`, {
        type: 'audio/wav',
        lastModified: Date.now()
      });
      onRecordingComplete(file);
      resetRecording();
    }
  };
  
  // Format time display
  const formatTime = (seconds) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
  };
  
  return (
    <div className="audio-recorder">
      <h2>Record Audio</h2>
      
      {error && (
        <div className="recorder-error">
          <p>{error}</p>
        </div>
      )}
      
      <div className="visualization-container">
        <canvas ref={canvasRef} className="waveform-canvas" width="600" height="150"></canvas>
      </div>
      
      <div className="time-display">
        {formatTime(recordingTime)}
      </div>
      
      <div className="recorder-controls">
        {!isRecording && !audioUrl && (
          <button 
            className="record-button"
            onClick={startRecording}
            disabled={!permissionGranted}
          >
            <span className="button-icon">●</span> Record
          </button>
        )}
        
        {isRecording && !isPaused && (
          <>
            <button className="pause-button" onClick={pauseRecording}>
              <span className="button-icon">⏸</span> Pause
            </button>
            <button className="stop-button" onClick={stopRecording}>
              <span className="button-icon">⏹</span> Stop
            </button>
          </>
        )}
        
        {isRecording && isPaused && (
          <>
            <button className="resume-button" onClick={resumeRecording}>
              <span className="button-icon">▶</span> Resume
            </button>
            <button className="stop-button" onClick={stopRecording}>
              <span className="button-icon">⏹</span> Stop
            </button>
          </>
        )}
        
        {audioUrl && (
          <div className="playback-controls">
            <audio src={audioUrl} controls className="audio-player"></audio>
            <div className="action-buttons">
              <button className="save-button" onClick={saveRecording}>
                <span className="button-icon">💾</span> Save
              </button>
              <button className="discard-button" onClick={resetRecording}>
                <span className="button-icon">🗑️</span> Discard
              </button>
            </div>
          </div>
        )}
      </div>
      
      <div className="recorder-instructions">
        <p>Sing, hum, or play an instrument to record your musical ideas.</p>
        <p>Cowriter will analyze your recording to learn your unique style.</p>
      </div>
    </div>
  );
};

export default AudioRecorder;
