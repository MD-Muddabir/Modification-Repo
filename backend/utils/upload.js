/**
 * Notes Upload Utility — Cloudinary Storage
 * PDF/DOCX/PPT/Image/ZIP files for faculty notes
 * Files are permanently stored on Cloudinary (never lost on server restart)
 */

const multer = require("multer");
const { CloudinaryStorage } = require("multer-storage-cloudinary");
const cloudinary = require("../config/cloudinary");

// ── Cloudinary storage for notes ──────────────────────────────────
const storage = new CloudinaryStorage({
    cloudinary,
    params: (req, file) => {
        // Determine resource_type (raw for non-images)
        const imageTypes = ["image/jpeg", "image/png", "image/jpg", "image/webp"];
        const isImage = imageTypes.includes(file.mimetype);

        return {
            folder: "student-saas/notes",
            resource_type: isImage ? "image" : "raw",
            public_id: `note-${Date.now()}-${Math.round(Math.random() * 1e6)}`,
            // Only apply image transformations when the file is an image
            ...(isImage && {
                transformation: [
                    { width: 2000, height: 2000, crop: "limit" },
                    { quality: "auto" },
                    { fetch_format: "auto" },
                ],
            }),
        };
    },
});

// ── Allowed MIME types ────────────────────────────────────────────
const allowedTypes = [
    "application/pdf",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "application/msword",
    "application/vnd.ms-powerpoint",
    "application/vnd.openxmlformats-officedocument.presentationml.presentation",
    "image/jpeg",
    "image/png",
    "image/jpg",
    "image/webp",
    "application/zip",
    "application/x-zip-compressed",
];

const fileFilter = (req, file, cb) => {
    if (allowedTypes.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new Error("Invalid file type. Only PDF, DOCX, PPT, IMAGE, and ZIP are allowed."), false);
    }
};

const uploadNote = multer({
    storage,
    limits: { fileSize: 20 * 1024 * 1024 }, // 20 MB
    fileFilter,
});

module.exports = { uploadNote };
