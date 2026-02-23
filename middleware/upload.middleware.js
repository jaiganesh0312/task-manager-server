const multer = require('multer');

// Configure multer for memory storage
// The file will be kept in memory instead of written to disk
const storage = multer.memoryStorage();

// File filter to only allow certain image types
const fileFilter = (req, file, cb) => {
    // Accept only specified image types
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];

    if (allowedTypes.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new Error('Invalid file type. Only JPEG, PNG, GIF, and WebP images are allowed.'), false);
    }
};

// Initialize multer upload
const upload = multer({
    storage: storage,
    limits: {
        fileSize: 5 * 1024 * 1024, // 5MB limit
    },
    fileFilter: fileFilter
});

module.exports = {
    upload
};
