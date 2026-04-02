const app = require("./app");
require("./utils/cron");

const PORT = process.env.PORT || 5000 || 8080;
const HOST = process.env.HOST || "0.0.0.0";

app.listen(PORT, HOST, () => {
    console.log(`✅ Server running on http://${HOST}:${PORT}`);
    console.log(`📱 Mobile devices can reach backend at http://[IP_ADDRESS]:${PORT}/api`);
});

// ✅ Optional: handle crashes (recommended)
process.on("uncaughtException", (err) => {
    console.error("❌ Uncaught Exception:", err.message);
    process.exit(1);
});

process.on("unhandledRejection", (err) => {
    console.error("❌ Unhandled Rejection:", err.message);
    process.exit(1);
});
