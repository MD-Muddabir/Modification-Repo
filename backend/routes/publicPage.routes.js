/**
 * Admin Public Page Routes
 * All routes protected by JWT auth
 * Images uploaded to Cloudinary (permanent CDN storage)
 */

const express = require("express");
const router = express.Router();
const multer = require("multer");
const { CloudinaryStorage } = require("multer-storage-cloudinary");
const cloudinary = require("../config/cloudinary");
const verifyToken = require("../middlewares/auth.middleware");
const publicPageController = require("../controllers/publicPage.controller");

// ── Cloudinary storage for public page images ─────────────────────
const imageStorage = new CloudinaryStorage({
    cloudinary,
    params: {
        folder: "student-saas/public-page",
        allowed_formats: ["jpg", "jpeg", "png", "webp"],
        transformation: [
            { width: 1400, height: 1400, crop: "limit" },
            { quality: "auto" },
            { fetch_format: "auto" },
        ],
        public_id: (req, file) =>
            `pub_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
    },
});

const fileFilter = (req, file, cb) => {
    const allowed = ["image/jpg", "image/jpeg", "image/png", "image/webp"];
    if (allowed.includes(file.mimetype)) cb(null, true);
    else cb(new Error("Only jpg, jpeg, png, webp files are allowed"), false);
};

// Single-file uploader (gallery, faculty)
const upload = multer({
    storage: imageStorage,
    fileFilter,
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
});

// Dynamic uploader (logo, cover_photo, manual_course_img_*, manual_faculty_img_*, faculty_img_*)
const uploadDynamic = multer({
    storage: imageStorage,
    fileFilter,
    limits: { fileSize: 5 * 1024 * 1024 },
}).any();

// Wrapper: convert array from .any() to keyed object like .fields()
const wrapDynamic = (req, res, next) => {
    uploadDynamic(req, res, (err) => {
        if (err) return res.status(400).json({ success: false, message: err.message });
        if (Array.isArray(req.files)) {
            const filesMap = {};
            req.files.forEach((f) => {
                if (!filesMap[f.fieldname]) filesMap[f.fieldname] = [];
                filesMap[f.fieldname].push(f);
            });
            req.files = filesMap;
        }
        next();
    });
};

// ── All routes require authentication ─────────────────────────────
router.use(verifyToken);

// Check if feature is available
router.get("/check-feature", publicPageController.checkPublicPageFeature);

// Main profile routes
router.get("/", publicPageController.getPublicPage);
router.post("/", wrapDynamic, publicPageController.createOrUpdatePublicPage);
router.put("/", wrapDynamic, publicPageController.createOrUpdatePublicPage);

// Publish / Unpublish
router.post("/publish",   publicPageController.publishPage);
router.post("/unpublish", publicPageController.unpublishPage);

// Gallery
router.post("/gallery",        upload.single("photo"), publicPageController.uploadGalleryPhoto);
router.delete("/gallery/:id",  publicPageController.deleteGalleryPhoto);

// Faculty images (auto mode)
router.post("/faculty-image/:id",   upload.single("photo"), publicPageController.uploadFacultyImage);
router.delete("/faculty-image/:id", publicPageController.deleteFacultyImage);

// Reviews
router.post("/reviews",        publicPageController.addReview);
router.put("/reviews/:id",     publicPageController.updateReview);
router.delete("/reviews/:id",  publicPageController.deleteReview);

// Data for wizard
router.get("/faculty",  publicPageController.getFacultyList);
router.get("/subjects", publicPageController.getSubjectList);

module.exports = router;
