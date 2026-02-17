/**
 * Reports & Analytics Page
 * Professional implementation with multiple report types
 */

import { useState, useEffect, useContext } from "react";
import { Link } from "react-router-dom";
import api from "../../services/api";
import { AuthContext } from "../../context/AuthContext";
import "./Dashboard.css";

function Reports() {
    const { user } = useContext(AuthContext);
    const [activeTab, setActiveTab] = useState("dashboard");
    const [dashboardData, setDashboardData] = useState(null);
    const [attendanceReport, setAttendanceReport] = useState(null);
    const [feesReport, setFeesReport] = useState(null);
    const [monthlyTrends, setMonthlyTrends] = useState(null);
    const [classes, setClasses] = useState([]);
    const [loading, setLoading] = useState(false);

    // Filters
    const [filters, setFilters] = useState({
        start_date: new Date(new Date().setDate(1)).toISOString().split('T')[0], // First day of month
        end_date: new Date().toISOString().split('T')[0],
        class_id: "",
        student_id: ""
    });

    useEffect(() => {
        fetchClasses();
        fetchDashboardData();
    }, []);

    useEffect(() => {
        if (activeTab === "attendance") {
            fetchAttendanceReport();
        } else if (activeTab === "fees") {
            fetchFeesReport();
        } else if (activeTab === "trends") {
            fetchMonthlyTrends();
        }
    }, [activeTab, filters]);

    const fetchClasses = async () => {
        try {
            const response = await api.get("/classes");
            setClasses(response.data.data || []);
        } catch (error) {
            console.error("Error fetching classes:", error);
        }
    };

    const fetchDashboardData = async () => {
        setLoading(true);
        try {
            const response = await api.get("/reports/dashboard");
            setDashboardData(response.data.data);
        } catch (error) {
            console.error("Error fetching dashboard:", error);
        } finally {
            setLoading(false);
        }
    };

    const fetchAttendanceReport = async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams();
            if (filters.start_date) params.append('start_date', filters.start_date);
            if (filters.end_date) params.append('end_date', filters.end_date);
            if (filters.class_id) params.append('class_id', filters.class_id);

            const response = await api.get(`/reports/attendance?${params}`);
            setAttendanceReport(response.data.data);
        } catch (error) {
            console.error("Error fetching attendance report:", error);
        } finally {
            setLoading(false);
        }
    };

    const fetchFeesReport = async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams();
            if (filters.start_date) params.append('start_date', filters.start_date);
            if (filters.end_date) params.append('end_date', filters.end_date);
            if (filters.class_id) params.append('class_id', filters.class_id);

            const response = await api.get(`/reports/fees?${params}`);
            setFeesReport(response.data.data);
        } catch (error) {
            console.error("Error fetching fees report:", error);
        } finally {
            setLoading(false);
        }
    };

    const fetchMonthlyTrends = async () => {
        setLoading(true);
        try {
            const response = await api.get("/reports/monthly-trends?months=6");
            setMonthlyTrends(response.data.data);
        } catch (error) {
            console.error("Error fetching trends:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleFilterChange = (key, value) => {
        setFilters(prev => ({ ...prev, [key]: value }));
    };

    return (
        <div className="dashboard-container">
            <div className="dashboard-header">
                <div>
                    <h1>📊 Reports & Analytics</h1>
                    <p>Comprehensive insights and performance metrics</p>
                </div>
                <Link to="/admin/dashboard" className="btn btn-secondary">
                    ← Back
                </Link>
            </div>

            {/* Tab Navigation */}
            <div className="tabs" style={{ marginBottom: "2rem" }}>
                <button
                    className={`tab ${activeTab === "dashboard" ? "active" : ""}`}
                    onClick={() => setActiveTab("dashboard")}
                >
                    📈 Dashboard
                </button>
                <button
                    className={`tab ${activeTab === "attendance" ? "active" : ""}`}
                    onClick={() => setActiveTab("attendance")}
                >
                    📋 Attendance Report
                </button>
                <button
                    className={`tab ${activeTab === "fees" ? "active" : ""}`}
                    onClick={() => setActiveTab("fees")}
                >
                    💰 Fees Report
                </button>
                <button
                    className={`tab ${activeTab === "trends" ? "active" : ""}`}
                    onClick={() => setActiveTab("trends")}
                >
                    📊 Monthly Trends
                </button>
            </div>

            {/* Dashboard Tab */}
            {activeTab === "dashboard" && dashboardData && (
                <div>
                    <h2 style={{ marginBottom: "1.5rem" }}>Overview</h2>
                    <div className="stats-grid">
                        <div className="stat-card">
                            <div className="stat-icon">👨‍🎓</div>
                            <div className="stat-content">
                                <h3>{dashboardData.overview.total_students}</h3>
                                <p>Total Students</p>
                                <small>{dashboardData.overview.new_admissions_this_month} new this month</small>
                            </div>
                        </div>
                        <div className="stat-card">
                            <div className="stat-icon">👩‍🏫</div>
                            <div className="stat-content">
                                <h3>{dashboardData.overview.total_faculty}</h3>
                                <p>Total Faculty</p>
                            </div>
                        </div>
                        <div className="stat-card">
                            <div className="stat-icon">📚</div>
                            <div className="stat-content">
                                <h3>{dashboardData.overview.total_classes}</h3>
                                <p>Total Classes</p>
                            </div>
                        </div>
                        <div className="stat-card">
                            <div className="stat-icon">📅</div>
                            <div className="stat-content">
                                <h3>{dashboardData.today_attendance.percentage}%</h3>
                                <p>Today's Attendance</p>
                                <small>{dashboardData.today_attendance.present}/{dashboardData.today_attendance.total} present</small>
                            </div>
                        </div>
                        <div className="stat-card">
                            <div className="stat-icon">💰</div>
                            <div className="stat-content">
                                <h3>₹{dashboardData.monthly_fees.collected.toLocaleString()}</h3>
                                <p>Fees Collected</p>
                                <small>{dashboardData.monthly_fees.month}</small>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Attendance Report Tab */}
            {activeTab === "attendance" && (
                <div>
                    {/* Filters */}
                    <div className="card" style={{ marginBottom: "2rem" }}>
                        <div style={{ padding: "1.5rem" }}>
                            <h3 style={{ marginBottom: "1rem" }}>Filters</h3>
                            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "1rem" }}>
                                <div className="form-group">
                                    <label className="form-label">Start Date</label>
                                    <input
                                        type="date"
                                        className="form-input"
                                        value={filters.start_date}
                                        onChange={(e) => handleFilterChange('start_date', e.target.value)}
                                    />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">End Date</label>
                                    <input
                                        type="date"
                                        className="form-input"
                                        value={filters.end_date}
                                        onChange={(e) => handleFilterChange('end_date', e.target.value)}
                                    />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Class</label>
                                    <select
                                        className="form-select"
                                        value={filters.class_id}
                                        onChange={(e) => handleFilterChange('class_id', e.target.value)}
                                    >
                                        <option value="">All Classes</option>
                                        {classes.map(cls => (
                                            <option key={cls.id} value={cls.id}>{cls.name}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Summary */}
                    {attendanceReport && (
                        <div>
                            <div className="stats-grid" style={{ marginBottom: "2rem", gridTemplateColumns: "repeat(5, 1fr)" }}>
                                <div className="stat-card">
                                    <div className="stat-content">
                                        <h3>{attendanceReport.summary.total_days}</h3>
                                        <p>Total Days</p>
                                    </div>
                                </div>
                                <div className="stat-card">
                                    <div className="stat-content">
                                        <h3 style={{ color: "#10b981" }}>{attendanceReport.summary.present_days}</h3>
                                        <p>Present</p>
                                    </div>
                                </div>
                                <div className="stat-card">
                                    <div className="stat-content">
                                        <h3 style={{ color: "#ef4444" }}>{attendanceReport.summary.absent_days}</h3>
                                        <p>Absent</p>
                                    </div>
                                </div>
                                <div className="stat-card">
                                    <div className="stat-content">
                                        <h3 style={{ color: "#f59e0b" }}>{attendanceReport.summary.late_days}</h3>
                                        <p>Late</p>
                                    </div>
                                </div>
                                <div className="stat-card">
                                    <div className="stat-content">
                                        <h3>{attendanceReport.summary.percentage}%</h3>
                                        <p>Percentage</p>
                                    </div>
                                </div>
                            </div>

                            {/* Records Table */}
                            <div className="card">
                                <div className="card-header">
                                    <h3 className="card-title">Attendance Records ({attendanceReport.records.length})</h3>
                                </div>
                                <div className="table-container">
                                    <table className="table">
                                        <thead>
                                            <tr>
                                                <th>Date</th>
                                                <th>Student</th>
                                                <th>Class</th>
                                                <th>Status</th>
                                                <th>Remarks</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {attendanceReport.records.length === 0 ? (
                                                <tr>
                                                    <td colSpan="5" style={{ textAlign: "center", padding: "2rem" }}>
                                                        No records found for selected filters
                                                    </td>
                                                </tr>
                                            ) : (
                                                attendanceReport.records.slice(0, 50).map((record, index) => (
                                                    <tr key={index}>
                                                        <td>{new Date(record.date).toLocaleDateString()}</td>
                                                        <td>
                                                            <strong>{record.Student?.User?.name}</strong>
                                                            <br />
                                                            <small>Roll: {record.Student?.roll_number}</small>
                                                        </td>
                                                        <td>{record.Class?.name}</td>
                                                        <td>
                                                            <span className={`badge ${record.status === 'present' ? 'badge-success' :
                                                                record.status === 'absent' ? 'badge-danger' : 'badge-warning'
                                                                }`}>
                                                                {record.status}
                                                            </span>
                                                        </td>
                                                        <td>{record.remarks || '-'}</td>
                                                    </tr>
                                                ))
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* Fees Report Tab */}
            {activeTab === "fees" && (
                <div>
                    {/* Filters */}
                    <div className="card" style={{ marginBottom: "2rem" }}>
                        <div style={{ padding: "1.5rem" }}>
                            <h3 style={{ marginBottom: "1rem" }}>Filters</h3>
                            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "1rem" }}>
                                <div className="form-group">
                                    <label className="form-label">Start Date</label>
                                    <input
                                        type="date"
                                        className="form-input"
                                        value={filters.start_date}
                                        onChange={(e) => handleFilterChange('start_date', e.target.value)}
                                    />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">End Date</label>
                                    <input
                                        type="date"
                                        className="form-input"
                                        value={filters.end_date}
                                        onChange={(e) => handleFilterChange('end_date', e.target.value)}
                                    />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Class</label>
                                    <select
                                        className="form-select"
                                        value={filters.class_id}
                                        onChange={(e) => handleFilterChange('class_id', e.target.value)}
                                    >
                                        <option value="">All Classes</option>
                                        {classes.map(cls => (
                                            <option key={cls.id} value={cls.id}>{cls.name}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Summary */}
                    {feesReport && (
                        <div>
                            <div className="stats-grid" style={{ marginBottom: "2rem" }}>
                                <div className="stat-card">
                                    <div className="stat-icon">💰</div>
                                    <div className="stat-content">
                                        <h3>₹{parseFloat(feesReport.summary.total_collected).toLocaleString()}</h3>
                                        <p>Total Collected</p>
                                    </div>
                                </div>
                                <div className="stat-card">
                                    <div className="stat-icon">📝</div>
                                    <div className="stat-content">
                                        <h3>{feesReport.summary.total_payments}</h3>
                                        <p>Total Payments</p>
                                    </div>
                                </div>
                                <div className="stat-card">
                                    <div className="stat-icon">✅</div>
                                    <div className="stat-content">
                                        <h3>{feesReport.summary.students_paid}</h3>
                                        <p>Students Paid</p>
                                    </div>
                                </div>
                                <div className="stat-card">
                                    <div className="stat-icon">⏳</div>
                                    <div className="stat-content">
                                        <h3>{feesReport.summary.students_pending}</h3>
                                        <p>Pending Students</p>
                                    </div>
                                </div>
                            </div>

                            {/* Payments Table */}
                            <div className="card">
                                <div className="card-header">
                                    <h3 className="card-title">Payment Records</h3>
                                </div>
                                <div className="table-container">
                                    <table className="table">
                                        <thead>
                                            <tr>
                                                <th>Date</th>
                                                <th>Student</th>
                                                <th>Amount</th>
                                                <th>Method</th>
                                                <th>Status</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {feesReport.payments.length === 0 ? (
                                                <tr>
                                                    <td colSpan="5" style={{ textAlign: "center", padding: "2rem" }}>
                                                        No payments found for selected filters
                                                    </td>
                                                </tr>
                                            ) : (
                                                feesReport.payments.slice(0, 50).map((payment, index) => (
                                                    <tr key={index}>
                                                        <td>{new Date(payment.payment_date).toLocaleDateString()}</td>
                                                        <td>
                                                            <strong>{payment.Student?.User?.name}</strong>
                                                            <br />
                                                            <small>Roll: {payment.Student?.roll_number}</small>
                                                        </td>
                                                        <td>₹{parseFloat(payment.amount_paid).toLocaleString()}</td>
                                                        <td>{payment.payment_method}</td>
                                                        <td>
                                                            <span className="badge badge-success">Paid</span>
                                                        </td>
                                                    </tr>
                                                ))
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </div>

                            {/* Pending Students Table */}
                            {feesReport.pending_students && feesReport.pending_students.length > 0 && (
                                <div className="card" style={{ marginTop: "2rem" }}>
                                    <div className="card-header">
                                        <h3 className="card-title">Pending Students ({feesReport.pending_students.length})</h3>
                                    </div>
                                    <div className="table-container">
                                        <table className="table">
                                            <thead>
                                                <tr>
                                                    <th>Roll Number</th>
                                                    <th>Student Name</th>
                                                    <th>Status</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {feesReport.pending_students.map((student, index) => (
                                                    <tr key={index}>
                                                        <td>{student.roll_number}</td>
                                                        <td><strong>{student.name}</strong></td>
                                                        <td>
                                                            <span className="badge badge-danger">Pending</span>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            )}

            {/* Monthly Trends Tab */}
            {activeTab === "trends" && monthlyTrends && (
                <div>
                    <div className="card">
                        <div className="card-header">
                            <h3 className="card-title">6-Month Trends</h3>
                        </div>
                        <div className="table-container">
                            <table className="table">
                                <thead>
                                    <tr>
                                        <th>Month</th>
                                        <th>Attendance %</th>
                                        <th>Fees Collected</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {monthlyTrends.map((trend, index) => (
                                        <tr key={index}>
                                            <td><strong>{trend.month}</strong></td>
                                            <td>
                                                <span className={`badge ${trend.attendance_percentage >= 75 ? 'badge-success' : 'badge-warning'}`}>
                                                    {trend.attendance_percentage}%
                                                </span>
                                            </td>
                                            <td>₹{trend.fees_collected.toLocaleString()}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            )}

            {loading && (
                <div style={{ textAlign: "center", padding: "2rem" }}>
                    <div className="loading-spinner">Loading...</div>
                </div>
            )}
        </div>
    );
}

export default Reports;
