/**
 * Faculty Management Page
 * Complete CRUD for faculty management
 */

import { useState, useEffect, useContext } from "react";
import ThemeSelector from "../../components/ThemeSelector";
import { Link } from "react-router-dom";
import api from "../../services/api";
import { AuthContext } from "../../context/AuthContext";
import { QRCodeSVG, QRCodeCanvas } from "qrcode.react";
import QRCode from "qrcode";
import "./Dashboard.css";
import { savePdfNative } from "../../utils/capacitorPermissions";
import BulkImportButton from "../../components/BulkImportButton";
import CredentialRow from "../../components/common/CredentialRow";

function Faculty() {
    const { user } = useContext(AuthContext);
    const [faculty, setFaculty] = useState([]);
    const [totalCount, setTotalCount] = useState(0);
    const [classes, setClasses] = useState([]);
    const [subjects, setSubjects] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editMode, setEditMode] = useState(false);
    const [search, setSearch] = useState("");

    // Bulk selection and QR State
    const [selectedFaculty, setSelectedFaculty] = useState([]);
    const [bulkDownloading, setBulkDownloading] = useState(false);
    const [showQrModal, setShowQrModal] = useState(false);
    const [qrFaculty, setQrFaculty] = useState(null);
    const [qrDownloading, setQrDownloading] = useState(false);
    const [qrLoading, setQrLoading] = useState(false);
    
    // Credentials state
    const [showCredentialsModal, setShowCredentialsModal] = useState(false);
    const [credentialsData, setCredentialsData] = useState([]);
    const [loadingCredentials, setLoadingCredentials] = useState(false);

    const handleSelectAll = (e) => {
        if (e.target.checked) setSelectedFaculty(filteredFaculty.map(f => f.id));
        else setSelectedFaculty([]);
    };

    const handleSelectRow = (id) => {
        setSelectedFaculty(prev => prev.includes(id) ? prev.filter(fid => fid !== id) : [...prev, id]);
    };

    const handleViewQr = async (fm) => {
        setQrLoading(true);
        try {
            const res = await api.get(`/faculty/${fm.id}`);
            setQrFaculty(res.data.data || fm);
        } catch (err) {
            setQrFaculty(fm);
        } finally {
            setQrLoading(false);
            setShowQrModal(true);
        }
    };

    const handleViewCredentials = async () => {
        if (selectedFaculty.length === 0) return;
        setLoadingCredentials(true);
        try {
            const res = await api.post('/faculty/credentials', { faculty_ids: selectedFaculty });
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

    const handleViewSingleCredentials = async (facultyId) => {
        setLoadingCredentials(true);
        try {
            const res = await api.post('/faculty/credentials', { faculty_ids: [facultyId] });
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

    const getBase64ImageFromUrl = async (imageUrl) => {
        try {
            const response = await fetch(imageUrl);
            const blob = await response.blob();
            return new Promise((resolve) => {
                const reader = new FileReader();
                reader.onloadend = () => resolve(reader.result);
                reader.onerror = () => resolve(null);
                reader.readAsDataURL(blob);
            });
        } catch (e) { return null; }
    };

    const generateIdCard = async (doc, fm, logoBase64, instName, instPhone, qrDataUrl) => {
        const designation = fm.designation || 'Faculty';
        const fName = fm.User?.name || '';
        const fEmail = fm.User?.email || '';
        const fPhone = fm.User?.phone || 'N/A';
        const joinDate = fm.join_date ? new Date(fm.join_date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : 'N/A';
        
        let teachingText = 'N/A';
        if (fm.Subjects && fm.Subjects.length > 0) {
            teachingText = fm.Subjects.map(s => s.name).join(', ');
        }

        // ── Faculty Distinct "Emerald Green" Theme ──
        doc.setFillColor(240, 253, 244); // Green-50 background (instead of blue)
        doc.rect(0, 0, 85, 155, 'F');
        doc.setFillColor(6, 78, 59); // Green-900 dark primary
        doc.rect(0, 0, 85, 28, 'F');
        doc.setTextColor(255, 255, 255);
        doc.setFont('helvetica', 'bold');

        if (logoBase64) {
            doc.addImage(logoBase64, 'PNG', 5, 4, 20, 20);
            doc.setFontSize(10);
            doc.text(doc.splitTextToSize(instName.toUpperCase(), 50), 28, 14);
            if (instPhone) {
                doc.setFont('helvetica', 'normal');
                doc.setFontSize(7.5);
                doc.setTextColor(209, 250, 229); // Green-100 highlight text
                doc.text(`Ph: ${instPhone}`, 28, 20);
            }
        } else {
             doc.setFontSize(11);
             const nameY = instPhone ? 12 : 16;
             doc.text(doc.splitTextToSize(instName.toUpperCase(), 72), 42.5, nameY, { align: 'center' });
             if (instPhone) {
                 doc.setFont('helvetica', 'normal');
                 doc.setFontSize(7.5);
                 doc.setTextColor(209, 250, 229);
                 doc.text(`Ph: ${instPhone}`, 42.5, 18, { align: 'center' });
             }
        }

        doc.setDrawColor(6, 78, 59); doc.setLineWidth(0.5); doc.line(6, 30, 79, 30);
        doc.setTextColor(100, 100, 120); doc.setFontSize(6);
        doc.text('QR CODE', 21, 35, { align: 'center' });
        doc.text('PHOTO', 64, 35, { align: 'center' });

        if (qrDataUrl) doc.addImage(qrDataUrl, 'PNG', 5, 37, 33, 33);
        
        doc.setFillColor(209, 250, 229); doc.rect(47, 37, 33, 33, 'F'); // Green-100
        doc.setDrawColor(167, 243, 208); doc.setLineWidth(0.3); doc.rect(47, 37, 33, 33); // Green-200
        doc.setDrawColor(16, 185, 129); doc.setLineWidth(0.2); doc.circle(63.5, 47, 4, 'S'); // Green-500
        doc.line(55, 69, 55, 60); doc.line(55, 60, 72, 60); doc.line(72, 60, 72, 69);
        doc.setTextColor(52, 211, 153); doc.setFontSize(5); doc.text('PHOTO', 63.5, 72, { align: 'center' }); // Green-400

        doc.setDrawColor(167, 243, 208); doc.setLineWidth(0.3); doc.line(6, 74, 79, 74); // Green-200

        const infoStartY = 80;
        doc.setFillColor(5, 150, 105); doc.rect(5, infoStartY - 4, 75, 8, 'F'); // Green-600 Name Banner
        doc.setTextColor(255, 255, 255); doc.setFont('helvetica', 'bold'); doc.setFontSize(9);
        doc.text(fName.toUpperCase(), 42.5, infoStartY, { align: 'center' });

        const rows = [
            { label: 'Role', value: designation },
            { label: 'Emp ID', value: `EMP-${fm.id}` },
            { label: 'Email', value: fEmail },
            { label: 'Phone', value: fPhone },
            { label: 'Teaching', value: teachingText },
            { label: 'Join Date', value: joinDate },
        ];

        let y = infoStartY + 7;
        rows.forEach((row, i) => {
            doc.setFillColor(...(i % 2 === 0 ? [240, 253, 244] : [209, 250, 229])); // Green-50 / Green-100
            doc.rect(5, y - 3.5, 75, 6.5, 'F');
            doc.setTextColor(5, 150, 105); doc.setFont('helvetica', 'bold'); doc.setFontSize(6); // Green-600 text
            doc.text(`${row.label}:`, 8, y + 0.5);
            doc.setTextColor(2, 44, 34); doc.setFont('helvetica', 'normal'); // Green-950 text
            doc.text(doc.splitTextToSize(String(row.value), 46)[0], 30, y + 0.5);
            y += 7;
        });

        doc.setFillColor(6, 78, 59); doc.rect(0, 149, 85, 6, 'F'); // Green-900 bottom footer
        doc.setTextColor(255,255,255); doc.setFont('helvetica', 'normal'); doc.setFontSize(5.5);
        doc.text('Official Educational Staff Identity Card', 42.5, 152.5, { align: 'center' });
    };

    const handleDownloadSingleCard = async () => {
        if (!qrFaculty) return;
        setQrDownloading(true);
        try {
            const { jsPDF } = await import('jspdf');
            const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: [85, 148] });

            let logoBase64 = null;
            if (user?.institute_logo) {
                let logoUrl = user.institute_logo;
                if (logoUrl.startsWith('/')) {
                    const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:5000/api";
                    logoUrl = `${apiUrl.replace(/\/api\/?$/, "")}${logoUrl}`;
                }
                logoBase64 = await getBase64ImageFromUrl(logoUrl);
            }

            const qrDataUrl = await QRCode.toDataURL(`FACULTY_QR_${qrFaculty.id}`, { width: 300, margin: 1 });
            await generateIdCard(doc, qrFaculty, logoBase64, user?.institute_name || '', user?.institute_phone || '', qrDataUrl);
            await savePdfNative(doc, `${qrFaculty.User?.name || 'Faculty'}_ID_Card.pdf`);
        } catch (e) {
            alert('Failed to generate PDF: ' + e.message);
        } finally {
            setQrDownloading(false);
        }
    };

    const handleBulkDownloadCards = async () => {
        if (selectedFaculty.length === 0) return;
        setBulkDownloading(true);
        try {
            const { jsPDF } = await import('jspdf');
            const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: [85, 148] });

            let logoBase64 = null;
            if (user?.institute_logo) {
                let logoUrl = user.institute_logo;
                if (logoUrl.startsWith('/')) {
                    const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:5000/api";
                    logoUrl = `${apiUrl.replace(/\/api\/?$/, "")}${logoUrl}`;
                }
                logoBase64 = await getBase64ImageFromUrl(logoUrl);
            }

            let firstPage = true;
            for (const fId of selectedFaculty) {
                let fm = filteredFaculty.find(f => f.id === fId);
                if (!fm) continue;
                try {
                    const stRes = await api.get(`/faculty/${fId}`);
                    if (stRes.data && stRes.data.data) fm = stRes.data.data;
                } catch (e) {}

                if (!firstPage) doc.addPage([85, 148], 'portrait');
                firstPage = false;
                
                const qrDataUrl = await QRCode.toDataURL(`FACULTY_QR_${fm.id}`, { width: 300, margin: 1 });
                await generateIdCard(doc, fm, logoBase64, user?.institute_name || '', user?.institute_phone || '', qrDataUrl);
            }
            await savePdfNative(doc, `Bulk_Faculty_ID_Cards_${selectedFaculty.length}.pdf`);
        } catch (e) {
            alert('Download failed: ' + e.message);
        } finally {
            setBulkDownloading(false);
        }
    };

    const [formData, setFormData] = useState({
        name: "",
        email: "",
        phone: "",
        password: "",
        designation: "",
        salary: "",
        join_date: "",
    });

    useEffect(() => {
        fetchFaculty();
        fetchClasses();
        fetchSubjects();
    }, []);

    const hasPerm = (op) => {
        if (user?.role === 'admin' || user?.role === 'super_admin') return true;
        if (user?.role === 'manager' && user?.permissions) {
            return user.permissions.includes('faculty') || user.permissions.includes(`faculty.${op}`);
        }
        return false;
    };
    const canCreate = hasPerm('create');
    const canUpdate = hasPerm('update');
    const canDelete = hasPerm('delete');

    const fetchFaculty = async () => {
        try {
            const response = await api.get("/faculty");
            setFaculty(response.data.data || []);
            setTotalCount(response.data.count || 0);
        } catch (error) {
            console.error("Error fetching faculty:", error);
        } finally {
            setLoading(false);
        }
    };

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
            const response = await api.get("/subjects");
            setSubjects(response.data.data || []);
        } catch (error) {
            console.error("Error fetching subjects:", error);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (editMode) {
                await api.put(`/faculty/${formData.id}`, formData);
                alert("Faculty updated successfully");
            } else {
                const res = await api.post("/faculty", {
                    ...formData,
                    institute_id: user.institute_id,
                });
                
                if (res.data.showPasswordOnScreen) {
                    setCredentialsData([{
                        id: res.data.data.faculty.id,
                        identifier: res.data.data.faculty.designation || 'Faculty',
                        name: res.data.data.user.name,
                        email: res.data.data.user.email || 'N/A',
                        password: res.data.initial_password
                    }]);
                    setShowCredentialsModal(true);
                } else {
                    alert("Faculty added successfully");
                }
            }
            setShowModal(false);
            resetForm();
            fetchFaculty();
        } catch (error) {
            alert("Error: " + error.response?.data?.message);
        }
    };

    const handleEdit = (facultyMember) => {
        setFormData({
            id: facultyMember.id,
            name: facultyMember.User?.name || "",
            email: facultyMember.User?.email || "",
            phone: facultyMember.User?.phone || "",
            password: "",
            designation: facultyMember.designation || "",
            salary: facultyMember.salary || "",
            join_date: facultyMember.join_date || "",
        });
        setEditMode(true);
        setShowModal(true);
    };

    const handleDelete = async (id) => {
        if (!window.confirm("Are you sure you want to delete this faculty member?")) return;

        try {
            await api.delete(`/faculty/${id}`);
            alert("Faculty deleted successfully");
            fetchFaculty();
        } catch (error) {
            alert("Error deleting faculty: " + error.response?.data?.message);
        }
    };

    const resetForm = () => {
        setFormData({
            name: "",
            email: "",
            phone: "",
            password: "",
            designation: "",
            salary: "",
            join_date: "",
        });
        setEditMode(false);
    };

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value,
        });
    };

    const handleBulkSuccess = (result) => {
        fetchFaculty();
        alert(`✅ ${result.inserted} faculty member(s) imported successfully!${result.failed > 0 ? ` (${result.failed} rows had errors)` : ''}`);
    };

    const filteredFaculty = faculty.filter(
        (f) =>
            f.User?.name.toLowerCase().includes(search.toLowerCase()) ||
            f.User?.email.toLowerCase().includes(search.toLowerCase()) ||
            f.designation?.toLowerCase().includes(search.toLowerCase())
    );

    if (loading) {
        return <div className="dashboard-container">Loading...</div>;
    }

    return (
        <div className="dashboard-container">
            <div className="dashboard-header">
                <div>
                    <h1 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <span style={{ fontSize: '2rem', lineHeight: 1 }}>👩‍🏫</span>
                        Faculty Management
                    </h1>
                    <p>Manage faculty members</p>
                </div>
                <div className="dashboard-header-right">
                    <ThemeSelector />
                    <Link to="/admin/dashboard" className="btn btn-secondary">
                        ← Back
                    </Link>
                    {canCreate && (
                        <>
                            <BulkImportButton type="faculty" onSuccess={handleBulkSuccess} />
                            <button onClick={() => { resetForm(); setShowModal(true); }} className="btn btn-primary btn-animated">
                                + Add Faculty
                            </button>
                        </>
                    )}
                </div>
            </div>

            {/* Search */}
            <div className="card" style={{ marginBottom: "2rem" }}>
                <div style={{ padding: "1.5rem" }}>
                    <input
                        type="text"
                        className="form-input"
                        placeholder="Search by name, email, or designation..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>
            </div>

            {/* Statistics */}
            <div className="stats-grid" style={{ marginBottom: "2rem" }}>
                <div className="stat-card">
                    <div className="stat-icon">👩‍🏫</div>
                    <div className="stat-content">
                        <h3>{totalCount}</h3>
                        <p>Total Faculty</p>
                    </div>
                </div>
                <div className="stat-card">
                    <div className="stat-icon">✅</div>
                    <div className="stat-content">
                        <h3>{faculty.filter((f) => f.User?.status === "active").length}</h3>
                        <p>Active</p>
                    </div>
                </div>
                <div className="stat-card">
                    <div className="stat-icon">📚</div>
                    <div className="stat-content">
                        <h3>{subjects.length}</h3>
                        <p>Total Subjects</p>
                    </div>
                </div>
                <div className="stat-card">
                    <div className="stat-icon">🏫</div>
                    <div className="stat-content">
                        <h3>{classes.length}</h3>
                        <p>Total Classes</p>
                    </div>
                </div>
            </div>

            {/* Faculty Table */}
            <div className="card">
                <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
                    <h3 className="card-title" style={{ margin: 0 }}>All Faculty ({filteredFaculty.length})</h3>
                    {selectedFaculty.length > 0 && (
                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                            <button 
                                className="btn btn-sm" 
                                style={{ background: 'linear-gradient(135deg, #6366f1, #4f46e5)', color: 'white', fontWeight: 600, border: 'none', borderRadius: '6px', display: 'flex', alignItems: 'center', gap: '0.4rem' }}
                                onClick={handleViewCredentials}
                                disabled={loadingCredentials}
                            >
                                {loadingCredentials ? '⏳ Loading...' : `🔑 View ${selectedFaculty.length} Credentials`}
                            </button>
                            <button 
                                className="btn btn-sm" 
                                style={{ background: 'linear-gradient(135deg, #10b981, #059669)', color: 'white', fontWeight: 600, border: 'none', borderRadius: '6px' }}
                                onClick={handleBulkDownloadCards}
                                disabled={bulkDownloading}
                            >
                                {bulkDownloading ? '⏳ Generating PDF...' : `⬇ Download ${selectedFaculty.length} Selected Cards`}
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
                                        checked={selectedFaculty.length === filteredFaculty.length && filteredFaculty.length > 0} 
                                        onChange={handleSelectAll} 
                                        style={{ cursor: 'pointer', width: '16px', height: '16px' }}
                                    />
                                </th>
                                <th>ID</th>
                                <th>Name</th>
                                <th>Email</th>
                                <th>Phone</th>
                                <th>Designation</th>
                                <th>Salary</th>
                                <th>Join Date</th>
                                <th>Teaching Details</th>
                                <th>Status</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredFaculty.length === 0 ? (
                                <tr>
                                    <td colSpan="11" style={{ textAlign: "center", padding: "2rem" }}>
                                        No faculty found
                                    </td>
                                </tr>
                            ) : (
                                filteredFaculty.map((facultyMember) => (
                                    <tr key={facultyMember.id}>
                                        <td>
                                            <input 
                                                type="checkbox" 
                                                checked={selectedFaculty.includes(facultyMember.id)} 
                                                onChange={() => handleSelectRow(facultyMember.id)}
                                                style={{ cursor: 'pointer', width: '16px', height: '16px' }}
                                            />
                                        </td>
                                        <td>{facultyMember.id}</td>
                                        <td>{facultyMember.User?.name}</td>
                                        <td>{facultyMember.User?.email}</td>
                                        <td>{facultyMember.User?.phone || "N/A"}</td>
                                        <td>{facultyMember.designation || "N/A"}</td>
                                        <td>₹{facultyMember.salary || "N/A"}</td>
                                        <td>
                                            {facultyMember.join_date
                                                ? new Date(facultyMember.join_date).toLocaleDateString()
                                                : "N/A"}
                                        </td>
                                        <td>
                                            {facultyMember.Subjects && facultyMember.Subjects.length > 0 ? (
                                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px', maxWidth: '260px' }}>
                                                    {facultyMember.Subjects.map((sub) => (
                                                        <span key={sub.id} className="teaching-detail-pill">
                                                            <span className="teaching-detail-class">
                                                                {sub.Class?.name}{sub.Class?.section ? ` (${sub.Class.section})` : ''}
                                                            </span>
                                                            <span className="teaching-detail-sep">·</span>
                                                            <span className="teaching-detail-subject">{sub.name}</span>
                                                        </span>
                                                    ))}
                                                </div>
                                            ) : (
                                                <span className="teaching-detail-empty">
                                                    No subjects assigned
                                                </span>
                                            )}
                                        </td>
                                        <td>
                                            <span
                                                className={`badge badge-${facultyMember.User?.status === "active" ? "success" : "danger"
                                                    }`}
                                            >
                                                {facultyMember.User?.status}
                                            </span>
                                        </td>
                                        <td>
                                            <div style={{ display: "flex", gap: "0.5rem" }}>
                                                <button
                                                    className="btn btn-sm"
                                                    style={{ background: 'linear-gradient(135deg, #667eea, #764ba2)', color: '#fff', border: 'none', borderRadius: '6px', fontWeight: 600 }}
                                                    onClick={() => handleViewQr(facultyMember)}
                                                >
                                                    🔲 View QR
                                                </button>
                                                <button
                                                    className="btn btn-sm"
                                                    style={{ background: '#f3f4f6', color: '#4b5563', border: '1px solid #d1d5db', borderRadius: '6px', fontWeight: 600 }}
                                                    onClick={() => handleViewSingleCredentials(facultyMember.id)}
                                                >
                                                    🔑 Keys
                                                </button>
                                                {canUpdate && (
                                                    <button
                                                        className="btn btn-sm btn-primary"
                                                        onClick={() => handleEdit(facultyMember)}
                                                    >
                                                        Edit
                                                    </button>
                                                )}
                                                {canDelete && (
                                                    <button
                                                        className="btn btn-sm btn-danger"
                                                        onClick={() => handleDelete(facultyMember.id)}
                                                    >
                                                        Delete
                                                    </button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {/* ── MOBILE CARD LIST (shown on mobile via responsive.css) ── */}
                <div className="admin-mobile-cards card-stagger">
                    {filteredFaculty.length === 0 ? (
                        <div className="empty-state-mobile">
                            <div className="empty-icon">👩‍🏫</div>
                            <div className="empty-title">No Faculty Found</div>
                            <div className="empty-desc">No faculty members match your search.</div>
                        </div>
                    ) : (
                        filteredFaculty.map((fm) => (
                            <div key={fm.id} className="admin-item-card" style={{ borderLeftColor: '#10b981' }}>
                                <div className="aic-info">
                                    <div className="aic-name">
                                        {fm.User?.name}
                                        <span className="aic-badge">
                                            <span className={`badge badge-${fm.User?.status === 'active' ? 'success' : 'danger'}`}>
                                                {fm.User?.status}
                                            </span>
                                        </span>
                                    </div>
                                    <div className="aic-sub">{fm.User?.email} · {fm.designation || 'Faculty'}</div>
                                    <div className="aic-sub">
                                        {fm.Subjects?.length > 0
                                            ? fm.Subjects.map(s => `${s.Class?.name ? s.Class.name + ': ' : ''}${s.name}`).join(' · ')
                                            : 'No subjects assigned'}
                                    </div>
                                </div>
                                <div className="aic-actions">
                                    <button className="btn btn-sm" style={{ background: '#f3f4f6', color: '#4b5563' }} onClick={() => handleViewSingleCredentials(fm.id)}>🔑</button>
                                    {canUpdate && (
                                        <button className="btn btn-sm btn-primary" onClick={() => handleEdit(fm)}>Edit</button>
                                    )}
                                    {canDelete && (
                                        <button className="btn btn-sm btn-danger" onClick={() => handleDelete(fm.id)}>Del</button>
                                    )}
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>

            {/* Add/Edit Faculty Modal */}
            {showModal && (
                <div className="modal-overlay" onClick={() => setShowModal(false)}>
                    <div className="modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: "600px" }}>
                        <div className="modal-header">
                            <h3>{editMode ? "Edit Faculty" : "Add New Faculty"}</h3>
                            <button onClick={() => setShowModal(false)} className="btn btn-sm">
                                ×
                            </button>
                        </div>
                        <div className="modal-body">
                            <form onSubmit={handleSubmit}>
                                <div className="form-group">
                                    <label className="form-label">Full Name *</label>
                                    <input
                                        type="text"
                                        name="name"
                                        className="form-input"
                                        placeholder="John Doe"
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
                                        placeholder="john@example.com"
                                        value={formData.email}
                                        onChange={handleChange}
                                        required
                                        disabled={editMode}
                                    />
                                </div>

                                <div className="form-group">
                                    <label className="form-label">Phone</label>
                                    <input
                                        type="tel"
                                        name="phone"
                                        className="form-input"
                                        placeholder="9876543210"
                                        value={formData.phone}
                                        onChange={handleChange}
                                    />
                                </div>

                                {!editMode && (
                                    <div className="form-group">
                                        <label className="form-label">Password *</label>
                                        <input
                                            type="password"
                                            name="password"
                                            className="form-input"
                                            placeholder="Minimum 6 characters"
                                            value={formData.password}
                                            onChange={handleChange}
                                            required={!editMode}
                                            minLength={6}
                                        />
                                    </div>
                                )}

                                <div className="form-group">
                                    <label className="form-label">Designation</label>
                                    <input
                                        type="text"
                                        name="designation"
                                        className="form-input"
                                        placeholder="e.g., Senior Teacher, HOD"
                                        value={formData.designation}
                                        onChange={handleChange}
                                    />
                                </div>

                                <div className="form-group">
                                    <label className="form-label">Salary (₹)</label>
                                    <input
                                        type="number"
                                        name="salary"
                                        className="form-input"
                                        placeholder="30000"
                                        value={formData.salary}
                                        onChange={handleChange}
                                        min="0"
                                    />
                                </div>

                                <div className="form-group">
                                    <label className="form-label">Join Date</label>
                                    <input
                                        type="date"
                                        name="join_date"
                                        className="form-input"
                                        value={formData.join_date}
                                        onChange={handleChange}
                                    />
                                </div>

                                <div className="modal-footer">
                                    <button type="button" onClick={() => setShowModal(false)} className="btn btn-secondary">
                                        Cancel
                                    </button>
                                    <button type="submit" className="btn btn-primary">
                                        {editMode ? "Update Faculty" : "Add Faculty"}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}

            {/* QR Code Single Modal */}
            {showQrModal && qrFaculty && (
                <div className="modal-overlay" onClick={() => setShowQrModal(false)}>
                    <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: '400px', textAlign: 'center' }}>
                        <div className="modal-header">
                            <h3>Faculty Identity Card</h3>
                            <button onClick={() => setShowQrModal(false)} className="btn btn-sm">×</button>
                        </div>
                        <div className="modal-body">
                            {qrLoading ? (
                                <p>Loading deep profile metrics...</p>
                            ) : (
                                <>
                                    <div style={{
                                        background: 'white', padding: '1rem',
                                        borderRadius: '12px', border: '2px solid #e5e7eb',
                                        display: 'inline-block', marginBottom: '1.5rem'
                                    }}>
                                        <QRCodeSVG
                                            value={`FACULTY_QR_${qrFaculty.id}`}
                                            size={200}
                                            level={"H"}
                                            includeMargin={true}
                                        />
                                    </div>
                                    <h3 style={{ margin: 0, color: 'var(--text-primary)' }}>{qrFaculty.User?.name}</h3>
                                    <p style={{ margin: '0.25rem 0 1.5rem 0', color: 'var(--text-secondary)' }}>
                                        {qrFaculty.designation || 'Faculty'} · {qrFaculty.User?.email}
                                    </p>
                                    <button
                                        className="btn btn-primary btn-animated"
                                        style={{ width: '100%', display: 'flex', justifyContent: 'center', gap: '0.5rem' }}
                                        onClick={handleDownloadSingleCard}
                                        disabled={qrDownloading}
                                    >
                                        {qrDownloading ? '⏳ Generating Native Format...' : '⬇ Download Single Card'}
                                    </button>
                                </>
                            )}
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
                                    Faculty Credentials
                                </h3>
                                <p style={{ margin: '0.2rem 0 0 0', opacity: 0.9, fontSize: '0.85rem' }}>
                                    Manage initial passwords for faculty members
                                </p>
                            </div>
                            <button onClick={() => setShowCredentialsModal(false)} className="btn btn-sm" style={{ background: 'rgba(255,255,255,0.2)', color: 'white', border: 'none' }}>×</button>
                        </div>
                        
                        <div className="modal-body" style={{ padding: '1.5rem', maxHeight: '60vh', overflowY: 'auto' }}>
                            <div style={{ overflowX: 'auto', borderRadius: '8px', border: '1px solid var(--border-color, #e5e7eb)' }}>
                                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
                                    <thead style={{ background: '#f8fafc', borderBottom: '2px solid #e2e8f0', textAlign: 'left' }}>
                                        <tr>
                                            <th style={{ padding: '0.8rem 1rem', color: '#475569', fontWeight: 600 }}>Role</th>
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
                                                    onReset={async (facultyId) => {
                                                        try {
                                                            const res = await api.post(`/faculty/${facultyId}/resend-credentials`);
                                                            if (res.data.success && res.data.initial_password) {
                                                                setCredentialsData(prev => prev.map(x =>
                                                                    x.id === facultyId
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
                                    <strong>Security Note:</strong> Initial passwords are visible only until the faculty member logs in and changes their password.
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default Faculty;

