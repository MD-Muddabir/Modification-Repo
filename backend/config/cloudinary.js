/**
 * Cloudinary Configuration
 * Central cloud image storage — replaces local /uploads folder
 * All images are stored permanently on Cloudinary CDN
 */

const cloudinary = require("cloudinary").v2;

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key:    process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Test connection on startup
if (process.env.CLOUDINARY_CLOUD_NAME) {
    cloudinary.api.ping()
        .then(() => console.log("✅ Cloudinary connected successfully"))
        .catch((err) => console.warn("⚠️  Cloudinary ping failed (check credentials):", err.message));
} else {
    console.warn("⚠️  CLOUDINARY_CLOUD_NAME not set — image uploads will fail");
}

module.exports = cloudinary;
