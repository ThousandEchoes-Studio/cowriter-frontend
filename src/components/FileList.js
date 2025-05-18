import React, { useState, useEffect } from 'react';
import { uploadService } from '../services/uploadService';
import './FileList.css';

const FileList = ({ userId, onEditMetadata, onDeleteFile }) => {
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeCategory, setActiveCategory] = useState('all');
  
  // Categories for filtering
  const categories = [
    { id: 'all', name: 'All Files', icon: '📁' },
    { id: 'audio', name: 'Audio', icon: '🎵' },
    { id: 'midi', name: 'MIDI', icon: '🎹' },
    { id: 'lyrics', name: 'Lyrics', icon: '📝' },
    { id: 'project', name: 'Projects', icon: '📂' }
  ];
  
  // Load user files on component mount
  useEffect(() => {
    const loadFiles = async () => {
      try {
        setLoading(true);
        const userFiles = await uploadService.getUserFiles(userId);
        setFiles(userFiles);
        setError(null);
      } catch (err) {
        console.error("Error loading files:", err);
        setError("Failed to load your files. Please try again.");
      } finally {
        setLoading(false);
      }
    };
    
    loadFiles();
  }, [userId]);
  
  // Filter files by category
  const filteredFiles = activeCategory === 'all' 
    ? files 
    : files.filter(file => file.metadata?.type === activeCategory);
  
  // Format file size for display
  const formatFileSize = (bytes) => {
    if (bytes < 1024) return bytes + ' B';
    else if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
    else return (bytes / 1048576).toFixed(1) + ' MB';
  };
  
  // Format date for display
  const formatDate = (timestamp) => {
    if (!timestamp) return 'Unknown';
    
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };
  
  return (
    <div className="file-list-container">
      <h2>Your Files</h2>
      
      <div className="category-tabs">
        {categories.map(category => (
          <button
            key={category.id}
            className={`category-tab ${activeCategory === category.id ? 'active' : ''}`}
            onClick={() => setActiveCategory(category.id)}
          >
            <span className="category-icon">{category.icon}</span>
            {category.name}
          </button>
        ))}
      </div>
      
      {loading ? (
        <div className="loading-state">
          <div className="loading-spinner"></div>
          <p>Loading your files...</p>
        </div>
      ) : error ? (
        <div className="error-state">
          <p>{error}</p>
          <button onClick={() => window.location.reload()}>Try Again</button>
        </div>
      ) : filteredFiles.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">📂</div>
          <p>No files found in this category</p>
          {activeCategory !== 'all' && (
            <button onClick={() => setActiveCategory('all')}>View All Files</button>
          )}
        </div>
      ) : (
        <div className="files-grid">
          {filteredFiles.map(file => (
            <div key={file.id} className="file-card">
              <div className="file-card-header">
                <div className="file-icon">
                  {file.metadata?.type === 'audio' && '🎵'}
                  {file.metadata?.type === 'midi' && '🎹'}
                  {file.metadata?.type === 'lyrics' && '📝'}
                  {file.metadata?.type === 'project' && '📂'}
                  {(!file.metadata || !file.metadata.type) && '📄'}
                </div>
                <div className="file-actions">
                  <button 
                    className="edit-button"
                    onClick={() => onEditMetadata(file)}
                    title="Edit Details"
                  >
                    ✏️
                  </button>
                  <button 
                    className="delete-button"
                    onClick={() => onDeleteFile(file.id)}
                    title="Delete File"
                  >
                    🗑️
                  </button>
                </div>
              </div>
              
              <div className="file-card-body">
                <h3 className="file-title">
                  {file.metadata?.title || file.fileName}
                </h3>
                
                <div className="file-meta">
                  <span className="file-size">{formatFileSize(file.fileSize)}</span>
                  <span className="file-date">{formatDate(file.createdAt)}</span>
                </div>
                
                {file.metadata?.description && (
                  <p className="file-description">{file.metadata.description}</p>
                )}
                
                {file.metadata?.tags && file.metadata.tags.length > 0 && (
                  <div className="file-tags">
                    {file.metadata.tags.map(tag => (
                      <span key={tag} className="file-tag">{tag}</span>
                    ))}
                  </div>
                )}
              </div>
              
              <div className="file-card-footer">
                <a 
                  href={file.url} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="preview-button"
                >
                  Preview
                </a>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default FileList;
