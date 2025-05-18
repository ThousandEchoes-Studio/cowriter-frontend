import React, { useState, useEffect } from 'react';
import { uploadService } from '../services/uploadService';
import './MetadataEditor.css';

const MetadataEditor = ({ file, onSave, onCancel }) => {
  const [metadata, setMetadata] = useState({
    title: file.name.replace(/\.[^/.]+$/, ""), // Remove file extension
    description: '',
    tags: [],
    category: uploadService.getFileCategory(file.type),
    key: '',
    tempo: '',
    timeSignature: '',
  });
  
  const [currentTag, setCurrentTag] = useState('');
  
  // Predefined options for music metadata
  const keyOptions = [
    'C Major', 'G Major', 'D Major', 'A Major', 'E Major', 'B Major', 'F# Major', 
    'C# Major', 'F Major', 'Bb Major', 'Eb Major', 'Ab Major', 'Db Major', 'Gb Major',
    'A Minor', 'E Minor', 'B Minor', 'F# Minor', 'C# Minor', 'G# Minor', 'D# Minor', 
    'A# Minor', 'D Minor', 'G Minor', 'C Minor', 'F Minor', 'Bb Minor', 'Eb Minor'
  ];
  
  const timeSignatureOptions = ['4/4', '3/4', '6/8', '2/4', '5/4', '7/8', '12/8'];
  
  // Handle input changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    setMetadata(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  // Add a tag
  const addTag = () => {
    if (currentTag.trim() && !metadata.tags.includes(currentTag.trim())) {
      setMetadata(prev => ({
        ...prev,
        tags: [...prev.tags, currentTag.trim()]
      }));
      setCurrentTag('');
    }
  };
  
  // Remove a tag
  const removeTag = (tagToRemove) => {
    setMetadata(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove)
    }));
  };
  
  // Handle tag input keypress
  const handleTagKeyPress = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addTag();
    }
  };
  
  // Handle form submission
  const handleSubmit = (e) => {
    e.preventDefault();
    onSave({
      ...file,
      metadata: {
        ...metadata,
        lastModified: new Date().toISOString()
      }
    });
  };
  
  return (
    <div className="metadata-editor">
      <h3>Edit File Details</h3>
      
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="title">Title</label>
          <input
            type="text"
            id="title"
            name="title"
            value={metadata.title}
            onChange={handleChange}
            required
          />
        </div>
        
        <div className="form-group">
          <label htmlFor="description">Description</label>
          <textarea
            id="description"
            name="description"
            value={metadata.description}
            onChange={handleChange}
            rows="3"
          />
        </div>
        
        <div className="form-group">
          <label htmlFor="category">Category</label>
          <select
            id="category"
            name="category"
            value={metadata.category}
            onChange={handleChange}
          >
            <option value="audio">Audio</option>
            <option value="midi">MIDI</option>
            <option value="lyrics">Lyrics</option>
            <option value="project">Project</option>
            <option value="other">Other</option>
          </select>
        </div>
        
        {(metadata.category === 'audio' || metadata.category === 'midi') && (
          <>
            <div className="form-row">
              <div className="form-group half">
                <label htmlFor="key">Key</label>
                <select
                  id="key"
                  name="key"
                  value={metadata.key}
                  onChange={handleChange}
                >
                  <option value="">-- Select Key --</option>
                  {keyOptions.map(key => (
                    <option key={key} value={key}>{key}</option>
                  ))}
                </select>
              </div>
              
              <div className="form-group half">
                <label htmlFor="timeSignature">Time Signature</label>
                <select
                  id="timeSignature"
                  name="timeSignature"
                  value={metadata.timeSignature}
                  onChange={handleChange}
                >
                  <option value="">-- Select --</option>
                  {timeSignatureOptions.map(ts => (
                    <option key={ts} value={ts}>{ts}</option>
                  ))}
                </select>
              </div>
            </div>
            
            <div className="form-group">
              <label htmlFor="tempo">Tempo (BPM)</label>
              <input
                type="number"
                id="tempo"
                name="tempo"
                value={metadata.tempo}
                onChange={handleChange}
                min="1"
                max="300"
              />
            </div>
          </>
        )}
        
        <div className="form-group">
          <label htmlFor="tags">Tags</label>
          <div className="tag-input-container">
            <input
              type="text"
              id="tags"
              value={currentTag}
              onChange={(e) => setCurrentTag(e.target.value)}
              onKeyPress={handleTagKeyPress}
              placeholder="Add tags and press Enter"
            />
            <button 
              type="button" 
              className="add-tag-button"
              onClick={addTag}
            >
              Add
            </button>
          </div>
          
          <div className="tags-container">
            {metadata.tags.map(tag => (
              <div key={tag} className="tag">
                {tag}
                <button 
                  type="button"
                  className="remove-tag"
                  onClick={() => removeTag(tag)}
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        </div>
        
        <div className="form-actions">
          <button type="button" className="cancel-button" onClick={onCancel}>
            Cancel
          </button>
          <button type="submit" className="save-button">
            Save Details
          </button>
        </div>
      </form>
    </div>
  );
};

export default MetadataEditor;
