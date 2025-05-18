import React, { useState } from 'react';
import './TextEditor.css';

function TextEditor() {
  const [content, setContent] = useState('');
  const [title, setTitle] = useState('');

  return (
    <div className="editor-container">
      <div className="editor-header">
        <input
          type="text"
          placeholder="Document Title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="title-input"
        />
        <button className="save-button">
          Save
        </button>
      </div>
      
      <textarea 
        value={content}
        onChange={(e) => setContent(e.target.value)}
        className="simple-editor"
        placeholder="Start writing here..."
      />
    </div>
  );
}

export default TextEditor;
