const { initializeApp } = require('firebase/app');
const { getStorage, ref, uploadBytes } = require('firebase/storage');
const { getAuth, signInAnonymously } = require('firebase/auth');
const fs = require('fs').promises;
const path = require('path');

// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyCvcdiMNJ6K8J47JZ3WE4PNH99sOS2HTa8",
  authDomain: "lecturemate-ad674.firebaseapp.com",
  projectId: "lecturemate-ad674",
  storageBucket: "lecturemate-ad674.firebasestorage.app",
  messagingSenderId: "372498362553",
  appId: "1:372498362553:web:0f75a6865f72f1debc6b68"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const storage = getStorage(app);
const auth = getAuth(app);

const TRANSCRIPTIONS_DIR = path.join(__dirname, '..', 'transcriptions');

async function verifyStorageBucket() {
  try {
    // Try to create a test reference
    const testRef = ref(storage, 'test.txt');
    console.log('Storage bucket verified:', storage.app.options.storageBucket);
    return true;
  } catch (error) {
    console.error('Error verifying storage bucket:', error);
    return false;
  }
}

async function uploadFile(filePath, destinationPath, retryCount = 3) {
  for (let attempt = 1; attempt <= retryCount; attempt++) {
    try {
      console.log(`Reading file: ${filePath} (Attempt ${attempt}/${retryCount})`);
      const fileContent = await fs.readFile(filePath);
      console.log(`File size: ${fileContent.length} bytes`);

      // Normalize the destination path to use forward slashes
      const normalizedPath = destinationPath.replace(/\\/g, '/');
      console.log(`Uploading to Firebase Storage: ${normalizedPath}`);
      
      const storageRef = ref(storage, normalizedPath);
      
      // Upload file with metadata
      const metadata = {
        contentType: 'application/pdf',
        cacheControl: 'public, max-age=31536000' // Cache for 1 year
      };
      
      await uploadBytes(storageRef, fileContent, metadata);
      console.log(`Successfully uploaded: ${normalizedPath}`);
      return true;
    } catch (error) {
      console.error(`Error uploading ${filePath} (Attempt ${attempt}/${retryCount}):`, error);
      
      if (error.code === 'storage/unauthorized') {
        console.log('Current auth state:', auth.currentUser);
        throw error; // Don't retry on auth errors
      }
      
      if (attempt < retryCount) {
        const delay = Math.min(1000 * Math.pow(2, attempt - 1), 10000); // Exponential backoff, max 10s
        console.log(`Waiting ${delay}ms before retry...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }
  
  console.log(`Failed to upload ${filePath} after ${retryCount} attempts`);
  return false;
}

async function uploadDirectory(dirPath) {
  try {
    const entries = await fs.readdir(dirPath, { withFileTypes: true });
    let successCount = 0;
    let failureCount = 0;
    
    for (const entry of entries) {
      const fullPath = path.join(dirPath, entry.name);
      
      if (entry.isDirectory()) {
        const { success, failure } = await uploadDirectory(fullPath);
        successCount += success;
        failureCount += failure;
      } else if (entry.isFile() && entry.name.endsWith('.pdf')) {
        console.log('Processing file:', entry.name);
        console.log('Full path:', fullPath);
        
        // Get the relative path from the transcriptions directory
        const relativePath = path.relative(TRANSCRIPTIONS_DIR, fullPath);
        // Construct the storage path
        const storagePath = `transcriptions/${relativePath}`;
        console.log('Storage path:', storagePath);
        
        const success = await uploadFile(fullPath, storagePath);
        if (success) {
          successCount++;
        } else {
          failureCount++;
        }
      }
    }
    
    return { success: successCount, failure: failureCount };
  } catch (error) {
    console.error(`Error processing directory ${dirPath}:`, error);
    return { success: 0, failure: 0 };
  }
}

// Start the upload process
async function main() {
  try {
    console.log('Starting upload process...');
    console.log('Base directory:', TRANSCRIPTIONS_DIR);
    
    // First check if the directory exists
    try {
      await fs.access(TRANSCRIPTIONS_DIR);
    } catch (error) {
      console.error('Transcriptions directory does not exist:', TRANSCRIPTIONS_DIR);
      return;
    }

    // Sign in anonymously
    console.log('Authenticating with Firebase...');
    const userCredential = await signInAnonymously(auth);
    console.log('Successfully authenticated:', userCredential.user.uid);

    // Verify storage bucket
    console.log('Verifying storage bucket...');
    const bucketVerified = await verifyStorageBucket();
    if (!bucketVerified) {
      console.error('Failed to verify storage bucket. Please check your Firebase configuration.');
      return;
    }
    
    const { success, failure } = await uploadDirectory(TRANSCRIPTIONS_DIR);
    console.log(`Upload process completed!`);
    console.log(`Successfully uploaded: ${success} files`);
    console.log(`Failed to upload: ${failure} files`);
  } catch (error) {
    console.error('Upload process failed:', error);
  }
}

main(); 