// Importing required modules
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const sharp = require("sharp");

// Importing the service function to delete uploaded files
const { deleteImages } = require("../services/deleteImage");

// Ensure the uploads directory exists
const ensureUploadDir = (dir) => {
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }
};

// Generate a unique filename with a timestamp
const generateFileName = (file) => {
    const timestamp = Date.now();
    const sanitizedOriginalName = file.originalname.replace(/\s+/g, '-');
    return `${timestamp}_${sanitizedOriginalName}.webp`; // Save as WebP format
};

// Configuration for Multer and file storage
const galleryStorage = multer.memoryStorage(); // Store in memory for processing

const galleryUpload = multer({
    storage: galleryStorage
});

// Image Compression Middleware
const compressImages = async (req, res, next) => {
    try {
        if (!req.files || Object.keys(req.files).length === 0) {
            return next(); // No files uploaded, proceed
        }

        const uploadDir = path.join(__dirname, "../uploads/");
        ensureUploadDir(uploadDir);

        for (const fieldname in req.files) {
            for (const file of req.files[fieldname]) {
                const newFileName = generateFileName(file);
                const filePath = path.join(uploadDir, newFileName);

                await sharp(file.buffer)
                    .resize({ width: 800, withoutEnlargement: true })
                    .withMetadata()
                    .toFormat('webp', { quality: 50 }) // Convert to WebP with 50% quality
                    .toFile(filePath);

                // Replace original file details with compressed file details
                file.filename = newFileName;
                file.path = filePath;
                file.mimetype = "image/webp";
            }
        }

        next();
    } catch (error) {
        console.error("Image compression failed:", error);
        next(new Error("Image compression process failed."));
    }
};

// Upload Middleware
const uploadMiddleware = (fields) => {
    return (req, res, next) => {
        galleryUpload.fields(fields)(req, res, async (err) => {
            if (err) {
                return res.status(400).json({ error: err.message });
            }

            const files = req.files;
            const errors = [];

            // MIME types for disallowed file formats
            const disallowedTypes = [
                'application/pdf',
                'video/mp4',
                'video/mpeg',
                'video/ogg',
                'video/webm',
                'video/quicktime',
                'video/x-msvideo',
                'video/x-flv'
            ];

            // Validate file types
            Object.keys(files).forEach((fieldname) => {
                files[fieldname].forEach((file) => {
                    if (disallowedTypes.includes(file.mimetype)) {
                        errors.push(`Invalid file type: ${file.originalname}. Only image formats are allowed.`);
                    }
                });
            });

            if (errors.length > 0) {
                // Remove uploaded files
                Object.keys(files).forEach((fieldname) => {
                    files[fieldname].forEach((file) => {
                        deleteImages(file.filename);
                    });
                });

                req.flash('error', errors.join('\n'));
                return res.redirect(req.get('Referrer') || process.env.BASE_URL);
            }

            req.files = files;

            // Proceed to compress images
            await compressImages(req, res, next);
        });
    };
};

// Define fields for upload
const fieldsToUpload = [
    { name: 'image', maxCount: 1 },
    { name: 'gallery', maxCount: 30 }
];

const multiplefile = uploadMiddleware(fieldsToUpload);

module.exports = multiplefile;
