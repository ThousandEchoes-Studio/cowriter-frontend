import React, { useState, useEffect } from 'react';
import { uploadService } from '../services/uploadService';
import './UploadProgress.css';

const UploadProgress = ({ files, uploadProgress, onRemoveFile, onClearCompleted }) => {
  const [totalProgress, setTotalProgress] = useState(0);
  
  // Calculate total progress across all files
  useEffect(() => {
    if (files.length === 0) {
      setTotalProgress(0);
      return;
    }
    
    const uploadingFiles = files.filter(file => file.status === 'uploading');
    if (uploadingFiles.length === 0) {
      return;
    }
    
    let total = 0;
    uploadingFiles.forEach(file => {
      total += uploadProgress[file.id] || 0;
    });
    
    setTotalProgress(Math.round(total / uploadingFiles.length));
  }, [files, uploadProgress]);
  
  // Group files by status
  const filesByStatus = {
    uploading: files.filter(file => file.status === 'uploading'),
    complete: files.filter(file => file.status === 'complete'),
    error: files.filter(file => file.status === 'error'),
    ready: files.filter(file => file.status === 'ready')
  };
  
  // Get appropriate icon for file type
  const getFileIcon = (file) => {
    const category = file.type ? uploadService.getFileCategory(file.type) : 'other';
    
    switch (category) {
      case 'audio':
        return '🎵';
      case 'midi':
        return '🎹';
      case 'lyrics':
        return '📝';
      case 'project':
        return '📂';
      default:
        return '📄';
    }
  };
  
  return (
    <div className="upload-progress">
      {files.length > 0 && (
        <>
          {/* Overall progress */}
          {filesByStatus.uploading.length > 0 && (
            <div className="overall-progress">
              <h4>Overall Progress</h4>
              <div className="progress-bar">
                <div 
                  className="progress-bar-fill" 
                  style={{ width: `${totalProgress}%` }}
                ></div>
                <span className="progress-text">{totalProgress}%</span>
              </div>
              <p className="status-text">
                Uploading {filesByStatus.uploading.length} of {files.length} files...
              </p>
            </div>
          )}
          
          {/* File list sections */}
          {filesByStatus.uploading.length > 0 && (
            <div className="file-section">
              <h4>Uploading</h4>
              <ul className="file-list">
                {filesByStatus.uploading.map(file => (
                  <li key={file.id} className="file-item uploading">
                    <div className="file-icon">{getFileIcon(file)}</div>
                    <div className="file-info">
                      <div className="file-name">{file.name}</div>
                      <div className="file-size">{(file.size / 1024).toFixed(1)} KB</div>
                      <div className="progress-bar">
                        <div 
                          className="progress-bar-fill" 
                          style={{ width: `${uploadProgress[file.id] || 0}%` }}
                        ></div>
                        <span className="progress-text">{Math.round(uploadProgress[file.id] || 0)}%</span>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          )}
          
          {filesByStatus.complete.length > 0 && (
            <div className="file-section">
              <h4>Completed</h4>
              <ul className="file-list">
                {filesByStatus.complete.map(file => (
                  <li key={file.id} className="file-item complete">
                    <div className="file-icon">{getFileIcon(file)}</div>
                    <div className="file-info">
                      <div className="file-name">{file.name}</div>
                      <div className="file-size">{(file.size / 1024).toFixed(1)} KB</div>
                      <div className="file-success">Upload complete</div>
                    </div>
                    <button 
                      className="remove-file" 
                      onClick={() => onRemoveFile(file.id)}
                    >
                      ✕
                    </button>
                  </li>
                ))}
              </ul>
              {filesByStatus.complete.length > 0 && (
                <button className="clear-button" onClick={onClearCompleted}>
                  Clear Completed
                </button>
              )}
            </div>
          )}
          
          {filesByStatus.error.length > 0 && (
            <div className="file-section">
              <h4>Failed</h4>
              <ul className="file-list">
                {filesByStatus.error.map(file => (
                  <li key={file.id} className="file-item error">
                    <div className="file-icon">{getFileIcon(file)}</div>
                    <div className="file-info">
                      <div className="file-name">{file.name}</div>
                      <div className="file-size">{(file.size / 1024).toFixed(1)} KB</div>
                      <div className="file-error">{file.error}</div>
                    </div>
                    <button 
                      className="remove-file" 
                      onClick={() => onRemoveFile(file.id)}
                    >
                      ✕
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}
          
          {filesByStatus.ready.length > 0 && (
            <div className="file-section">
              <h4>Ready to Upload</h4>
              <ul className="file-list">
                {filesByStatus.ready.map(file => (
                  <li key={file.id} className="file-item ready">
                    <div className="file-icon">{getFileIcon(file)}</div>
                    <div className="file-info">
                      <div className="file-name">{file.name}</div>
                      <div className="file-size">{(file.size / 1024).toFixed(1)} KB</div>
                    </div>
                    <button 
                      className="remove-file" 
                      onClick={() => onRemoveFile(file.id)}
                    >
                      ✕
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default UploadProgress;
