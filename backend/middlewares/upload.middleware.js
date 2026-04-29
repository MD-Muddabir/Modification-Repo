const multer = require("multer");
const path = require("path");
const fs = require("fs");
const cloudinary = require("../config/cloudinary");

// ── Check if Cloudinary is configured (for logo uploads) ────────
const isCloudinaryConfigured =
    process.env.CLOUDINARY_CLOUD_NAME &&
    process.env.CLOUDINARY_CLOUD_NAME !== "your_cloud_name" &&
    process.env.CLOUDINARY_API_KEY &&
    process.env.CLOUDINARY_API_KEY !== "your_api_key";

let logoStorage;
if (isCloudinaryConfigured) {
    const { CloudinaryStorage } = require("multer-storage-cloudinary");
    logoStorage = new CloudinaryStorage({
        cloudinary,
        params: {
            folder: "zf-solution/logos",
            allowed_formats: ["jpg", "jpeg", "png", "webp"],
            transformation: [{ width: 400, height: 400, crop: "limit" }]
        }
    });
} else {
    const uploadDir = path.join(__dirname, "../uploads/logos");
    if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });
    logoStorage = multer.diskStorage({
        destination: (req, file, cb) => cb(null, uploadDir),
        filename: (req, file, cb) => {
            const ext = path.extname(file.originalname);
            cb(null, `logo_${Date.now()}_${Math.random().toString(36).substr(2, 6)}${ext}`);
        }
    });
}

const uploadLogo = multer({
    storage: logoStorage,
    limits: { fileSize: 5 * 1024 * 1024 },
    fileFilter: (req, file, cb) => {
        const allowed = ["image/jpg", "image/jpeg", "image/png", "image/webp"];
        if (allowed.includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new Error("Invalid file type. Only JPG, PNG, WEBP are allowed."));
        }
    }
});

module.exports = uploadLogo;
