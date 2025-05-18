import React, { useState, useEffect } from 'react';
import './App.css';
import { fetchSamples } from './api';

function App() {
  const [samples, setSamples] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

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
        
        <div className="status-container">
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
      </header>
    </div>
  );
}

export default App;
