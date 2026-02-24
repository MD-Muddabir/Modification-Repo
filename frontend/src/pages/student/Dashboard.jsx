import { useContext } from "react";
import { Link, useNavigate } from "react-router-dom";
import { AuthContext } from "../../context/AuthContext";
import "../admin/Dashboard.css";

function StudentDashboard() {
    const { user, logout } = useContext(AuthContext);
    const navigate = useNavigate();

    const ActionCard = ({ icon, title, path }) => (
        <div onClick={() => navigate(path)} className="action-card" style={{ cursor: 'pointer' }}>
            <span className="action-icon">{icon}</span>
            <span className="action-title">{title}</span>
        </div>
    );

    return (
        <div className="dashboard-container">
            <div className="dashboard-header">
                <div>
                    <h1>Student Dashboard</h1>
                    <p>Welcome back, {user?.name || "Student"}! Stay productive.</p>
                </div>
                <button onClick={logout} className="btn btn-danger">
                    Logout
                </button>
            </div>

            <div className="quick-actions">
                <h2>Quick Actions</h2>
                <div className="action-grid">
                    <ActionCard path="/student/attendance" icon="📋" title="View Attendance" />
                    <ActionCard path="/student/marks" icon="📝" title="View Marks" />
                    <ActionCard path="/student/pay-fees" icon="💳" title="Pay Fees" />
                    <ActionCard path="/student/announcements" icon="📢" title="Announcements" />
                    <ActionCard path="/student/profile" icon="👤" title="My Profile" />
                </div>
            </div>

            <div className="card" style={{ marginTop: '20px' }}>
                <div className="card-header">
                    <h3>Recent Announcements</h3>
                </div>
                <div style={{ padding: '20px' }}>
                    <p>Keep track of important updates from your institute.</p>
                </div>
            </div>
        </div>
    );
}

export default StudentDashboard;
