# 🧪 API Testing Guide - Student SaaS

## Quick Start Testing

### 1. Health Check
```bash
curl http://localhost:5000/
```

### 2. Register First Institute (Super Admin)
```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d "{\"instituteName\":\"Demo Institute\",\"email\":\"admin@demo.com\",\"password\":\"admin123\"}"
```

### 3. Login
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"admin@demo.com\",\"password\":\"admin123\"}"
```

**Save the token from response!**

### 4. Create Student (Replace YOUR_TOKEN)
```bash
curl -X POST http://localhost:5000/api/students \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d "{\"name\":\"John Doe\",\"email\":\"john@demo.com\",\"phone\":\"1234567890\",\"roll_number\":\"STU001\",\"class_id\":1,\"date_of_birth\":\"2005-01-15\",\"gender\":\"male\",\"address\":\"123 Main St\"}"
```

### 5. Get All Students
```bash
curl http://localhost:5000/api/students \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### 6. Create Faculty
```bash
curl -X POST http://localhost:5000/api/faculty \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d "{\"name\":\"Dr. Smith\",\"email\":\"smith@demo.com\",\"phone\":\"9876543210\",\"qualification\":\"PhD\",\"experience\":10,\"specialization\":\"Mathematics\",\"salary\":50000}"
```

### 7. Create Class
```bash
curl -X POST http://localhost:5000/api/classes \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d "{\"name\":\"Class 10\",\"section\":\"A\",\"description\":\"Science Stream\"}"
```

### 8. Mark Attendance
```bash
curl -X POST http://localhost:5000/api/attendance \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d "{\"student_id\":1,\"class_id\":1,\"date\":\"2026-02-16\",\"status\":\"present\"}"
```

### 9. Create Exam
```bash
curl -X POST http://localhost:5000/api/exams \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d "{\"name\":\"Mid Term\",\"subject_id\":1,\"class_id\":1,\"exam_date\":\"2026-03-01\",\"total_marks\":100,\"passing_marks\":40}"
```

### 10. Get Student Statistics
```bash
curl http://localhost:5000/api/students/stats \
  -H "Authorization: Bearer YOUR_TOKEN"
```

## PowerShell Commands (Windows)

### Register Institute
```powershell
Invoke-RestMethod -Uri "http://localhost:5000/api/auth/register" -Method POST -Headers @{"Content-Type"="application/json"} -Body '{"instituteName":"Demo Institute","email":"admin@demo.com","password":"admin123"}'
```

### Login
```powershell
$response = Invoke-RestMethod -Uri "http://localhost:5000/api/auth/login" -Method POST -Headers @{"Content-Type"="application/json"} -Body '{"email":"admin@demo.com","password":"admin123"}'
$token = $response.token
Write-Host "Token: $token"
```

### Create Student
```powershell
Invoke-RestMethod -Uri "http://localhost:5000/api/students" -Method POST -Headers @{"Content-Type"="application/json";"Authorization"="Bearer $token"} -Body '{"name":"John Doe","email":"john@demo.com","phone":"1234567890","roll_number":"STU001","class_id":1,"date_of_birth":"2005-01-15","gender":"male","address":"123 Main St"}'
```

### Get All Students
```powershell
Invoke-RestMethod -Uri "http://localhost:5000/api/students" -Method GET -Headers @{"Authorization"="Bearer $token"}
```

## Testing with Postman

1. **Import Collection**: Create a new collection "Student SaaS"
2. **Set Base URL**: `http://localhost:5000`
3. **Add Environment Variable**: `token` (will be set after login)
4. **Test Sequence**:
   - Register → Login → Save token → Test other endpoints

## Expected Responses

### Success Response Format:
```json
{
  "success": true,
  "message": "Operation successful",
  "data": { ... }
}
```

### Error Response Format:
```json
{
  "success": false,
  "message": "Error description"
}
```

## Common Status Codes

- `200` - Success
- `201` - Created
- `400` - Bad Request
- `401` - Unauthorized (Invalid/Missing token)
- `403` - Forbidden (Insufficient permissions)
- `404` - Not Found
- `409` - Conflict (Duplicate entry)
- `500` - Internal Server Error

## Notes

- All protected endpoints require `Authorization: Bearer <token>` header
- Tokens are valid until server restart (no expiry set in development)
- Institute ID is automatically extracted from JWT token
- All list endpoints support pagination: `?page=1&limit=10`
- Search is available on student/faculty endpoints: `?search=john`
