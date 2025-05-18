import { storage, db } from '../firebase';
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { collection, addDoc, serverTimestamp, query, where, getDocs } from 'firebase/firestore';

/**
 * Service for handling file uploads to Firebase Storage and Firestore
 */
export const uploadService = {
  /**
   * Upload a file to Firebase Storage and save metadata to Firestore
   * @param {File} file - The file to upload
   * @param {string} userId - The user ID
   * @param {Object} metadata - Additional metadata for the file
   * @param {Function} onProgress - Progress callback function
   * @param {Function} onError - Error callback function
   * @param {Function} onComplete - Completion callback function
   * @returns {Object} - Upload task reference
   */
  uploadFile: (file, userId, metadata = {}, onProgress, onError, onComplete) => {
    // Create a storage reference
    const storageRef = ref(storage, `users/${userId}/uploads/${file.name}`);
    
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
        // Handle error
        console.error("Upload error:", error);
        if (onError) onError(error);
      },
      async () => {
        try {
          // Upload completed successfully
          const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
          
          // Prepare file metadata
          const fileMetadata = {
            userId,
            fileName: file.name,
            fileType: file.type,
            fileSize: file.size,
            url: downloadURL,
            createdAt: serverTimestamp(),
            metadata: {
              ...metadata,
              type: getFileCategory(file.type),
              tags: metadata.tags || [],
              description: metadata.description || ''
            }
          };
          
          // Save metadata to Firestore
          const docRef = await addDoc(collection(db, "audioFiles"), fileMetadata);
          
          if (onComplete) onComplete({
            id: docRef.id,
            ...fileMetadata,
            url: downloadURL
          });
        } catch (error) {
          console.error("Firestore error:", error);
          if (onError) onError(error);
        }
      }
    );
    
    return uploadTask;
  },
  
  /**
   * Get all files uploaded by a user
   * @param {string} userId - The user ID
   * @returns {Promise<Array>} - Array of file metadata
   */
  getUserFiles: async (userId) => {
    try {
      const q = query(collection(db, "audioFiles"), where("userId", "==", userId));
      const querySnapshot = await getDocs(q);
      
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
    } catch (error) {
      console.error("Error getting user files:", error);
      throw error;
    }
  },
  
  /**
   * Get files by category
   * @param {string} userId - The user ID
   * @param {string} category - The file category
   * @returns {Promise<Array>} - Array of file metadata
   */
  getFilesByCategory: async (userId, category) => {
    try {
      const q = query(
        collection(db, "audioFiles"), 
        where("userId", "==", userId),
        where("metadata.type", "==", category)
      );
      const querySnapshot = await getDocs(q);
      
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
    } catch (error) {
      console.error(`Error getting ${category} files:`, error);
      throw error;
    }
  }
};

/**
 * Determine file category based on MIME type
 * @param {string} mimeType - The file's MIME type
 * @returns {string} - Category name
 */
export const getFileCategory = (mimeType) => {
  if (mimeType.startsWith('audio/')) {
    if (mimeType.includes('midi')) {
      return 'midi';
    }
    return 'audio';
  } else if (mimeType === 'text/plain') {
    return 'lyrics';
  } else if (mimeType === 'application/json') {
    return 'project';
  } else {
    return 'other';
  }
};

export default uploadService;
