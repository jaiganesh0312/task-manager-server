const { Storage } = require('@google-cloud/storage');
const path = require('path');
const { v7: uuidv7 } = require('uuid');

// Check if credentials exist or use default environment variables
let storageOptions = {};
if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
    storageOptions.keyFilename = process.env.GOOGLE_APPLICATION_CREDENTIALS;
} else if (process.env.GCS_CREDENTIALS) {
    // Alternatively pass credentials as JSON string
    try {
        const decodedCredentials = Buffer.from(process.env.GCS_CREDENTIALS, 'base64').toString('utf8');
        storageOptions.credentials = JSON.parse(decodedCredentials);
    } catch (e) {
        console.error('Invalid GCS_CREDENTIALS_JSON format or encoding');
    }
}

// Ensure Project ID is available if using credentials directly
if (process.env.GCP_PROJECT_ID) {
    storageOptions.projectId = process.env.GCP_PROJECT_ID;
}

const storage = new Storage(storageOptions);

const bucketName = process.env.GCS_BUCKET_NAME;
const bucket = storage.bucket(bucketName);

/**
 * Upload a file buffer to Google Cloud Storage
 * @param {Buffer} fileBuffer - The buffer of the file to upload
 * @param {string} originalName - The original name of the file
 * @param {string} mimeType - The mime type of the file
 * @param {string} folder - Optional folder prefix (e.g., 'avatars/')
 * @returns {Promise<string>} The public URL of the uploaded file
 */
const uploadToGCS = async (fileBuffer, originalName, mimeType, folder = 'avatars/') => {
    try {
        // Generate a unique file name
        const ext = path.extname(originalName) || '';
        const uniqueFilename = `${folder}${uuidv7()}${ext}`;
        const file = bucket.file(uniqueFilename);

        // Upload the file buffer
        await file.save(fileBuffer, {
            metadata: {
                contentType: mimeType,
            },
        });

        // Generate the public URL
        const publicUrl = `https://storage.googleapis.com/${bucketName}/${uniqueFilename}`;
        return publicUrl;
    } catch (error) {
        console.error('GCS Upload Error:', error);
        throw new Error(`Failed to upload file to Google Cloud Storage: ${error.message}`);
    }
};

/**
 * Delete a file from Google Cloud Storage
 * @param {string} fileUrl - The public URL of the file to delete
 */
const deleteFromGCS = async (fileUrl) => {
    try {
        if (!fileUrl || !fileUrl.includes('storage.googleapis.com')) {
            return;
        }

        // Extract filename from URL (e.g., https://storage.googleapis.com/bucket-name/folder/filename.ext)
        const urlParts = fileUrl.split(`https://storage.googleapis.com/${bucketName}/`);
        if (urlParts.length !== 2) return;

        const filename = urlParts[1];
        if (!filename) return;

        const file = bucket.file(filename);
        const [exists] = await file.exists();

        if (exists) {
            await file.delete();
        }
    } catch (error) {
        console.error('GCS Delete Error:', error);
        // Don't throw error to prevent blocking main flows if deletion fails
    }
};

module.exports = {
    uploadToGCS,
    deleteFromGCS
};
