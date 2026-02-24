import { useContext } from "react";
import { Link, useNavigate } from "react-router-dom";
import { AuthContext } from "../../context/AuthContext";
import "../admin/Dashboard.css";

function FacultyDashboard() {
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
                    <h1>Faculty Dashboard</h1>
                    <p>Welcome back, {user?.name || "Professor"}! Have a great day.</p>
                </div>
                <button onClick={logout} className="btn btn-danger">
                    Logout
                </button>
            </div>

            <div className="quick-actions">
                <h2>Quick Actions</h2>
                <div className="action-grid">
                    <ActionCard path="/faculty/students" icon="👨‍🎓" title="View Students" />
                    <ActionCard path="/faculty/attendance" icon="📋" title="Mark Attendance" />
                    <ActionCard path="/faculty/marks" icon="📝" title="Enter Marks" />
                    <ActionCard path="/faculty/profile" icon="👤" title="My Profile" />
                </div>
            </div>

            <div className="card" style={{ marginTop: '20px' }}>
                <div className="card-header">
                    <h3>Recent Announcements</h3>
                </div>
                <div style={{ padding: '20px' }}>
                    <p>Check the global announcements from your Institute Admin.</p>
                </div>
            </div>
        </div>
    );
}

export default FacultyDashboard;
