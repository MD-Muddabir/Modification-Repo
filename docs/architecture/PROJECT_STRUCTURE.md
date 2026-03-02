# 📁 COMPLETE PROJECT FOLDER STRUCTURE

## 🎯 **PROJECT ROOT**

```
D:\College\Simple Digital System for Coaching Centers\
│
├── backend/                    # Backend (Node.js + Express)
├── frontend/                   # Frontend (React + Vite)
├── DataBase/                   # Database SQL scripts
├── Documentation/              # Project documentation
└── package.json               # Root package.json (runs both frontend & backend)
```

---

## 🔧 **BACKEND STRUCTURE**

```
backend/
│
├── config/                     # Configuration files
│   └── database.js            # Sequelize database configuration
│
├── controllers/               # Business logic (handle requests)
│   ├── announcement.controller.js
│   ├── attendance.controller.js
│   ├── auth.controller.js
│   ├── class.controller.js
│   ├── exam.controller.js
│   ├── faculty.controller.js  ✅ FIXED
│   ├── fee.controller.js
│   ├── institute.controller.js
│   ├── mark.controller.js
│   ├── payment.controller.js
│   ├── plan.controller.js
│   ├── student.controller.js
│   ├── subject.controller.js
│   └── subscription.controller.js
│
├── middleware/                # Middleware functions
│   ├── auth.middleware.js     # JWT authentication
│   └── roleCheck.middleware.js # Role-based access control
│
├── models/                    # Database models (Sequelize)
│   ├── index.js              # Model associations & relationships
│   ├── Announcement.js
│   ├── Attendance.js
│   ├── Class.js
│   ├── Exam.js
│   ├── Faculty.js            ✅ Has: designation, salary, join_date
│   ├── Fee.js
│   ├── Institute.js
│   ├── Mark.js
│   ├── Payment.js
│   ├── Plan.js
│   ├── Student.js
│   ├── Subject.js
│   ├── Subscription.js
│   └── User.js
│
├── routes/                    # API route definitions
│   ├── announcement.routes.js
│   ├── attendance.routes.js
│   ├── auth.routes.js
│   ├── class.routes.js
│   ├── exam.routes.js
│   ├── faculty.routes.js     # Faculty CRUD routes
│   ├── fee.routes.js
│   ├── institute.routes.js
│   ├── mark.routes.js
│   ├── payment.routes.js
│   ├── plan.routes.js
│   ├── student.routes.js
│   ├── subject.routes.js
│   └── subscription.routes.js
│
├── services/                  # Service layer (reusable business logic)
│   └── auth.service.js       # Authentication services
│
├── utils/                     # Utility functions
│   └── hashPassword.js       # Password hashing utility
│
├── .env                       # Environment variables (DB credentials, JWT secret)
├── app.js                     # Express app configuration
├── server.js                  # Server entry point
├── package.json              # Backend dependencies
├── create-super-admin.js     # Script to create super admin
└── update-super-admin-password.js  # Script to update super admin password
```

---

## 🎨 **FRONTEND STRUCTURE**

