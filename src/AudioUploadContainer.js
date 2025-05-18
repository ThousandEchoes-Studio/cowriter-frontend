import React, { useState, useEffect } from 'react';
import FileUploader from './components/FileUploader';
import UploadProgress from './components/UploadProgress';
import MetadataEditor from './components/MetadataEditor';
import FileList from './components/FileList';
import { uploadService } from './services/uploadService';
import './AudioUploadContainer.css';

const AudioUploadContainer = ({ userId }) => {
  const [files, setFiles] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState({});
  const [uploadError, setUploadError] = useState(null);
  const [editingFile, setEditingFile] = useState(null);
  const [showFileList, setShowFileList] = useState(false);
  
  // Handle file selection
  const handleFilesSelected = (selectedFiles) => {
    setFiles(prevFiles => [
      ...prevFiles,
      ...selectedFiles.map(file => ({
        ...file,
        id: `${file.name}-${Date.now()}`,
        status: 'ready'
      }))
    ]);
  };
  
  // Handle file upload
  const handleUpload = async () => {
    if (files.length === 0 || uploading) return;
    
    setUploading(true);
    setUploadProgress({});
    
    const uploadTasks = files.filter(file => file.status === 'ready').map(async (file) => {
      try {
        // Update file status
        setFiles(prevFiles => 
          prevFiles.map(f => 
            f.id === file.id 
              ? { ...f, status: 'uploading' } 
              : f
          )
        );
        
        // Upload file using service
        await uploadService.uploadFile(
          file,
          userId,
          {}, // Default metadata
          (progress) => {
            // Update progress
            setUploadProgress(prev => ({
              ...prev,
              [file.id]: progress
            }));
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
          (result) => {
            // Handle completion
            setFiles(prevFiles => 
              prevFiles.map(f => 
                f.id === file.id 
                  ? { ...f, status: 'complete', url: result.url } 
                  : f
              )
            );
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
  
  // Handle file removal
  const handleRemoveFile = (fileId) => {
    setFiles(prevFiles => prevFiles.filter(file => file.id !== fileId));
    
    // Remove from progress tracking
    setUploadProgress(prev => {
      const newProgress = { ...prev };
      delete newProgress[fileId];
      return newProgress;
    });
  };
  
  // Handle clearing completed files
  const handleClearCompleted = () => {
    setFiles(prevFiles => prevFiles.filter(file => file.status !== 'complete'));
  };
  
  // Handle metadata editing
  const handleEditMetadata = (file) => {
    setEditingFile(file);
  };
  
  // Handle metadata save
  const handleSaveMetadata = (updatedFile) => {
    // In a real app, we would update the metadata in the database here
    console.log("Saving metadata:", updatedFile);
    setEditingFile(null);
  };
  
  // Handle file deletion
  const handleDeleteFile = async (fileId) => {
    // In a real app, we would delete the file from storage and database here
    console.log("Deleting file:", fileId);
    
    // For now, just refresh the file list
    setShowFileList(false);
    setTimeout(() => setShowFileList(true), 100);
  };
  
  return (
    <div className="audio-upload-container">
      <h1>Upload Your Musical DNA</h1>
      <p className="intro-text">
        Upload your demos, voice memos, lyrics, and song ideas to help Cowriter learn your unique style.
        The more you share, the better Cowriter can understand and enhance your creative process.
      </p>
      
      <div className="upload-section">
        <FileUploader 
          userId={userId}
          onFilesSelected={handleFilesSelected}
          onUpload={handleUpload}
          uploading={uploading}
        />
        
        {files.length > 0 && (
          <UploadProgress 
            files={files}
            uploadProgress={uploadProgress}
            onRemoveFile={handleRemoveFile}
            onClearCompleted={handleClearCompleted}
          />
        )}
        
        {uploadError && (
          <div className="upload-error">
            <p>{uploadError}</p>
            <button onClick={() => setUploadError(null)}>Dismiss</button>
          </div>
        )}
      </div>
      
      <div className="view-toggle">
        <button 
          className={`toggle-button ${showFileList ? 'active' : ''}`}
          onClick={() => setShowFileList(true)}
        >
          View Your Files
        </button>
        <button 
          className={`toggle-button ${!showFileList ? 'active' : ''}`}
          onClick={() => setShowFileList(false)}
        >
          Upload New Files
        </button>
      </div>
      
      {showFileList && (
        <div className="files-section">
          <FileList 
            userId={userId}
            onEditMetadata={handleEditMetadata}
            onDeleteFile={handleDeleteFile}
          />
        </div>
      )}
      
      {editingFile && (
        <div className="metadata-editor-overlay">
          <div className="metadata-editor-container">
            <MetadataEditor 
              file={editingFile}
              onSave={handleSaveMetadata}
              onCancel={() => setEditingFile(null)}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default AudioUploadContainer;
