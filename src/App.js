import React, { useState, useEffect } from 'react';
import './App.css';
import { fetchSamples } from './api';
import { auth } from './firebase';
import Auth from './Auth';
import TextEditor from './TextEditor';
import AudioUploadContainer from './AudioUploadContainer';
import AudioRecordingContainer from './AudioRecordingContainer';

function App() {
  const [samples, setSamples] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [user, setUser] = useState(null);

  // Listen for auth state changes
  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((currentUser) => {
      setUser(currentUser);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    // Function to load samples from the API
    const loadSamples = async () => {
      try {
        setLoading(true);
        const data = await fetchSamples();
        setSamples(data);
        setError(null);
      } catch (err) {
        setError('Failed to connect to backend API');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    loadSamples();
  }, []);

  return (
    <div className="App">
      <header className="App-header">
        <h1>Cowriter App</h1>
        <p>Your AI-powered writing assistant</p>
      </header>
      
      <main className="App-main">
        <div className="auth-section">
          <Auth />
        </div>
        
        <div className="api-status">
          {loading ? (
            <div className="status-message loading">Connecting to backend...</div>
          ) : error ? (
            <div className="status-message error">{error}</div>
          ) : (
            <div className="status-message success">
              Connected to backend successfully!
              <p>Found {samples.length} samples</p>
            </div>
          )}
        </div>
        
        <TextEditor />
        
        {user && (
          <>
            <div className="feature-section">
              <h2>Upload Your Musical DNA</h2>
              <AudioUploadContainer userId={user.uid} />
            </div>
            
            <div className="feature-section">
              <h2>Record Your Musical Ideas</h2>
              <AudioRecordingContainer userId={user.uid} />
            </div>
          </>
        )}
      </main>
    </div>
  );
}

export default App;

