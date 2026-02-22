/**
 * Attendance Management Page
 * Professional implementation with bulk marking and reports
 */

import { useState, useEffect, useContext } from "react";
import { Link } from "react-router-dom";
import api from "../../services/api";
import { AuthContext } from "../../context/AuthContext";
import "./Dashboard.css";

function Attendance() {
    const { user } = useContext(AuthContext);
    const [classes, setClasses] = useState([]);
    const [selectedClass, setSelectedClass] = useState("");
    const [subjects, setSubjects] = useState([]);
    const [selectedSubject, setSelectedSubject] = useState("");
    const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
    const [students, setStudents] = useState([]);
    const [attendanceData, setAttendanceData] = useState({});
    const [loading, setLoading] = useState(false);
    const [dashboardStats, setDashboardStats] = useState(null);
    const [showReport, setShowReport] = useState(false);
    const [reportData, setReportData] = useState(null);

    useEffect(() => {
        fetchClasses();
        fetchDashboardStats();
    }, []);

    useEffect(() => {
        if (selectedClass) {
            fetchSubjects();
        } else {
            setSubjects([]);
            setSelectedSubject("");
        }
    }, [selectedClass]);

    useEffect(() => {
        if (selectedClass && selectedSubject && selectedDate) {
            fetchClassAttendance();
        } else {
            setStudents([]);
        }
    }, [selectedClass, selectedSubject, selectedDate]);

    const fetchClasses = async () => {
        try {
            const response = await api.get("/classes");
            setClasses(response.data.data || []);
        } catch (error) {
            console.error("Error fetching classes:", error);
        }
    };

    const fetchSubjects = async () => {
        try {
            const response = await api.get(`/subjects?class_id=${selectedClass}`);
            setSubjects(response.data.data || []);
            setSelectedSubject("");
        } catch (error) {
            console.error("Error fetching subjects:", error);
        }
    };

    const fetchDashboardStats = async () => {
        try {
            const response = await api.get("/attendance/dashboard");
            setDashboardStats(response.data.data);
        } catch (error) {
            console.error("Error fetching dashboard stats:", error);
        }
    };

    const fetchClassAttendance = async () => {
        setLoading(true);
        try {
            const response = await api.get(`/attendance/class/${selectedClass}/subject/${selectedSubject}/date/${selectedDate}`);
            setStudents(response.data.data || []);

            // Initialize attendance data
            const initialData = {};
            response.data.data.forEach(student => {
                if (student.attendance) {
                    initialData[student.student_id] = {
                        status: student.attendance.status,
                        remarks: student.attendance.remarks || ""
                    };
                } else {
                    initialData[student.student_id] = {
                        status: "present",
                        remarks: ""
                    };
                }
            });
            setAttendanceData(initialData);
        } catch (error) {
            console.error("Error fetching attendance:", error);
            alert("Error loading attendance data");
        } finally {
            setLoading(false);
        }
    };

    const handleStatusChange = (studentId, status) => {
        setAttendanceData(prev => ({
            ...prev,
            [studentId]: {
                ...prev[studentId],
                status
            }
        }));
    };

    const handleRemarksChange = (studentId, remarks) => {
        setAttendanceData(prev => ({
            ...prev,
            [studentId]: {
                ...prev[studentId],
                remarks
            }
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!selectedClass || !selectedSubject || !selectedDate) {
            alert("Please select class, subject and date");
            return;
        }

        try {
            const attendance_data = Object.keys(attendanceData).map(studentId => ({
                student_id: parseInt(studentId),
                status: attendanceData[studentId].status,
                remarks: attendanceData[studentId].remarks
            }));

            await api.post("/attendance/bulk", {
                class_id: parseInt(selectedClass),
                subject_id: parseInt(selectedSubject),
                date: selectedDate,
                attendance_data
            });

            alert("Attendance marked successfully!");
            fetchDashboardStats();
            fetchClassAttendance();
        } catch (error) {
            const errorMessage = error.response?.data?.message || "Error marking attendance";
            alert(errorMessage);
        }
    };

    const handleViewReport = async () => {
        if (!selectedClass) {
            alert("Please select a class");
            return;
        }

        try {
            const response = await api.get(`/attendance/class/${selectedClass}/summary`);
            setReportData(response.data);
            setShowReport(true);
        } catch (error) {
            alert("Error loading report");
        }
    };

    const markAllPresent = () => {
        const newData = {};
        students.forEach(student => {
            newData[student.student_id] = {
                status: "present",
                remarks: attendanceData[student.student_id]?.remarks || ""
            };
        });
        setAttendanceData(newData);
    };

    const markAllAbsent = () => {
        const newData = {};
        students.forEach(student => {
            newData[student.student_id] = {
                status: "absent",
                remarks: attendanceData[student.student_id]?.remarks || ""
            };
        });
        setAttendanceData(newData);
    };

    return (
        <div className="dashboard-container">
            <div className="dashboard-header">
                <div>
                    <h1>📋 Attendance Management</h1>
                    <p>Mark and track student attendance</p>
                </div>
                <div style={{ display: "flex", gap: "10px" }}>
                    <Link to="/admin/dashboard" className="btn btn-secondary">
                        ← Back
                    </Link>
                    {selectedClass && (
                        <button onClick={handleViewReport} className="btn btn-primary">
                            📊 View Report
                        </button>
                    )}
                </div>
            </div>

            {/* Dashboard Stats */}
            {dashboardStats && (
                <div className="stats-grid" style={{ marginBottom: "2rem" }}>
                    <div className="stat-card">
                        <div className="stat-icon">📅</div>
                        <div className="stat-content">
                            <h3>{dashboardStats.today.percentage}%</h3>
                            <p>Today's Attendance</p>
                            <small>{dashboardStats.today.present}/{dashboardStats.today.total} present</small>
                        </div>
                    </div>
                    <div className="stat-card">
                        <div className="stat-icon">📊</div>
                        <div className="stat-content">
                            <h3>{dashboardStats.this_month.percentage}%</h3>
                            <p>This Month Average</p>
                            <small>{dashboardStats.this_month.present}/{dashboardStats.this_month.total} present</small>
                        </div>
                    </div>
                    <div className="stat-card">
                        <div className="stat-icon">⚠️</div>
                        <div className="stat-content">
                            <h3>{dashboardStats.low_attendance_count}</h3>
                            <p>Below 75%</p>
                            <small>Students at risk</small>
                        </div>
                    </div>
                </div>
            )}

            {/* Filters */}
            <div className="card" style={{ marginBottom: "2rem" }}>
                <div style={{ padding: "1.5rem" }}>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "1rem" }}>
                        <div className="form-group">
                            <label className="form-label">Select Class *</label>
                            <select
                                className="form-select"
                                value={selectedClass}
                                onChange={(e) => setSelectedClass(e.target.value)}
                            >
                                <option value="">Choose a class</option>
                                {classes.map((cls) => (
                                    <option key={cls.id} value={cls.id}>
                                        {cls.name} {cls.section && `- ${cls.section}`}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div className="form-group">
                            <label className="form-label">Select Subject *</label>
                            <select
                                className="form-select"
                                value={selectedSubject}
                                onChange={(e) => setSelectedSubject(e.target.value)}
                                disabled={!selectedClass}
                            >
                                <option value="">Choose a subject</option>
                                {subjects.map((sub) => (
                                    <option key={sub.id} value={sub.id}>
                                        {sub.name}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div className="form-group">
                            <label className="form-label">Select Date *</label>
                            <input
                                type="date"
                                className="form-input"
                                value={selectedDate}
                                onChange={(e) => setSelectedDate(e.target.value)}
                                max={new Date().toISOString().split('T')[0]}
                            />
                        </div>
                    </div>
                </div>
            </div>

            {/* Attendance Marking */}
            {selectedClass && selectedSubject && selectedDate && (
                <div className="card">
                    <div className="card-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <h3 className="card-title">Mark Attendance ({students.length} students)</h3>
                        <div style={{ display: "flex", gap: "10px" }}>
                            <button onClick={markAllPresent} className="btn btn-sm btn-success">
                                ✓ All Present
                            </button>
                            <button onClick={markAllAbsent} className="btn btn-sm btn-danger">
                                × All Absent
                            </button>
                        </div>
                    </div>

                    {loading ? (
                        <div style={{ padding: "2rem", textAlign: "center" }}>Loading...</div>
                    ) : (
                        <form onSubmit={handleSubmit}>
                            <div className="table-container">
                                <table className="table">
                                    <thead>
                                        <tr>
                                            <th>Roll No</th>
                                            <th>Student Name</th>
                                            <th>Status</th>
                                            <th>Remarks</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {students.length === 0 ? (
                                            <tr>
                                                <td colSpan="4" style={{ textAlign: "center", padding: "2rem" }}>
                                                    No students found in this class
                                                </td>
                                            </tr>
                                        ) : (
                                            students.map((student) => (
                                                <tr key={student.student_id}>
                                                    <td>
                                                        <span className="badge badge-secondary">
                                                            {student.roll_number}
                                                        </span>
                                                    </td>
                                                    <td>
                                                        <strong>{student.name}</strong>
                                                        <br />
                                                        <small style={{ color: "#6b7280" }}>{student.email}</small>
                                                    </td>
                                                    <td>
                                                        <div style={{ display: "flex", gap: "10px" }}>
                                                            <label style={{ display: "flex", alignItems: "center", gap: "5px", cursor: "pointer" }}>
                                                                <input
                                                                    type="radio"
                                                                    name={`status-${student.student_id}`}
                                                                    value="present"
                                                                    checked={attendanceData[student.student_id]?.status === "present"}
                                                                    onChange={() => handleStatusChange(student.student_id, "present")}
                                                                />
                                                                <span style={{ color: "#10b981" }}>Present</span>
                                                            </label>
                                                            <label style={{ display: "flex", alignItems: "center", gap: "5px", cursor: "pointer" }}>
                                                                <input
                                                                    type="radio"
                                                                    name={`status-${student.student_id}`}
                                                                    value="absent"
                                                                    checked={attendanceData[student.student_id]?.status === "absent"}
                                                                    onChange={() => handleStatusChange(student.student_id, "absent")}
                                                                />
                                                                <span style={{ color: "#ef4444" }}>Absent</span>
                                                            </label>
                                                            <label style={{ display: "flex", alignItems: "center", gap: "5px", cursor: "pointer" }}>
                                                                <input
                                                                    type="radio"
                                                                    name={`status-${student.student_id}`}
                                                                    value="late"
                                                                    checked={attendanceData[student.student_id]?.status === "late"}
                                                                    onChange={() => handleStatusChange(student.student_id, "late")}
                                                                />
                                                                <span style={{ color: "#f59e0b" }}>Late</span>
                                                            </label>
                                                        </div>
                                                    </td>
                                                    <td>
                                                        <input
                                                            type="text"
                                                            className="form-input"
                                                            placeholder="Optional remarks"
                                                            value={attendanceData[student.student_id]?.remarks || ""}
                                                            onChange={(e) => handleRemarksChange(student.student_id, e.target.value)}
                                                            style={{ minWidth: "200px" }}
                                                        />
                                                    </td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </table>
                            </div>

                            {students.length > 0 && (
                                <div style={{ padding: "1.5rem", borderTop: "1px solid #e5e7eb", textAlign: "right" }}>
                                    <button type="submit" className="btn btn-primary" style={{ minWidth: "200px" }}>
                                        ✓ Submit Attendance
                                    </button>
                                </div>
                            )}
                        </form>
                    )}
                </div>
            )}

            {/* Report Modal */}
            {showReport && reportData && (
                <div className="modal-overlay" onClick={() => setShowReport(false)}>
                    <div className="modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: "900px" }}>
                        <div className="modal-header">
                            <h3>📊 Attendance Report</h3>
                            <button onClick={() => setShowReport(false)} className="btn btn-sm">×</button>
                        </div>
                        <div className="modal-body">
                            {reportData.at_risk_students && reportData.at_risk_students.length > 0 && (
                                <div style={{ marginBottom: "1.5rem", padding: "1rem", backgroundColor: "#fef2f2", borderRadius: "8px", border: "1px solid #fecaca" }}>
                                    <h4 style={{ color: "#dc2626", marginBottom: "0.5rem" }}>⚠️ Students Below 75%</h4>
                                    <p style={{ fontSize: "0.875rem", color: "#991b1b" }}>
                                        {reportData.at_risk_students.length} student(s) need attention
                                    </p>
                                </div>
                            )}

                            <div className="table-container">
                                <table className="table">
                                    <thead>
                                        <tr>
                                            <th>Roll No</th>
                                            <th>Name</th>
                                            <th>Total Days</th>
                                            <th>Present</th>
                                            <th>Absent</th>
                                            <th>Late</th>
                                            <th>Percentage</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {reportData.data.map((student) => (
                                            <tr key={student.student_id}>
                                                <td>{student.roll_number}</td>
                                                <td>{student.name}</td>
                                                <td>{student.total_days}</td>
                                                <td><span style={{ color: "#10b981" }}>{student.present_days}</span></td>
                                                <td><span style={{ color: "#ef4444" }}>{student.absent_days}</span></td>
                                                <td><span style={{ color: "#f59e0b" }}>{student.late_days}</span></td>
                                                <td>
                                                    <span className={`badge ${student.percentage >= 75 ? 'badge-success' : 'badge-danger'}`}>
                                                        {student.percentage}%
                                                    </span>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default Attendance;