```
frontend/
│
├── public/                    # Static assets
│   └── vite.svg
│
├── src/
│   │
│   ├── assets/               # Images, fonts, etc.
│   │
│   ├── components/           # Reusable React components
│   │   ├── ProtectedRoute.jsx  # Route protection by role
│   │   └── Navbar.jsx          # Navigation bar
│   │
│   ├── context/              # React Context API
│   │   └── AuthContext.jsx   # Authentication state management
│   │
│   ├── pages/                # Page components
│   │   │
│   │   ├── auth/             # Authentication pages
│   │   │   ├── Login.jsx
│   │   │   └── Register.jsx
│   │   │
│   │   ├── admin/            # Institute Admin pages
│   │   │   ├── Dashboard.jsx
│   │   │   ├── Students.jsx
│   │   │   ├── Faculty.jsx           ✅ FIXED
│   │   │   ├── Classes.jsx           ✅ NEW
│   │   │   ├── Subjects.jsx          ✅ NEW
│   │   │   ├── InstituteSettings.jsx ✅ NEW
│   │   │   ├── Announcements.jsx
│   │   │   ├── AttendanceReport.jsx  ⏳ TODO
│   │   │   ├── Exams.jsx             ⏳ TODO
│   │   │   └── Fees.jsx              ⏳ TODO
│   │   │
│   │   ├── superadmin/       # Super Admin pages
│   │   │   ├── Dashboard.jsx         ✅ NEW
│   │   │   ├── Institutes.jsx        ✅ NEW
│   │   │   ├── Plans.jsx             ✅ NEW
│   │   │   └── Analytics.jsx         ⏳ TODO
│   │   │
│   │   ├── faculty/          # Faculty pages
│   │   │   ├── Dashboard.jsx
│   │   │   ├── MarkAttendance.jsx    ⏳ TODO
│   │   │   ├── EnterMarks.jsx        ⏳ TODO
│   │   │   └── ViewStudents.jsx      ⏳ TODO
│   │   │
│   │   └── student/          # Student pages
│   │       ├── Dashboard.jsx
│   │       ├── ViewAttendance.jsx    ⏳ TODO
│   │       ├── ViewMarks.jsx         ⏳ TODO
│   │       └── ViewFees.jsx          ⏳ TODO
│   │
│   ├── routes/               # Route configuration
│   │   └── AppRoutes.jsx     # All application routes
│   │
│   ├── services/             # API service layer
│   │   └── api.js            # Axios instance with interceptors
│   │
│   ├── App.jsx               # Main App component
│   ├── App.css               # Global styles
│   ├── main.jsx              # React entry point
│   └── index.css             # Global CSS
│
├── .env                       # Frontend environment variables
├── package.json              # Frontend dependencies
├── vite.config.js            # Vite configuration
└── index.html                # HTML entry point
```

---

## 🗄️ **DATABASE STRUCTURE**

```
DataBase/
│
├── Create Tables.sql          # Main database schema
├── ALTER.sql                  # Schema modifications
├── create_super_admin.sql     # SQL to create super admin
└── sample_data.sql            # Sample data (if any)
```

---

## 📚 **DOCUMENTATION STRUCTURE**

```
Documentation/ (or root level)
│
├── GeneralReadme.md                    # Complete system requirements
├── IMPLEMENTATION_PLAN_COMPLETE.md     # Full implementation roadmap
├── SYSTEM_IMPLEMENTATION_SUMMARY.md    # System overview
├── SUPER_ADMIN_GUIDE.md               # Super admin login & features
├── TESTING_GUIDE_SUPER_ADMIN.md       # Super admin testing guide
├── INSTITUTE_ADMIN_COMPLETE.md        # Institute admin features
├── FACULTY_CRUD_FIX.md                # Faculty bug fix documentation
├── ERROR_FIX_REGISTRATION.md          # Registration error fix
├── ERROR_FIX_DATABASE_NAMING.md       # Database naming fix
├── PROGRESS_REPORT.md                 # Current progress
└── PROJECT_STRUCTURE.md               # This file
```

---

## 🔍 **WHERE TO ADD WHAT**

### **1. Adding a New Database Table**
**Location:** `DataBase/Create Tables.sql` or `DataBase/ALTER.sql`

**Example:**
```sql
CREATE TABLE new_table (
    id INT AUTO_INCREMENT PRIMARY KEY,
    institute_id INT NOT NULL,
    name VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (institute_id) REFERENCES institutes(id) ON DELETE CASCADE
);
```

---

### **2. Adding a New Model**
**Location:** `backend/models/NewModel.js`

**Example:**
```javascript
const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const NewModel = sequelize.define("NewModel", {
    institute_id: DataTypes.INTEGER,
    name: DataTypes.STRING,
});

module.exports = NewModel;
```

**Then add to:** `backend/models/index.js` for relationships

---

### **3. Adding a New Controller**
**Location:** `backend/controllers/newModel.controller.js`

**Example:**
```javascript
const { NewModel } = require("../models");

exports.create = async (req, res) => {
    try {
        const data = await NewModel.create(req.body);
        res.status(201).json({ success: true, data });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

exports.getAll = async (req, res) => {
    try {
        const data = await NewModel.findAll();
        res.status(200).json({ success: true, data });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
```

---

### **4. Adding New Routes**
**Location:** `backend/routes/newModel.routes.js`

**Example:**
```javascript
const express = require("express");
const router = express.Router();
const controller = require("../controllers/newModel.controller");
const { authenticate } = require("../middleware/auth.middleware");

router.post("/", authenticate, controller.create);
router.get("/", authenticate, controller.getAll);

module.exports = router;
```

