const fs = require('fs');
const path = require('path');
const appPath = path.join(__dirname, '..', 'app.js');
let c = fs.readFileSync(appPath, 'utf8');
if (c.includes('/api/lifetime')) { console.log('Already registered'); process.exit(0); }
c = c.replace(
  'app.use("/api/leads", require("./routes/lead.routes"));',
  'app.use("/api/leads", require("./routes/lead.routes"));\napp.use("/api/lifetime", require("./routes/lifetime.routes")); // Lifetime plan'
);
fs.writeFileSync(appPath, c, 'utf8');
console.log('done');
