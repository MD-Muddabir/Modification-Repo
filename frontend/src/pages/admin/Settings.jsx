/**
 * Settings Page
 * Manage institute details and user security
 */

import { useState, useEffect, useContext } from "react";
import { Link } from "react-router-dom";
import api from "../../services/api";
import { AuthContext } from "../../context/AuthContext";
import ThemeSelector from "../../components/ThemeSelector";
import "./Dashboard.css";

function Settings() {
    const { user } = useContext(AuthContext);
    const [activeTab, setActiveTab] = useState("institute"); // 'institute' or 'security'
    const [loading, setLoading] = useState(false);

    // Institute Details State
    const [institute, setInstitute] = useState({
        name: "",
        email: "",
        phone: "",
        address: "",
        logo: ""
    });

    const [logoFile, setLogoFile] = useState(null);
    const [logoPreview, setLogoPreview] = useState(null);

    // Password Change State
    const [passwords, setPasswords] = useState({
        oldPassword: "",
        newPassword: "",
        confirmPassword: ""
    });

    useEffect(() => {
        if (user && user.institute_id) {
            fetchInstituteDetails();
        }
    }, [user]);

    const fetchInstituteDetails = async () => {
        try {
            setLoading(true);
            const res = await api.get(`/institutes/${user.institute_id}`);
            setInstitute(res.data.data);
            if (res.data.data.logo) {
                let logoPath = res.data.data.logo;
                if (logoPath.startsWith('/')) {
                    const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:5000/api";
                    const backendBase = apiUrl.replace(/\/api\/?$/, ""); 
                    logoPath = `${backendBase}${logoPath}`;
                }
                setLogoPreview(logoPath);
            }
        } catch (error) {
            console.error("Error fetching institute details", error);
        } finally {
            setLoading(false);
        }
    };

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setLogoFile(file);
            const previewUrl = URL.createObjectURL(file);
            setLogoPreview(previewUrl);
        }
    };

    const handleInstituteUpdate = async (e) => {
        e.preventDefault();
        try {
            const formData = new FormData();
            formData.append("name", institute.name);
            formData.append("email", institute.email);
            formData.append("phone", institute.phone || "");
            formData.append("address", institute.address || "");
            if (logoFile) {
                formData.append("logo", logoFile);
            }

            await api.put(`/institutes/${user.institute_id}`, formData, {
                headers: { "Content-Type": "multipart/form-data" }
            });
            alert("Institute details updated successfully");
            
            // Force reload to sync global AuthContext (e.g., Navbar Logo)
            window.location.reload();
        } catch (error) {
            alert(error.response?.data?.message || "Error updating settings");
        }
    };

    const handlePasswordChange = async (e) => {
        e.preventDefault();
        if (passwords.newPassword !== passwords.confirmPassword) {
            alert("New passwords do not match");
            return;
        }
        try {
            await api.post("/auth/change-password", {
                oldPassword: passwords.oldPassword,
                newPassword: passwords.newPassword
            });
            alert("Password changed successfully");
            setPasswords({ oldPassword: "", newPassword: "", confirmPassword: "" });
        } catch (error) {
            alert(error.response?.data?.message || "Error changing password");
        }
    };

    return (
        <div className="dashboard-container">
            <div className="dashboard-header">
                <div>
                    <h1>⚙️ Settings</h1>
                </div>
                <div className="dashboard-header-right">
                    <ThemeSelector />
                    <Link to="/admin/dashboard" className="animated-btn secondary" style={{ textDecoration: 'none' }}>
                        <span className="icon icon-back">←</span> Back to Dashboard
                    </Link>
                </div>
            </div>

            <div className="tabs" style={{ marginBottom: "20px", borderBottom: "1px solid #ddd" }}>
                <button
                    className={`tab-btn ${activeTab === "institute" ? "active" : ""}`}
                    onClick={() => setActiveTab("institute")}
                    style={{
                        padding: "10px 20px",
                        border: "none",
                        background: "none",
                        borderBottom: activeTab === "institute" ? "2px solid #6366f1" : "none",
                        fontWeight: activeTab === "institute" ? "bold" : "normal",
                        cursor: "pointer"
                    }}
                >
                    Institute Details
                </button>
                <button
                    className={`tab-btn ${activeTab === "security" ? "active" : ""}`}
                    onClick={() => setActiveTab("security")}
                    style={{
                        padding: "10px 20px",
                        border: "none",
                        background: "none",
                        borderBottom: activeTab === "security" ? "2px solid #6366f1" : "none",
                        fontWeight: activeTab === "security" ? "bold" : "normal",
                        cursor: "pointer"
                    }}
                >
                    Security
                </button>
            </div>

            <div className="card" style={{ maxWidth: "800px" }}>
                <div style={{ padding: "1.5rem" }}>
                    {activeTab === "institute" ? (
                        <form onSubmit={handleInstituteUpdate}>
                            <h3 style={{ marginBottom: "1rem" }}>Institute Information</h3>
                            
                            <div className="form-group" style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', marginBottom: '20px' }}>
                                <label className="form-label">Institute Logo</label>
                                <div style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
                                    <div style={{ 
                                        width: '80px', height: '80px', borderRadius: '8px', 
                                        border: '1px solid #e5e7eb', display: 'flex', 
                                        alignItems: 'center', justifyContent: 'center',
                                        overflow: 'hidden', backgroundColor: '#f9fafb'
                                    }}>
                                        {logoPreview ? (
                                            <img src={logoPreview} alt="Logo Preview" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                                        ) : (
                                            <span style={{ fontSize: '2rem', color: '#9ca3af' }}>🏢</span>
                                        )}
                                    </div>
                                    <div>
                                        <input 
                                            type="file" 
                                            accept="image/*" 
                                            onChange={handleFileChange}
                                            style={{ display: 'block', padding: '8px', border: '1px solid #e5e7eb', borderRadius: '6px' }}
                                        />
                                        <small style={{ color: "#6b7280", display: 'block', marginTop: '5px' }}>
                                            Recommended size: 200x200px (PNG, JPG)
                                        </small>
                                    </div>
                                </div>
                            </div>

                            <div className="form-group">
                                <label className="form-label">Institute Name</label>
                                <input
                                    type="text"
                                    className="form-input"
                                    value={institute.name}
                                    onChange={e => setInstitute({ ...institute, name: e.target.value })}
                                    required
                                />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Email Address</label>
                                <input
                                    type="email"
                                    className="form-input"
                                    value={institute.email}
                                    readOnly
                                    style={{ backgroundColor: "#f3f4f6", cursor: "not-allowed" }}
                                    title="Contact Super Admin to change email"
                                />
                                <small style={{ color: "#6b7280", fontSize: "0.8rem" }}>
                                    Email cannot be changed directly. Contact support for updates.
                                </small>
                            </div>
                            <div className="form-group">
                                <label className="form-label">Phone Number</label>
                                <input
                                    type="tel"
                                    className="form-input"
                                    value={institute.phone || ""}
                                    onChange={e => setInstitute({ ...institute, phone: e.target.value })}
                                    placeholder="+91 9876543210"
                                />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Address</label>
                                <textarea
                                    className="form-input"
                                    rows="3"
                                    value={institute.address || ""}
                                    onChange={e => setInstitute({ ...institute, address: e.target.value })}
                                    placeholder="Full address"
                                ></textarea>
                            </div>
                            <button type="submit" className="btn btn-primary" style={{ marginTop: "1rem" }}>
                                Save Changes
                            </button>
                        </form>
                    ) : (
                        <form onSubmit={handlePasswordChange}>
                            <h3 style={{ marginBottom: "1rem" }}>Change Password</h3>
                            <div className="form-group">
                                <label className="form-label">Current Password</label>
                                <input
                                    type="password"
                                    className="form-input"
                                    value={passwords.oldPassword}
                                    onChange={e => setPasswords({ ...passwords, oldPassword: e.target.value })}
                                    required
                                />
                            </div>
                            <div className="form-group">
                                <label className="form-label">New Password</label>
                                <input
                                    type="password"
                                    className="form-input"
                                    value={passwords.newPassword}
                                    onChange={e => setPasswords({ ...passwords, newPassword: e.target.value })}
                                    required
                                    minLength="6"
                                />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Confirm New Password</label>
                                <input
                                    type="password"
                                    className="form-input"
                                    value={passwords.confirmPassword}
                                    onChange={e => setPasswords({ ...passwords, confirmPassword: e.target.value })}
                                    required
                                    minLength="6"
                                />
                            </div>
                            <button type="submit" className="btn btn-danger" style={{ marginTop: "1rem" }}>
                                Update Password
                            </button>
                        </form>
                    )}
                </div>
            </div>
        </div>
    );
}

export default Settings;