**Then register in:** `backend/app.js`
```javascript
app.use("/api/newmodel", require("./routes/newModel.routes"));
```

---

### **5. Adding a New Frontend Page**
**Location:** `frontend/src/pages/[role]/NewPage.jsx`

**Example:**
```javascript
import { useState, useEffect } from "react";
import api from "../../services/api";

function NewPage() {
    const [data, setData] = useState([]);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const response = await api.get("/newmodel");
            setData(response.data.data);
        } catch (error) {
            console.error(error);
        }
    };

    return (
        <div className="dashboard-container">
            <h1>New Page</h1>
            {/* Your content */}
        </div>
    );
}

export default NewPage;
```

**Then add route in:** `frontend/src/routes/AppRoutes.jsx`

---

### **6. Adding API Calls**
**Location:** Use `frontend/src/services/api.js`

**Example:**
```javascript
import api from "../../services/api";

// GET request
const data = await api.get("/endpoint");

// POST request
const result = await api.post("/endpoint", { name: "value" });

// PUT request
const updated = await api.put("/endpoint/1", { name: "new value" });

// DELETE request
await api.delete("/endpoint/1");
```

---

## 📋 **CURRENT FILE COUNTS**

### **Backend:**
- ✅ Controllers: 14 files
- ✅ Models: 14 files
- ✅ Routes: 14 files
- ✅ Middleware: 2 files
- ✅ Services: 1 file
- ✅ Utils: 1 file

### **Frontend:**
- ✅ Admin Pages: 8 files
- ✅ Super Admin Pages: 3 files
- ✅ Faculty Pages: 1 file
- ✅ Student Pages: 1 file
- ✅ Auth Pages: 2 files

---

## 🎯 **KEY FILES TO KNOW**

### **Backend Entry Points:**
1. `backend/server.js` - Server startup
2. `backend/app.js` - Express app & route registration
3. `backend/config/database.js` - Database connection
4. `backend/models/index.js` - Model relationships

### **Frontend Entry Points:**
1. `frontend/src/main.jsx` - React entry point
2. `frontend/src/App.jsx` - Main app component
3. `frontend/src/routes/AppRoutes.jsx` - All routes
4. `frontend/src/context/AuthContext.jsx` - Auth state

### **Configuration Files:**
1. `backend/.env` - Backend environment variables
2. `frontend/.env` - Frontend environment variables
3. `backend/package.json` - Backend dependencies
4. `frontend/package.json` - Frontend dependencies
5. `package.json` (root) - Runs both servers

---

## 🚀 **QUICK REFERENCE**

### **To Add a New Feature:**

1. **Database:** Add table in `DataBase/Create Tables.sql`
2. **Model:** Create `backend/models/NewModel.js`
3. **Controller:** Create `backend/controllers/newModel.controller.js`
4. **Routes:** Create `backend/routes/newModel.routes.js`
5. **Register Route:** Add to `backend/app.js`
6. **Frontend Page:** Create `frontend/src/pages/[role]/NewPage.jsx`
7. **Add Route:** Update `frontend/src/routes/AppRoutes.jsx`

---

## ✅ **FILES RECENTLY MODIFIED**

### **Backend:**
- ✅ `backend/controllers/faculty.controller.js` - Fixed field names
- ✅ `backend/create-super-admin.js` - Created super admin script
- ✅ `backend/update-super-admin-password.js` - Password update script

### **Frontend:**
- ✅ `frontend/src/pages/admin/Faculty.jsx` - Complete CRUD
- ✅ `frontend/src/pages/admin/Classes.jsx` - Complete CRUD
- ✅ `frontend/src/pages/admin/Subjects.jsx` - Complete CRUD
- ✅ `frontend/src/pages/admin/InstituteSettings.jsx` - Profile completion
- ✅ `frontend/src/pages/superadmin/Dashboard.jsx` - Super admin dashboard
- ✅ `frontend/src/pages/superadmin/Institutes.jsx` - Institutes management
- ✅ `frontend/src/pages/superadmin/Plans.jsx` - Plans management

---

**This structure follows industry-standard MVC (Model-View-Controller) architecture!**

**Last Updated:** 2026-02-16 18:25 IST
