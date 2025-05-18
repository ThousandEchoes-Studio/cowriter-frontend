import React, { useState, useEffect } from 'react';
import { storage, db } from '../firebase';
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

/**
 * Service for handling audio recording and processing
 */
const recordingService = {
  /**
   * Request microphone access
   * @returns {Promise<MediaStream>} - Media stream from microphone
   */
  requestMicrophoneAccess: async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      return stream;
    } catch (error) {
      console.error('Error accessing microphone:', error);
      throw error;
    }
  },
  
  /**
   * Create audio analyzer for visualization
   * @param {MediaStream} stream - Media stream from microphone
   * @returns {Object} - Audio context and analyzer
   */
  createAudioAnalyzer: (stream) => {
    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    const analyser = audioContext.createAnalyser();
    const microphone = audioContext.createMediaStreamSource(stream);
    
    microphone.connect(analyser);
    analyser.fftSize = 256;
    
    return {
      audioContext,
      analyser
    };
  },
  
  /**
   * Create a media recorder
   * @param {MediaStream} stream - Media stream from microphone
   * @param {Function} onDataAvailable - Callback for data available event
   * @param {Function} onStop - Callback for stop event
   * @returns {MediaRecorder} - Media recorder instance
   */
  createMediaRecorder: (stream, onDataAvailable, onStop) => {
    const mediaRecorder = new MediaRecorder(stream);
    
    mediaRecorder.ondataavailable = onDataAvailable;
    mediaRecorder.onstop = onStop;
    
    return mediaRecorder;
  },
  
  /**
   * Process recorded audio
   * @param {Blob} audioBlob - Audio blob from recording
   * @returns {Promise<Blob>} - Processed audio blob
   */
  processAudio: async (audioBlob) => {
    // In a real implementation, this would apply noise reduction, normalization, etc.
    // For now, we'll just return the original blob
    return audioBlob;
  },
  
  /**
   * Convert audio to MIDI (placeholder for future implementation)
   * @param {Blob} audioBlob - Audio blob from recording
   * @returns {Promise<Object>} - MIDI data
   */
  convertAudioToMidi: async (audioBlob) => {
    // This would be implemented with a more sophisticated algorithm
    // For now, return a placeholder
    return {
      notes: [],
      tempo: 120,
      timeSignature: '4/4'
    };
  },
  
  /**
   * Upload recorded audio to storage
   * @param {Blob} audioBlob - Audio blob from recording
   * @param {string} userId - User ID
   * @param {Object} metadata - Additional metadata
   * @param {Function} onProgress - Progress callback
   * @param {Function} onComplete - Completion callback
   * @returns {Promise<Object>} - Upload result
   */
  uploadRecording: async (audioBlob, userId, metadata = {}, onProgress, onComplete) => {
    try {
      // Create a file from the blob
      const fileName = `recording-${Date.now()}.wav`;
      const file = new File([audioBlob], fileName, { type: 'audio/wav' });
      
      // Create a storage reference
      const storageRef = ref(storage, `users/${userId}/recordings/${fileName}`);
      
      // Start upload task
      const uploadTask = uploadBytesResumable(storageRef, file);
      
      // Listen for state changes
      uploadTask.on('state_changed', 
        (snapshot) => {
          // Calculate progress
          const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
          if (onProgress) onProgress(progress);
        },
        (error) => {
          console.error("Upload error:", error);
          throw error;
        },
        async () => {
          try {
            // Upload completed successfully
            const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
            
            // Save metadata to Firestore
            const docRef = await addDoc(collection(db, "audioFiles"), {
              userId,
              fileName,
              fileType: 'audio/wav',
              fileSize: audioBlob.size,
              url: downloadURL,
              createdAt: serverTimestamp(),
              recordingMetadata: {
                ...metadata,
                type: 'audio',
                source: 'recording',
                duration: metadata.duration || 0,
                tags: metadata.tags || [],
                description: metadata.description || 'Voice recording'
              }
            });
            
            if (onComplete) onComplete({
              id: docRef.id,
              fileName,
              url: downloadURL
            });
            
            return {
              id: docRef.id,
              fileName,
              url: downloadURL
            };
          } catch (error) {
            console.error("Firestore error:", error);
            throw error;
          }
        }
      );
      
      return uploadTask;
    } catch (error) {
      console.error("Recording upload error:", error);
      throw error;
    }
  }
};

export default recordingService;
