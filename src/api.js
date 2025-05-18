import axios from 'axios';

// Create an axios instance with the base URL of your backend
const api = axios.create({
  baseURL: process.env.REACT_APP_API_BASE_URL || 'http://localhost:5000',
  headers: {
    'Content-Type': 'application/json',
  },
} );

// Example API functions
export const fetchSamples = async () => {
  try {
    const response = await api.get('/api/samples');
    return response.data;
  } catch (error) {
    console.error('Error fetching samples:', error);
    throw error;
  }
};

export const uploadSample = async (sampleData) => {
  try {
    const response = await api.post('/api/samples', sampleData);
    return response.data;
  } catch (error) {
    console.error('Error uploading sample:', error);
    throw error;
  }
};

export default api;
