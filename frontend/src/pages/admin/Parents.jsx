import { useState, useEffect, useContext } from "react";
import ThemeSelector from "../../components/ThemeSelector";
import { Link } from "react-router-dom";
import api from "../../services/api";
import { AuthContext } from "../../context/AuthContext";
import "./Dashboard.css";
import BulkImportButton from "../../components/BulkImportButton";
import CredentialRow from "../../components/common/CredentialRow";

function Parents() {
    const { user } = useContext(AuthContext);
    const [parents, setParents] = useState([]);
    const [students, setStudents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editMode, setEditMode] = useState(false);
    const [search, setSearch] = useState("");
    const [saving, setSaving] = useState(false);

    // Bulk selection and credentials state
    const [selectedParents, setSelectedParents] = useState([]);
    const [showCredentialsModal, setShowCredentialsModal] = useState(false);
    const [credentialsData, setCredentialsData] = useState([]);
    const [loadingCredentials, setLoadingCredentials] = useState(false);

    const [formData, setFormData] = useState({
        id: null,
        name: "",
        email: "",
        phone: "",
        password: "",
        status: "active",
        student_ids: [],
        relationships: []
    });

    useEffect(() => {
        fetchParents();
        fetchStudents();
    }, []);

    useEffect(() => {
        if (!loading) {
            fetchParents();
        }
    }, [search]);

    const fetchParents = async () => {
        try {
            const res = await api.get(`/parents${search ? `?search=${encodeURIComponent(search)}` : ""}`);
            setParents(res.data.data || []);
        } catch (error) {
            console.error("Error fetching parents:", error);
        } finally {
            setLoading(false);
        }
    };

    const fetchStudents = async () => {
        try {
            const response = await api.get("/students/lookup?limit=200");
            setStudents(response.data.data || []);
        } catch (error) {
            console.error("Error fetching students:", error);
        }
    };

    const handleSelectAll = (e) => {
        if (e.target.checked) setSelectedParents(parents.map(p => p.id));
        else setSelectedParents([]);
    };

    const handleSelectRow = (id) => {
        setSelectedParents(prev => prev.includes(id) ? prev.filter(pid => pid !== id) : [...prev, id]);
    };

    const handleViewCredentials = async () => {
        if (selectedParents.length === 0) return;
        setLoadingCredentials(true);
        try {
            const res = await api.post('/parents/credentials', { parent_ids: selectedParents });
            if (res.data.success) {
                setCredentialsData(res.data.data);
                setShowCredentialsModal(true);
            }
        } catch (err) {
            console.error('Error fetching credentials:', err);
            alert('Failed to fetch credentials');
        } finally {
            setLoadingCredentials(false);
        }
    };

    const handleViewSingleCredentials = async (parentId) => {
        setLoadingCredentials(true);
        try {
            const res = await api.post('/parents/credentials', { parent_ids: [parentId] });
            if (res.data.success) {
                setCredentialsData(res.data.data);
                setShowCredentialsModal(true);
            }
        } catch (err) {
            console.error('Error fetching credentials:', err);
            alert('Failed to fetch credentials');
        } finally {
            setLoadingCredentials(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSaving(true);
        try {
            if (editMode) {
                await api.put(`/parents/${formData.id}`, formData);
                alert("Parent updated successfully");
            } else {
                const res = await api.post("/parents", formData);
                if (res.data.showPasswordOnScreen) {
                    setCredentialsData([{
                        id: res.data.data.id,
                        identifier: res.data.data.phone || 'Parent',
                        name: res.data.data.name,
                        email: res.data.data.email || 'N/A',
                        password: res.data.initial_password
                    }]);
                    setShowCredentialsModal(true);
                } else {
                    alert("Parent added successfully");
                }
            }
            setShowModal(false);
            resetForm();
            fetchParents();
        } catch (error) {
            alert(error.response?.data?.message || "Something went wrong");
        } finally {
            setSaving(false);
        }
    };

    const handleEdit = async (parent) => {
        // Load full parent data including linked students
        try {
            const res = await api.get(`/parents/${parent.id}`);
            const p = res.data.data;
            setFormData({
                id: p.id,
                name: p.name,
                email: p.email,
                phone: p.phone || "",
                password: "",
                status: p.status,
                student_ids: (p.LinkedStudents || []).map(s => String(s.id)),
                relationships: []
            });
            setEditMode(true);
            setShowModal(true);
        } catch (err) {
            alert("Failed to load parent details");
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm("Are you sure you want to delete this parent? This cannot be undone.")) return;
        try {
            await api.delete(`/parents/${id}`);
            alert("Parent deleted successfully");
            fetchParents();
        } catch (error) {
            alert(error.response?.data?.message || "Error deleting parent");
        }
    };

    const resetForm = () => {
        setFormData({
            id: null,
            name: "",
            email: "",
            phone: "",
            password: "",
            status: "active",
            student_ids: [],
            relationships: []
        });
        setEditMode(false);
    };

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleStudentChange = (e) => {
        const options = e.target.options;
        const selected = [];
        for (let i = 0; i < options.length; i++) {
            if (options[i].selected) selected.push(options[i].value);
        }
        setFormData({ ...formData, student_ids: selected });
    };

    const handleBulkSuccess = (result) => {
        // Re-fetch the parent list to show newly imported parents
        fetchParents();
        alert(`âœ… ${result.inserted} parent(s) imported and linked to students successfully!${result.failed > 0 ? ` (${result.failed} rows had errors)` : ''}`);
    };

    if (loading) {
        return <div className="dashboard-container">Loading...</div>;
    }

    return (
        <div className="dashboard-container">
            <div className="dashboard-header">
                <div>
                    <h1 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <span style={{ fontSize: '2rem', lineHeight: 1 }}>👨‍👩‍👧</span>
                        Parent Management
                    </h1>
                    <p>Manage parents and link them to students</p>
                </div>
                <div className="dashboard-header-right">
                    <ThemeSelector />
                    <Link to="/admin/dashboard" className="btn btn-secondary">← Back</Link>
                    <BulkImportButton type="parents" onSuccess={handleBulkSuccess} />
                    <button
                        onClick={() => { resetForm(); setShowModal(true); }}
                        className="btn btn-primary"
                    >
                        + Add Parent
                    </button>
                </div>
            </div>

            {/* Filters */}
            <div className="card" style={{ marginBottom: "2rem" }}>
                <div style={{ padding: "1.5rem", display: "flex", gap: "1rem", flexWrap: "wrap" }}>
                    <input
                        type="text"
                        className="form-input"
                        placeholder="Search by name, email, or phone..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        style={{ flex: "1", minWidth: "250px" }}
                    />
                </div>
            </div>

            {/* Stats */}
            <div className="stats-grid" style={{ marginBottom: "2rem" }}>
                <div className="stat-card">
                    <div className="stat-icon">👨‍👩‍👧</div>
                    <div className="stat-content">
                        <h3>{parents.length}</h3>
                        <p>Total Parents</p>
                    </div>
                </div>
                <div className="stat-card">
                    <div className="stat-icon">🔗</div>
                    <div className="stat-content">
                        <h3>{parents.reduce((sum, p) => sum + (p.LinkedStudents?.length || 0), 0)}</h3>
                        <p>Linked Students</p>
                    </div>
                </div>
            </div>

            {/* Parents Table */}
            <div className="card">
                <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
                    <h3 className="card-title" style={{ margin: 0 }}>All Parents ({parents.length})</h3>
                    {selectedParents.length > 0 && (
                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                            <button 
                                className="btn btn-sm" 
                                style={{ background: 'linear-gradient(135deg, #6366f1, #4f46e5)', color: 'white', fontWeight: 600, border: 'none', borderRadius: '6px', display: 'flex', alignItems: 'center', gap: '0.4rem' }}
                                onClick={handleViewCredentials}
                                disabled={loadingCredentials}
                            >
                                {loadingCredentials ? '⏳ Loading...' : `🔑 View ${selectedParents.length} Credentials`}
                            </button>
                        </div>
                    )}
                </div>
                <div className="table-container">
                    <table className="table">
                        <thead>
                            <tr>
                                <th style={{ width: '40px' }}>
                                    <input 
                                        type="checkbox" 
                                        checked={selectedParents.length === parents.length && parents.length > 0} 
                                        onChange={handleSelectAll} 
                                        style={{ cursor: 'pointer', width: '16px', height: '16px' }}
                                    />
                                </th>
                                <th>Name</th>
                                <th>Email</th>
                                <th>Phone</th>
                                <th>Linked Students</th>
                                <th>Status</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {parents.length === 0 ? (
                                <tr>
                                    <td colSpan="7" style={{ textAlign: "center", padding: "2rem" }}>
                                        No parents found. Click "+ Add Parent" to create one.
                                    </td>
                                </tr>
                            ) : (
                                parents.map((parent, idx) => (
                                    <tr key={parent.id}>
                                        <td>
                                            <input 
                                                type="checkbox" 
                                                checked={selectedParents.includes(parent.id)} 
                                                onChange={() => handleSelectRow(parent.id)}
                                                style={{ cursor: 'pointer', width: '16px', height: '16px' }}
                                            />
                                        </td>
                                        <td><strong>{parent.name}</strong></td>
                                        <td>{parent.email}</td>
                                        <td>{parent.phone}</td>
                                        <td>
                                            {parent.LinkedStudents && parent.LinkedStudents.length > 0 ? (
                                                <ul style={{ margin: 0, paddingLeft: "20px" }}>
                                                    {parent.LinkedStudents.map(s => (
                                                        <li key={s.id}>{s.User?.name} ({s.roll_number})</li>
                                                    ))}
                                                </ul>
                                            ) : (
                                                <span className="badge badge-secondary">None</span>
                                            )}
                                        </td>
                                        <td>
                                            <span className={`badge badge-${parent.status === "active" ? "success" : "danger"}`}>
                                                {parent.status}
                                            </span>
                                        </td>
                                        <td>
                                            <div style={{ display: "flex", gap: "0.5rem" }}>
                                                <button
                                                    className="btn btn-sm"
                                                    style={{ background: '#f3f4f6', color: '#4b5563', border: '1px solid #d1d5db', borderRadius: '6px', fontWeight: 600 }}
                                                    onClick={() => handleViewSingleCredentials(parent.id)}
                                                >
                                                    🔑 Keys
                                                </button>
                                                <button
                                                    className="btn btn-sm btn-primary"
                                                    onClick={() => handleEdit(parent)}
                                                >
                                                    Edit
                                                </button>
                                                <button
                                                    className="btn btn-sm btn-danger"
                                                    onClick={() => handleDelete(parent.id)}
                                                >
                                                    Delete
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Add/Edit Parent Modal */}
            {showModal && (
                <div className="modal-overlay" onClick={() => setShowModal(false)}>
                    <div className="modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: "700px" }}>
                        <div className="modal-header">
                            <h3>{editMode ? "Edit Parent" : "Add New Parent"}</h3>
                            <button onClick={() => setShowModal(false)} className="btn btn-sm">×</button>
                        </div>
                        <div className="modal-body">
                            <form onSubmit={handleSubmit}>
                                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                                    <div className="form-group">
                                        <label className="form-label">Full Name *</label>
                                        <input
                                            type="text"
                                            name="name"
                                            className="form-input"
                                            value={formData.name}
                                            onChange={handleChange}
                                            required
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label">Email *</label>
                                        <input
                                            type="email"
                                            name="email"
                                            className="form-input"
                                            value={formData.email}
                                            onChange={handleChange}
                                            required
                                        />
                                    </div>
                                </div>

                                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                                    <div className="form-group">
                                        <label className="form-label">Phone *</label>
                                        <input
                                            type="tel"
                                            name="phone"
                                            className="form-input"
                                            value={formData.phone}
                                            onChange={handleChange}
                                            required
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label">
                                            Password {editMode ? "(Leave blank to keep current)" : "* (Min 6 chars)"}
                                        </label>
                                        <input
                                            type="password"
                                            name="password"
                                            className="form-input"
                                            value={formData.password}
                                            onChange={handleChange}
                                            required={!editMode}
                                            minLength={editMode ? 0 : 6}
                                        />
                                    </div>
                                </div>

                                {editMode && (
                                    <div className="form-group" style={{ gridColumn: "1 / -1", marginTop: "1rem" }}>
                                        <label className="form-label" style={{ fontWeight: '700' }}>Account Status</label>
                                        <div style={{ display: 'flex', gap: '0.75rem', marginTop: "0.5rem", flexWrap: "wrap" }}>
                                            {['active', 'blocked'].map(s => (
                                                <label key={s} style={{
                                                    display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer',
                                                    padding: '0.5rem 1.2rem', borderRadius: '8px',
                                                    border: `1.5px solid ${formData.status === s ? (s === 'active' ? '#10b981' : '#ef4444') : 'var(--border-color)'}`,
                                                    background: formData.status === s ? (s === 'active' ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)') : 'transparent',
                                                    fontWeight: '600',
                                                    color: formData.status === s ? (s === 'active' ? '#10b981' : '#ef4444') : 'var(--text-secondary)'
                                                }}>
                                                    <input 
                                                        type="radio" 
                                                        name="status" 
                                                        value={s} 
                                                        checked={formData.status === s} 
                                                        onChange={handleChange} 
                                                        style={{ accentColor: s === 'active' ? '#10b981' : '#ef4444' }} 
                                                    />
                                                    {s === 'active' ? '● Active' : '🚫 Blocked'}
                                                </label>
                                            ))}
                                        </div>
                                        {formData.status === 'blocked' && (
                                            <div style={{ marginTop: '0.6rem', padding: '0.6rem 0.9rem', borderRadius: '8px', background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.3)', fontSize: '0.83rem', color: '#ef4444' }}>
                                                ⚠️ Blocked parent will not be able to access the parent dashboard or view student records.
                                            </div>
                                        )}
                                    </div>
                                )}

                                <div className="form-group" style={{ marginTop: "1rem" }}>
                                    <label className="form-label">Link Students (Ctrl/Cmd to select multiple)</label>
                                    <select
                                        name="student_ids"
                                        className="form-select"
                                        multiple
                                        value={formData.student_ids}
                                        onChange={handleStudentChange}
                                        style={{ height: "150px" }}
                                    >
                                        {students.map((s) => (
                                            <option key={s.id} value={String(s.id)}>
                                                {s.User?.name} (Roll: {s.roll_number})
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div className="modal-footer">
                                    <button type="button" onClick={() => setShowModal(false)} className="btn btn-secondary">
                                        Cancel
                                    </button>
                                    <button type="submit" className="btn btn-primary" disabled={saving}>
                                        {saving ? "Saving..." : editMode ? "Update Parent" : "Add Parent"}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}

            {/* Credentials Modal */}
            {showCredentialsModal && (
                <div className="modal-overlay" onClick={() => setShowCredentialsModal(false)} style={{ zIndex: 9999 }}>
                    <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: '800px', width: '95%' }}>
                        <div className="modal-header" style={{ background: 'linear-gradient(135deg, #4f46e5, #6366f1)', color: 'white', padding: '1.25rem 1.5rem', borderRadius: '12px 12px 0 0' }}>
                            <div>
                                <h3 style={{ margin: 0, color: 'white', display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                                    <span style={{ fontSize: '1.4rem' }}>🔑</span>
                                    Parent Credentials
                                </h3>
                                <p style={{ margin: '0.2rem 0 0 0', opacity: 0.9, fontSize: '0.85rem' }}>
                                    Manage initial passwords for parents
                                </p>
                            </div>
                            <button onClick={() => setShowCredentialsModal(false)} className="btn btn-sm" style={{ background: 'rgba(255,255,255,0.2)', color: 'white', border: 'none' }}>×</button>
                        </div>
                        
                        <div className="modal-body" style={{ padding: '1.5rem', maxHeight: '60vh', overflowY: 'auto' }}>
                            <div style={{ overflowX: 'auto', borderRadius: '8px', border: '1px solid var(--border-color, #e5e7eb)' }}>
                                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
                                    <thead style={{ background: '#f8fafc', borderBottom: '2px solid #e2e8f0', textAlign: 'left' }}>
                                        <tr>
                                            <th style={{ padding: '0.8rem 1rem', color: '#475569', fontWeight: 600 }}>Phone</th>
                                            <th style={{ padding: '0.8rem 1rem', color: '#475569', fontWeight: 600 }}>Name</th>
                                            <th style={{ padding: '0.8rem 1rem', color: '#475569', fontWeight: 600 }}>Email</th>
                                            <th style={{ padding: '0.8rem 1rem', color: '#475569', fontWeight: 600 }}>Password</th>
                                            <th style={{ padding: '0.8rem 1rem', color: '#475569', fontWeight: 600 }}>Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {credentialsData.length === 0 ? (
                                            <tr>
                                                <td colSpan="5" style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-secondary, #6b7280)' }}>
                                                    No credentials to display
                                                </td>
                                            </tr>
                                        ) : (
                                            credentialsData.map((c, idx) => (
                                                <CredentialRow
                                                    key={c.id}
                                                    credential={c}
                                                    identifier={c.identifier}
                                                    isEven={idx % 2 === 0}
                                                    onReset={async (parentId) => {
                                                        try {
                                                            const res = await api.post(`/parents/${parentId}/resend-credentials`);
                                                            if (res.data.success && res.data.initial_password) {
                                                                setCredentialsData(prev => prev.map(x =>
                                                                    x.id === parentId
                                                                        ? { ...x, password: res.data.initial_password, status: 'generated' }
                                                                        : x
                                                                ));
                                                            } else {
                                                                alert('Password reset successfully!');
                                                            }
                                                        } catch (err) {
                                                            const msg = err.response?.data?.message || 'Failed to reset password';
                                                            alert(msg);
                                                        }
                                                    }}
                                                />
                                            ))
                                        )}
                                    </tbody>
                                </table>
                            </div>

                            <div style={{ marginTop: '1.25rem', padding: '1rem 1.25rem', background: 'linear-gradient(135deg, #fef9c3, #fef3c7)', borderRadius: '10px', border: '1px solid #fcd34d', color: '#92400e', fontSize: '0.84rem', lineHeight: '1.5', display: 'flex', gap: '0.6rem', alignItems: 'flex-start' }}>
                                <span style={{ fontSize: '1rem', flexShrink: 0 }}>💡</span>
                                <span>
                                    <strong>Security Note:</strong> Initial passwords are visible only until the parent logs in and changes their password.
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default Parents;
