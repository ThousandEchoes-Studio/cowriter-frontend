import React, { useState, useRef, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { storage } from '../firebase';
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { db } from '../firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import './FileUploader.css';

const FileUploader = ({ userId }) => {
  const [files, setFiles] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState({});
  const [uploadError, setUploadError] = useState(null);
  
  // Supported file types
  const acceptedFileTypes = {
    'audio/mpeg': ['.mp3'],
    'audio/wav': ['.wav'],
    'audio/aiff': ['.aiff', '.aif'],
    'audio/midi': ['.mid', '.midi'],
    'text/plain': ['.txt', '.lyrics'],
    'application/json': ['.json'],
  };
  
  // Maximum file size (10MB)
  const maxFileSize = 10 * 1024 * 1024;
  
  const onDrop = useCallback((acceptedFiles) => {
    // Filter out files that are too large
    const validFiles = acceptedFiles.filter(file => file.size <= maxFileSize);
    
    if (validFiles.length < acceptedFiles.length) {
      setUploadError(`${acceptedFiles.length - validFiles.length} files exceeded the 10MB size limit and were removed.`);
    } else {
      setUploadError(null);
    }
    
    // Add new files to the list with preview URLs
    setFiles(prevFiles => [
      ...prevFiles,
      ...validFiles.map(file => Object.assign(file, {
        preview: URL.createObjectURL(file),
        id: `${file.name}-${Date.now()}`,
        status: 'ready'
      }))
    ]);
  }, []);
  
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: acceptedFileTypes,
    maxSize: maxFileSize
  });
  
  const uploadFiles = async () => {
    if (files.length === 0 || uploading) return;
    
    setUploading(true);
    setUploadProgress({});
    
    const uploadTasks = files.filter(file => file.status === 'ready').map(async (file) => {
      try {
        // Create a storage reference
        const storageRef = ref(storage, `users/${userId}/uploads/${file.name}`);
        
        // Start upload task
        const uploadTask = uploadBytesResumable(storageRef, file);
        
        // Listen for state changes
        uploadTask.on('state_changed', 
          (snapshot) => {
            // Update progress
            const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
            setUploadProgress(prev => ({
              ...prev,
              [file.id]: progress
            }));
            
            // Update file status
            setFiles(prevFiles => 
              prevFiles.map(f => 
                f.id === file.id 
                  ? { ...f, status: 'uploading' } 
                  : f
              )
            );
          },
          (error) => {
            // Handle error
            console.error("Upload error:", error);
            setUploadError(`Error uploading ${file.name}: ${error.message}`);
            
            // Update file status
            setFiles(prevFiles => 
              prevFiles.map(f => 
                f.id === file.id 
                  ? { ...f, status: 'error', error: error.message } 
                  : f
              )
            );
          },
          async () => {
            // Upload completed successfully
            const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
            
            // Save metadata to Firestore
            try {
              await addDoc(collection(db, "audioFiles"), {
                userId,
                fileName: file.name,
                fileType: file.type,
                fileSize: file.size,
                url: downloadURL,
                createdAt: serverTimestamp(),
                metadata: {
                  // Basic metadata - will be enhanced with audio analysis in future
                  type: getFileCategory(file.type),
                  tags: [],
                  description: ''
                }
              });
              
              // Update file status
              setFiles(prevFiles => 
                prevFiles.map(f => 
                  f.id === file.id 
                    ? { ...f, status: 'complete', url: downloadURL } 
                    : f
                )
              );
            } catch (error) {
              console.error("Firestore error:", error);
              setUploadError(`Error saving metadata for ${file.name}: ${error.message}`);
              
              // Update file status
              setFiles(prevFiles => 
                prevFiles.map(f => 
                  f.id === file.id 
                    ? { ...f, status: 'error', error: error.message } 
                    : f
                )
              );
            }
          }
        );
      } catch (error) {
        console.error("Upload preparation error:", error);
        setUploadError(`Error preparing upload for ${file.name}: ${error.message}`);
        
        // Update file status
        setFiles(prevFiles => 
          prevFiles.map(f => 
            f.id === file.id 
              ? { ...f, status: 'error', error: error.message } 
              : f
          )
        );
      }
    });
    
    // Wait for all uploads to complete
    await Promise.all(uploadTasks);
    setUploading(false);
  };
  
  const removeFile = (fileId) => {
    // Remove file from list
    setFiles(prevFiles => prevFiles.filter(file => file.id !== fileId));
    
    // Remove from progress tracking
    setUploadProgress(prev => {
      const newProgress = { ...prev };
      delete newProgress[fileId];
      return newProgress;
    });
  };
  
  const clearCompleted = () => {
    // Remove completed files from list
    setFiles(prevFiles => prevFiles.filter(file => file.status !== 'complete'));
  };
  
  const getFileCategory = (mimeType) => {
    if (mimeType.startsWith('audio/')) {
      return 'audio';
    } else if (mimeType === 'text/plain') {
      return 'lyrics';
    } else if (mimeType === 'application/json') {
      return 'project';
    } else {
      return 'other';
    }
  };
  
  const getFileIcon = (file) => {
    const category = getFileCategory(file.type);
    
    switch (category) {
      case 'audio':
        return '🎵';
      case 'lyrics':
        return '📝';
      case 'project':
        return '📂';
      default:
        return '📄';
    }
  };
  
  return (
    <div className="file-uploader">
      <h2>Upload Your Musical DNA</h2>
      <p className="uploader-description">
        Upload your demos, voice memos, lyrics, and song ideas to help Cowriter learn your unique style.
      </p>
      
      <div 
        {...getRootProps()} 
        className={`dropzone ${isDragActive ? 'active' : ''}`}
      >
        <input {...getInputProps()} />
        
        <div className="dropzone-content">
          <div className="dropzone-icon">📁</div>
          {isDragActive ? (
            <p>Drop the files here...</p>
          ) : (
            <>
              <p>Drag & drop files here, or click to select</p>
              <p className="dropzone-hint">
                Supports audio files (MP3, WAV, AIFF), MIDI, and lyrics (TXT)
              </p>
            </>
          )}
        </div>
      </div>
      
      {uploadError && (
        <div className="upload-error">
          <p>{uploadError}</p>
          <button onClick={() => setUploadError(null)}>Dismiss</button>
        </div>
      )}
      
      {files.length > 0 && (
        <div className="file-list">
          <h3>Selected Files</h3>
          <ul>
            {files.map(file => (
              <li key={file.id} className={`file-item status-${file.status}`}>
                <div className="file-icon">{getFileIcon(file)}</div>
                <div className="file-info">
                  <div className="file-name">{file.name}</div>
                  <div className="file-size">{(file.size / 1024).toFixed(1)} KB</div>
                  
                  {file.status === 'uploading' && (
                    <div className="progress-bar">
                      <div 
                        className="progress-bar-fill" 
                        style={{ width: `${uploadProgress[file.id] || 0}%` }}
                      ></div>
                      <span className="progress-text">{Math.round(uploadProgress[file.id] || 0)}%</span>
                    </div>
                  )}
                  
                  {file.status === 'error' && (
                    <div className="file-error">{file.error}</div>
                  )}
                  
                  {file.status === 'complete' && (
                    <div className="file-success">Upload complete</div>
                  )}
                </div>
                
                {file.status !== 'uploading' && (
                  <button 
                    className="remove-file" 
                    onClick={(e) => {
                      e.stopPropagation();
                      removeFile(file.id);
                    }}
                  >
                    ✕
                  </button>
                )}
              </li>
            ))}
          </ul>
          
          <div className="file-actions">
            <button 
              className="upload-button" 
              onClick={uploadFiles} 
              disabled={uploading || files.filter(f => f.status === 'ready').length === 0}
            >
              {uploading ? 'Uploading...' : 'Upload Files'}
            </button>
            
            {files.some(f => f.status === 'complete') && (
              <button className="clear-button" onClick={clearCompleted}>
                Clear Completed
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default FileUploader;
