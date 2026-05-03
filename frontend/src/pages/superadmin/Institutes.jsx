/**
 * Super Admin - Institutes Management
 * Complete CRUD for managing all institutes
 */

import { useState, useEffect } from "react";
import api from "../../services/api";
import BackButton from "../../components/common/BackButton";
import ThemeSelector from "../../components/ThemeSelector";
import DeleteInstituteModal from "../../components/superadmin/DeleteInstituteModal";
import SuspendInstituteModal from "../../components/superadmin/SuspendInstituteModal";
import "../admin/Dashboard.css";

function Institutes() {
    const [institutes, setInstitutes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [statusFilter, setStatusFilter] = useState("all");
    const [lifetimeFilter, setLifetimeFilter] = useState("all");
    const [showModal, setShowModal] = useState(false);
    const [selectedInstitute, setSelectedInstitute] = useState(null);

    // Modal States
    const [deleteModal, setDeleteModal] = useState(null);
    const [suspendModal, setSuspendModal] = useState(null);
    const [actionLoading, setActionLoading] = useState(false);

    useEffect(() => {
        fetchInstitutes();
    }, [statusFilter]);

    const fetchInstitutes = async () => {
        try {
            let url = "/institutes?limit=100";
            if (statusFilter !== "all") {
                url += `&status=${statusFilter}`;
            }
            const response = await api.get(url);
            setInstitutes(response.data.data?.institutes || []);
        } catch (error) {
            console.error("Error fetching institutes:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteConfirm = async (force) => {
        setActionLoading(true);
        try {
            const res = await api.delete(`/superadmin/institutes/${deleteModal.id}`, {
                data: { force } // axios requires data property for DELETE body
            });
            if (res.data.success) {
                const { students_deleted, faculty_deleted, classes_deleted } = res.data.data || {};
                const summary = [
                    students_deleted != null ? `${students_deleted} students` : null,
                    faculty_deleted != null ? `${faculty_deleted} faculty` : null,
                    classes_deleted != null ? `${classes_deleted} classes` : null,
                ].filter(Boolean).join(', ');
                alert(`✅ ${res.data.message}${summary ? `\n\nDeleted: ${summary}` : ''}`);
                setDeleteModal(null);
                fetchInstitutes();
            }
        } catch (err) {
            const errData = err.response?.data;
            if (err.response?.status === 409) {
                // Active subscription guard triggered — user needs to use Force Delete
                alert(`⚠️ ${errData?.message || 'This institute has an active subscription.'}\n\nTo proceed, check "Force Delete" in the confirmation dialog.`);
            } else {
                alert(`❌ Delete failed: ${errData?.message || err.message || 'Unknown error'}`);
            }
        } finally {
            setActionLoading(false);
        }
    };

    const handleSuspendConfirm = async (reason) => {
        setActionLoading(true);
        const isSuspended = suspendModal.status === 'suspended';
        const endpoint = isSuspended
            ? `/superadmin/institutes/${suspendModal.id}/restore`
            : `/superadmin/institutes/${suspendModal.id}/suspend`;

        try {
            const res = await api.put(endpoint, { reason });
            if (res.data.success) {
                alert(res.data.message);
                setSuspendModal(null);
                fetchInstitutes();
            }
        } catch (err) {
            alert(err.response?.data?.message || 'Action failed');
        } finally {
            setActionLoading(false);
        }
    };

    const handleViewDetails = (institute) => {
        setSelectedInstitute(institute);
        setShowModal(true);
    };

    const filteredInstitutes = institutes.filter(inst => {
        const matchSearch =
            (inst.name && inst.name.toLowerCase().includes(search.toLowerCase())) ||
            (inst.email && inst.email.toLowerCase().includes(search.toLowerCase()));
        const matchLifetime =
            lifetimeFilter === "all" ? true :
            lifetimeFilter === "lifetime" ? inst.is_lifetime_member :
            lifetimeFilter === "founding" ? inst.founding_member :
            !inst.is_lifetime_member;
        return matchSearch && matchLifetime;
    });

    if (loading) {
        return <div className="dashboard-container">Loading...</div>;
    }

    return (
        <div className="dashboard-container">
            <div className="dashboard-header">
                <div>
                    <h1>🏢 Institutes Management</h1>
                    <p>Manage all registered institutes</p>
                </div>
                <div className="dashboard-header-right">
                    <ThemeSelector />
                    <BackButton />
                </div>
            </div>

            {/* Filters */}
            <div className="card" style={{ marginBottom: "2rem" }}>
                <div style={{ padding: "1.5rem", display: "flex", gap: "1rem", flexWrap: "wrap" }}>
                    <input
                        type="text"
                        className="form-input"
                        placeholder="Search by name or email..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        style={{ flex: "1", minWidth: "250px" }}
                    />
                    <select
                        className="form-select"
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        style={{ minWidth: "150px" }}
                    >
                        <option value="all">All Status</option>
                        <option value="active">Active</option>
                        <option value="suspended">Suspended</option>
                        <option value="expired">Expired</option>
                    </select>
                    <select
                        className="form-select"
                        value={lifetimeFilter}
                        onChange={(e) => setLifetimeFilter(e.target.value)}
                        style={{ minWidth: "160px" }}
                    >
                        <option value="all">All Members</option>
                        <option value="lifetime">💎 Lifetime Only</option>
                        <option value="founding">🌟 Founding Only</option>
                        <option value="regular">Regular Only</option>
                    </select>
                </div>
            </div>

            {/* Statistics */}
            <div className="stats-grid" style={{ marginBottom: "2rem" }}>
                <div className="stat-card">
                    <div className="stat-icon">🏢</div>
                    <div className="stat-content">
                        <h3>{institutes.length}</h3>
                        <p>Total Institutes</p>
                    </div>
                </div>
                <div className="stat-card">
                    <div className="stat-icon">✅</div>
                    <div className="stat-content">
                        <h3>{institutes.filter(i => i.status === 'active').length}</h3>
                        <p>Active</p>
                    </div>
                </div>
                <div className="stat-card">
                    <div className="stat-icon">⏸️</div>
                    <div className="stat-content">
                        <h3>{institutes.filter(i => i.status === 'suspended').length}</h3>
                        <p>Suspended</p>
                    </div>
                </div>
                <div className="stat-card">
                    <div className="stat-icon">⏰</div>
                    <div className="stat-content">
                        <h3>{institutes.filter(i => i.status === 'expired').length}</h3>
                        <p>Expired</p>
                    </div>
                </div>
                <div className="stat-card" style={{ background: 'linear-gradient(135deg, #7c3aed 0%, #4f46e5 100%)', color: '#fff' }}>
                    <div className="stat-icon">💎</div>
                    <div className="stat-content">
                        <h3>{institutes.filter(i => i.is_lifetime_member).length}</h3>
                        <p>Lifetime Members</p>
                    </div>
                </div>
            </div>

            {/* Institutes Table */}
            <div className="card">
                <div className="card-header">
                    <h3 className="card-title">All Institutes ({filteredInstitutes.length})</h3>
                </div>
                <div className="table-container">
                    <table className="table">
                        <thead>
                            <tr>
                                <th>Name</th>
                                <th>Email</th>
                                <th>Phone</th>
                                <th>Plan</th>
                                <th>Status</th>
                                <th>End Date</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredInstitutes.length === 0 ? (
                                <tr>
                                    <td colSpan="7" style={{ textAlign: "center", padding: "2rem" }}>
                                        No institutes found
                                    </td>
                                </tr>
                            ) : (
                                filteredInstitutes.map((institute) => (
                                    <tr key={institute.id}>
                                        <td>{institute.name}</td>
                                        <td>{institute.email}</td>
                                        <td>{institute.phone || "N/A"}</td>
                                        <td>
                                            {institute.is_lifetime_member ? (
                                                <span style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                                                    <span style={{ background: 'linear-gradient(90deg,#7c3aed,#4f46e5)', color: '#fff', padding: '2px 8px', borderRadius: 12, fontSize: 11, fontWeight: 700 }}>💎 LIFETIME</span>
                                                    {institute.founding_member && <span style={{ background: '#f59e0b', color: '#fff', padding: '2px 8px', borderRadius: 12, fontSize: 10, fontWeight: 700 }}>🌟 FOUNDING</span>}
                                                </span>
                                            ) : institute.Plan?.name || "No Plan"}
                                        </td>
                                        <td>
                                            <span className={`badge badge-${institute.status === 'active' ? 'success' :
                                                institute.status === 'suspended' ? 'warning' : 'danger'
                                                }`}>
                                                {institute.status}
                                            </span>
                                        </td>
                                        <td>
                                            {institute.subscription_end
                                                ? new Date(institute.subscription_end).toLocaleDateString()
                                                : "N/A"}
                                        </td>
                                        <td>
                                            <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
                                                <button
                                                    className="btn btn-sm btn-primary"
                                                    onClick={() => handleViewDetails(institute)}
                                                    style={{ padding: '6px 14px', border: 'none', borderRadius: 6, cursor: 'pointer', fontSize: 13 }}
                                                >
                                                    View
                                                </button>
                                                
                                                <button
                                                    onClick={() => setSuspendModal(institute)}
                                                    style={{
                                                        background: institute.status === 'suspended' ? '#16A34A' : '#D97706',
                                                        color: '#fff', padding: '6px 14px',
                                                        border: 'none', borderRadius: 6, cursor: 'pointer', fontSize: 13
                                                    }}>
                                                    {institute.status === 'suspended' ? 'Restore' : 'Suspend'}
                                                </button>

                                                <button onClick={() => setDeleteModal(institute)}
                                                    style={{
                                                        background: '#DC2626', color: '#fff', padding: '6px 14px',
                                                        border: 'none', borderRadius: 6, cursor: 'pointer', fontSize: 13
                                                    }}>
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

            {/* Institute Details Modal */}
            {showModal && selectedInstitute && (
                <div className="modal-overlay" onClick={() => setShowModal(false)}>
                    <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: "600px", background: "white", padding: "2rem", borderRadius: "12px" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "1.5rem" }}>
                            <h3 style={{ margin: 0, fontSize: "1.5rem" }}>Institute Details</h3>
                            <button onClick={() => setShowModal(false)} style={{ background: "none", border: "none", fontSize: "1.5rem", cursor: "pointer" }}>×</button>
                        </div>
                        <div style={{ display: "grid", gap: "1rem", gridTemplateColumns: "1fr 1fr" }}>
                            <div className="detail-item">
                                <label style={{ fontWeight: "bold", display: "block" }}>ID</label>
                                <span>{selectedInstitute.id}</span>
                            </div>
                            <div className="detail-item">
                                <label style={{ fontWeight: "bold", display: "block" }}>Name</label>
                                <span>{selectedInstitute.name}</span>
                            </div>
                            <div className="detail-item">
                                <label style={{ fontWeight: "bold", display: "block" }}>Email</label>
                                <span>{selectedInstitute.email}</span>
                            </div>
                            <div className="detail-item">
                                <label style={{ fontWeight: "bold", display: "block" }}>Phone</label>
                                <span>{selectedInstitute.phone || "Not provided"}</span>
                            </div>
                            <div className="detail-item" style={{ gridColumn: "1/-1" }}>
                                <label style={{ fontWeight: "bold", display: "block" }}>Address</label>
                                <span>{selectedInstitute.address || "Not provided"}</span>
                            </div>
                            <div className="detail-item">
                                <label style={{ fontWeight: "bold", display: "block" }}>Plan</label>
                                <span>{selectedInstitute.Plan?.name || "No Plan"}</span>
                            </div>
                            <div className="detail-item">
                                <label style={{ fontWeight: "bold", display: "block" }}>Status</label>
                                <span>{selectedInstitute.status}</span>
                            </div>
                            <div className="detail-item">
                                <label style={{ fontWeight: "bold", display: "block" }}>Subscription Start</label>
                                <span>{selectedInstitute.subscription_start ? new Date(selectedInstitute.subscription_start).toLocaleDateString() : "N/A"}</span>
                            </div>
                            <div className="detail-item">
                                <label style={{ fontWeight: "bold", display: "block" }}>Subscription End</label>
                                <span>{selectedInstitute.subscription_end ? new Date(selectedInstitute.subscription_end).toLocaleDateString() : "N/A"}</span>
                            </div>
                        </div>
                        <div style={{ marginTop: "2rem", textAlign: "right" }}>
                            <button onClick={() => setShowModal(false)} className="btn btn-secondary">
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Modals */}
            {deleteModal && (
                <DeleteInstituteModal
                    institute={deleteModal}
                    onConfirm={handleDeleteConfirm}
                    onCancel={() => setDeleteModal(null)}
                    loading={actionLoading}
                />
            )}

            {suspendModal && (
                <SuspendInstituteModal
                    institute={suspendModal}
                    onConfirm={handleSuspendConfirm}
                    onCancel={() => setSuspendModal(null)}
                    loading={actionLoading}
                />
            )}
        </div>
    );
}

export default Institutes;
