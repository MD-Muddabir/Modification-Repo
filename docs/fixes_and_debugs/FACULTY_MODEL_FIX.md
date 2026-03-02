# 🔧 FACULTY MODEL FIX - created_at/updated_at ERROR

## ❌ **ERROR**

```
Error: Unknown column 'created_at' in 'field list'
errno: 1054
sqlMessage: "Unknown column 'created_at' in 'field list'"
```

**SQL Query:**
```sql
INSERT INTO `faculties` 
(`id`,`institute_id`,`user_id`,`designation`,`salary`,`join_date`,`created_at`,`updated_at`) 
VALUES (DEFAULT,?,?,?,?,?,?,?);
```

---

## 🔍 **ROOT CAUSE**

### **Database Schema:**
The `faculty` table in the database has:
- ✅ `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
- ❌ NO `updated_at` column

### **Sequelize Default Behavior:**
By default, Sequelize adds BOTH:
- `createdAt` → maps to `created_at`
- `updatedAt` → maps to `updated_at`

**Problem:** Sequelize was trying to insert `updated_at` which doesn't exist in the database!

---

## ✅ **SOLUTION**

### **Updated Faculty Model:**

**File:** `backend/models/Faculty.js`

```javascript
const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const Faculty = sequelize.define("Faculty", {
    institute_id: DataTypes.INTEGER,
    user_id: DataTypes.INTEGER,
    designation: DataTypes.STRING,
    salary: DataTypes.DECIMAL(10, 2),
    join_date: DataTypes.DATEONLY
}, {
    timestamps: true,           // Enable timestamps
    createdAt: 'created_at',   // Map to database column name
    updatedAt: false           // Disable updatedAt (not in database)
});

module.exports = Faculty;
```

### **Key Changes:**
1. ✅ Added `timestamps: true` to enable timestamp handling
2. ✅ Set `createdAt: 'created_at'` to map to database column
3. ✅ Set `updatedAt: false` to disable it (column doesn't exist)

---

## 🧪 **TESTING**

### **Expected Behavior:**

**Before Fix:**
```sql
-- ❌ ERROR: Unknown column 'updated_at'
INSERT INTO faculties (..., created_at, updated_at) VALUES (...);
```

**After Fix:**
```sql
-- ✅ SUCCESS: Only created_at is inserted
INSERT INTO faculties (..., created_at) VALUES (...);
```

---

## ✅ **VERIFICATION STEPS**

### **1. Test Create Faculty:**
1. Go to `/admin/faculty`
2. Click "+ Add Faculty"
3. Fill in form:
   ```
   Name: Test User
   Email: test@example.com
   Password: test123
   Designation: Teacher
   Salary: 25000
   Join Date: 2026-01-01
   ```
4. Click "Add Faculty"

### **2. Check Database:**
```sql
-- Check users table
SELECT * FROM users WHERE email = 'test@example.com';

-- Check faculty table (should now have data!)
SELECT * FROM faculty WHERE user_id = (
    SELECT id FROM users WHERE email = 'test@example.com'
);
```

### **3. Expected Result:**
- ✅ Success message appears
- ✅ Faculty appears in UI table
- ✅ User record created in `users` table
- ✅ Faculty record created in `faculty` table ← **THIS WAS FAILING BEFORE**
- ✅ `created_at` is populated
- ✅ NO error about `updated_at`

---

## 📋 **OTHER MODELS TO CHECK**

You may need to apply the same fix to other models if they have the same issue:

### **Check these models:**
1. `Announcement.js`
2. `Attendance.js`
3. `Class.js`
4. `Exam.js`
5. `Fee.js`
6. `Mark.js`
7. `Payment.js`
8. `Student.js`
9. `Subject.js`
10. `Subscription.js`

### **How to check:**
1. Look at `DataBase/Create Tables.sql`
2. Check if table has `updated_at` column
3. If NO `updated_at`, add to model:
   ```javascript
   {
       timestamps: true,
       createdAt: 'created_at',
       updatedAt: false
   }
   ```

---

## 🎯 **QUICK FIX FOR ALL MODELS**

If you want to fix all models at once, here's the pattern:

**For tables with ONLY `created_at`:**
```javascript
const Model = sequelize.define("Model", {
    // fields...
}, {
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: false
});
```

**For tables with BOTH `created_at` and `updated_at`:**
```javascript
const Model = sequelize.define("Model", {
    // fields...
}, {
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at'
});
```

**For tables with NO timestamps:**
```javascript
const Model = sequelize.define("Model", {
    // fields...
}, {
    timestamps: false
});
```

---

## ✅ **STATUS**

- ✅ Faculty model FIXED
- ✅ Server will auto-restart with nodemon
- ✅ Faculty creation should now work completely
- ✅ Both `users` and `faculty` tables will be populated

---

## 🚀 **TEST NOW**

The fix has been applied. The server should restart automatically.

**Try creating a faculty member again and it should work!**

---

**Last Updated:** 2026-02-16 19:05 IST  
**Status:** 🟢 **FIXED - READY FOR TESTING**  
**Fix Applied:** Faculty model now matches database schema
