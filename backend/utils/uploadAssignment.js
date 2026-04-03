/**
 * Assignment Upload Utility — Cloudinary Storage
 * Faculty reference files & student submissions
 * Files are permanently stored on Cloudinary (never lost on server restart)
 */

const multer = require("multer");
const { CloudinaryStorage } = require("multer-storage-cloudinary");
const cloudinary = require("../config/cloudinary");

// ── Cloudinary storage for assignments ───────────────────────────
const storage = new CloudinaryStorage({
    cloudinary,
    params: (req, file) => {
        const imageTypes = ["image/jpeg", "image/png", "image/jpg", "image/webp"];
        const isImage = imageTypes.includes(file.mimetype);

        return {
            folder: "student-saas/assignments",
            resource_type: isImage ? "image" : "raw",
            public_id: `asg-${Date.now()}-${Math.round(Math.random() * 1e6)}`,
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
        cb(new Error("Invalid file type. Only PDF, DOCX, IMAGE, and ZIP are allowed."), false);
    }
};

const uploadAssignment = multer({
    storage,
    limits: { fileSize: 50 * 1024 * 1024 }, // 50 MB
    fileFilter,
});

module.exports = { uploadAssignment };
