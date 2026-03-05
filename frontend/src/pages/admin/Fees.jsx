/**
 * Fees Management Page — Phase 3
 * Manager view: shows Pending / Paid students, search, and cash collection modal
 * Admin view: additionally shows Fee Structures tab
 */

import { useState, useEffect, useContext } from "react";
import { Link } from "react-router-dom";
import api from "../../services/api";
import { AuthContext } from "../../context/AuthContext";
import "./Dashboard.css";

const TODAY = new Date().toISOString().split('T')[0];

function Fees() {
    const { user } = useContext(AuthContext);
    const isAdmin = user?.role === 'admin' || user?.role === 'super_admin';

    // Helper to check granular permissions
    const hasPerm = (module, action) => {
        if (isAdmin) return true;
        if (user?.role === 'manager') {
            return user.permissions?.includes(`${module}.${action}`) || user.permissions?.includes(module);
        }
        return false;
    };

    // tabs: 'collect' | 'history' | 'structure'
    const [tab, setTab] = useState('collect');

    // Data
    const [students, setStudents] = useState([]);
    const [payments, setPayments] = useState([]);
    const [feeStructures, setFeeStructures] = useState([]);
    const [classes, setClasses] = useState([]);
    const [subjects, setSubjects] = useState([]);

    // UI
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [filterClass, setFilterClass] = useState('');
    const [filterStatus, setFilterStatus] = useState('pending'); // 'pending' | 'paid' | 'all'
    const [success, setSuccess] = useState('');

    // Collect fee modal
    const [collectingStudent, setCollectingStudent] = useState(null);
    const [collecting, setCollecting] = useState(false);
    const [payForm, setPayForm] = useState({
        amount: '',
        payment_method: 'cash',
        transaction_id: '',
        payment_date: TODAY,
        remarks: ''
    });
    const [payError, setPayError] = useState('');

    // Add fee structure modal (admin)
    const [showStructureModal, setShowStructureModal] = useState(false);
    const [editingStructureId, setEditingStructureId] = useState(null);
    const [availableSubjects, setAvailableSubjects] = useState([]);
    const [structureForm, setStructureForm] = useState({
        class_id: '', subject_id: '', fee_type: 'Tuition Fee', amount: '', due_date: '', description: ''
    });

    useEffect(() => { init(); }, []);

    const init = async () => {
        try {
            setLoading(true);
            const [sRes, cRes, pRes] = await Promise.all([
                api.get('/students'),
                api.get('/classes'),
                api.get('/fees/payments'),
            ]);
            setStudents(sRes.data.data || []);
            setClasses(cRes.data.data || []);
            setPayments(pRes.data.data || []);
            if (isAdmin || hasPerm('fees', 'read')) {
                const fRes = await api.get('/fees/structure');
                setFeeStructures(fRes.data.data || []);
            }
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    const refreshPayments = async () => {
        const pRes = await api.get('/fees/payments');
        setPayments(pRes.data.data || []);
    };

    // ── Derived: which students have paid? ──
    const paidStudentIds = new Set(payments.filter(p => p.status === 'success').map(p => p.student_id));

    const filteredStudents = students.filter(s => {
        const name = s.User?.name?.toLowerCase() || '';
        const roll = s.roll_number?.toLowerCase() || '';
        const matchSearch = !search || name.includes(search.toLowerCase()) || roll.includes(search.toLowerCase());
        const matchClass = !filterClass || String(s.class_id) === String(filterClass);
        const isPaid = paidStudentIds.has(s.id);
        const matchStatus =
            filterStatus === 'all' ? true :
                filterStatus === 'paid' ? isPaid :
                    !isPaid; // pending
        return matchSearch && matchClass && matchStatus;
    });

    // Open collect modal pre-filled with student info
    const openCollect = (student) => {
        setCollectingStudent(student);
        setPayForm({ amount: '', payment_method: 'cash', transaction_id: '', payment_date: TODAY, remarks: '' });
        setPayError('');
    };

    const handleCollect = async (e) => {
        e.preventDefault();
        if (!payForm.amount || parseFloat(payForm.amount) <= 0) {
            setPayError('Please enter a valid amount.');
            return;
        }
        try {
            setCollecting(true);
            await api.post('/fees/pay', {
                student_id: collectingStudent.id,
                amount: payForm.amount,
                payment_method: payForm.payment_method,
                transaction_id: payForm.transaction_id,
                payment_date: payForm.payment_date,
                remarks: payForm.remarks
            });
            setCollectingStudent(null);
            setSuccess(`✅ Payment of ₹${parseFloat(payForm.amount).toLocaleString()} collected from ${collectingStudent.User?.name}`);
            setTimeout(() => setSuccess(''), 5000);
            await refreshPayments();
        } catch (err) {
            setPayError(err.response?.data?.message || 'Failed to record payment.');
        } finally {
            setCollecting(false);
        }
    };

    const fetchSubjectsForClass = async (classId) => {
        if (!classId) { setAvailableSubjects([]); return; }
        try {
            const r = await api.get(`/subjects?class_id=${classId}`);
            setAvailableSubjects(r.data.data || []);
        } catch { }
    };

    const handleStructureSubmit = async (e) => {
        e.preventDefault();
        try {
            if (editingStructureId) {
                await api.put(`/fees/structure/${editingStructureId}`, structureForm);
                setSuccess("✅ Fee structure updated successfully.");
            } else {
                await api.post('/fees/structure', structureForm);
                setSuccess("✅ Fee structure created successfully.");
            }
            setTimeout(() => setSuccess(''), 5000);
            setShowStructureModal(false);
            const r = await api.get('/fees/structure');
            setFeeStructures(r.data.data || []);
            setStructureForm({ class_id: '', subject_id: '', fee_type: 'Tuition Fee', amount: '', due_date: '', description: '' });
            setEditingStructureId(null);
        } catch (err) {
            alert(err.response?.data?.message || 'Error saving fee structure');
        }
    };

    const handleEditStructure = (fs) => {
        setEditingStructureId(fs.id);
        setStructureForm({
            class_id: fs.class_id,
            subject_id: fs.subject_id || '',
            fee_type: fs.fee_type,
            amount: fs.amount,
            due_date: fs.due_date,
            description: fs.description || ''
        });
        fetchSubjectsForClass(fs.class_id);
        setShowStructureModal(true);
    };

    const handleDeleteStructure = async (id) => {
        if (!window.confirm("Are you sure you want to delete this fee structure?")) return;
        try {
            await api.delete(`/fees/structure/${id}`);
            setSuccess("✅ Fee structure deleted successfully.");
            setTimeout(() => setSuccess(''), 5000);
            const r = await api.get('/fees/structure');
            setFeeStructures(r.data.data || []);
        } catch (err) {
            alert(err.response?.data?.message || 'Error deleting fee structure');
        }
    };

    if (loading) return <div className="dashboard-container"><div className="dashboard-loading">Loading fees...</div></div>;

    const tabs = [
        { id: 'collect', label: '💰 Collect Fees', icon: '💰' },
        { id: 'history', label: '📋 Payment History', icon: '📋' },
        ...(isAdmin || hasPerm('fees', 'read') ? [{ id: 'structure', label: '📐 Fee Structures', icon: '📐' }] : []),
    ];

    const pendingCount = students.filter(s => !paidStudentIds.has(s.id)).length;
    const paidCount = students.filter(s => paidStudentIds.has(s.id)).length;
    const totalCollected = payments.filter(p => p.status === 'success').reduce((sum, p) => sum + parseFloat(p.amount_paid || 0), 0);

    return (
        <div className="dashboard-container">
            {/* Header */}
            <div className="dashboard-header">
                <div>
                    <h1>💰 Fee Management</h1>
                    <p>Collect fees, view payment history{isAdmin ? ', and manage fee structures' : ''}.</p>
                </div>
                <div style={{ display: 'flex', gap: '10px' }}>
                    <Link to="/admin/dashboard" className="btn btn-secondary">← Back</Link>
                    {tab === 'structure' && hasPerm('fees', 'create') && (
                        <button className="btn btn-primary" onClick={() => {
                            setEditingStructureId(null);
                            setStructureForm({ class_id: '', subject_id: '', fee_type: 'Tuition Fee', amount: '', due_date: '', description: '' });
                            setShowStructureModal(true);
                        }}
                            style={{ background: 'linear-gradient(135deg,#6366f1,#a855f7)', border: 'none' }}>
                            + Add Fee Structure
                        </button>
                    )}
                </div>
            </div>

            {/* Success toast */}
            {success && (
                <div style={{
                    background: 'linear-gradient(135deg,rgba(16,185,129,0.15),rgba(16,185,129,0.05))',
                    border: '1px solid rgba(16,185,129,0.4)', borderRadius: '10px',
                    padding: '0.85rem 1.25rem', marginBottom: '1.25rem',
                    color: '#10b981', fontWeight: '600', fontSize: '0.95rem',
                    display: 'flex', alignItems: 'center', gap: '0.5rem'
                }}>
                    {success}
                </div>
            )}

            {/* Summary stats */}
            <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(3,1fr)', marginBottom: '1.5rem' }}>
                <div className="stat-card">
                    <div className="stat-icon">⏳</div>
                    <div className="stat-content">
                        <h3 style={{ color: '#f59e0b' }}>{pendingCount}</h3>
                        <p>Pending Students</p>
                    </div>
                </div>
                <div className="stat-card">
                    <div className="stat-icon">✅</div>
                    <div className="stat-content">
                        <h3 style={{ color: '#10b981' }}>{paidCount}</h3>
                        <p>Paid Students</p>
                    </div>
                </div>
                <div className="stat-card">
                    <div className="stat-icon">💵</div>
                    <div className="stat-content">
                        <h3>₹{totalCollected.toLocaleString()}</h3>
                        <p>Total Collected</p>
                    </div>
                </div>
            </div>

            {/* Tabs */}
            <div style={{ display: 'flex', gap: '0.25rem', borderBottom: '2px solid var(--border-color)', marginBottom: '1.5rem' }}>
                {tabs.map(t => (
                    <button key={t.id} onClick={() => setTab(t.id)} style={{
                        padding: '0.65rem 1.25rem', border: 'none', background: 'none', cursor: 'pointer',
                        fontWeight: tab === t.id ? '700' : '500', fontSize: '0.9rem',
                        color: tab === t.id ? '#6366f1' : 'var(--text-secondary)',
                        borderBottom: tab === t.id ? '3px solid #6366f1' : '3px solid transparent',
                        marginBottom: '-2px', transition: 'all 0.15s'
                    }}>
                        {t.label}
                    </button>
                ))}
            </div>

            {/* ═══ COLLECT FEES TAB ═══ */}
            {tab === 'collect' && (
                <>
                    {/* Filters */}
                    <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
                        <input
                            type="text" className="form-input" placeholder="🔍 Search student name or roll no."
                            value={search} onChange={e => setSearch(e.target.value)}
                            style={{ flex: '1', minWidth: '200px', maxWidth: '360px' }}
                        />
                        <select className="form-select" value={filterClass} onChange={e => setFilterClass(e.target.value)}
                            style={{ minWidth: '160px' }}>
                            <option value="">All Classes</option>
                            {classes.map(c => <option key={c.id} value={c.id}>{c.name} {c.section}</option>)}
                        </select>
                        <div style={{ display: 'flex', gap: '4px' }}>
                            {[['pending', '⏳ Pending', '#f59e0b'], ['paid', '✅ Paid', '#10b981'], ['all', '👥 All', '#6366f1']].map(([val, lbl, col]) => (
                                <button key={val} onClick={() => setFilterStatus(val)} style={{
                                    padding: '8px 16px', borderRadius: '8px', border: 'none', cursor: 'pointer',
                                    fontWeight: filterStatus === val ? '700' : '500', fontSize: '0.85rem',
                                    background: filterStatus === val ? `${col}22` : 'var(--card-bg)',
                                    color: filterStatus === val ? col : 'var(--text-secondary)',
                                    border: `1.5px solid ${filterStatus === val ? col : 'var(--border-color)'}`
                                }}>{lbl}</button>
                            ))}
                        </div>
                    </div>

                    <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '0.75rem' }}>
                        Showing <strong>{filteredStudents.length}</strong> student{filteredStudents.length !== 1 ? 's' : ''}
                    </div>

                    {/* Student rows */}
                    {filteredStudents.length === 0 ? (
                        <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-secondary)' }}>
                            <div style={{ fontSize: '2.5rem', marginBottom: '0.75rem' }}>
                                {filterStatus === 'pending' ? '🎉' : '📭'}
                            </div>
                            <div style={{ fontWeight: '600' }}>
                                {filterStatus === 'pending' ? 'All students have paid!' : 'No students match your search.'}
                            </div>
                        </div>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                            {filteredStudents.map(s => {
                                const isPaid = paidStudentIds.has(s.id);
                                // find latest payment for this student
                                const latestPay = payments.filter(p => p.student_id === s.id && p.status === 'success').sort((a, b) => new Date(b.payment_date) - new Date(a.payment_date))[0];
                                const cls = classes.find(c => c.id === s.class_id);
                                return (
                                    <div key={s.id} style={{
                                        display: 'flex', alignItems: 'center', gap: '1rem',
                                        padding: '0.85rem 1.1rem', borderRadius: '12px',
                                        border: `1px solid ${isPaid ? 'rgba(16,185,129,0.25)' : 'rgba(245,158,11,0.25)'}`,
                                        background: isPaid ? 'rgba(16,185,129,0.04)' : 'rgba(245,158,11,0.04)',
                                        transition: 'box-shadow 0.2s',
                                        flexWrap: 'wrap'
                                    }}>
                                        {/* Avatar */}
                                        <div style={{
                                            width: '44px', height: '44px', borderRadius: '50%', flexShrink: 0,
                                            background: isPaid
                                                ? 'linear-gradient(135deg,#10b981,#059669)'
                                                : 'linear-gradient(135deg,#f59e0b,#d97706)',
                                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                                            color: '#fff', fontWeight: '700', fontSize: '1rem'
                                        }}>
                                            {(s.User?.name || 'S')[0].toUpperCase()}
                                        </div>

                                        {/* Info */}
                                        <div style={{ flex: 1, minWidth: '140px' }}>
                                            <div style={{ fontWeight: '700', fontSize: '0.95rem' }}>{s.User?.name}</div>
                                            <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                                                Roll: {s.roll_number} · {cls ? `${cls.name} ${cls.section || ''}` : 'N/A'}
                                            </div>
                                        </div>

                                        {/* Payment info */}
                                        <div style={{ textAlign: 'right', minWidth: '130px' }}>
                                            {isPaid && latestPay ? (
                                                <>
                                                    <div style={{ fontWeight: '700', color: '#10b981', fontSize: '0.95rem' }}>
                                                        ₹{parseFloat(latestPay.amount_paid).toLocaleString()}
                                                    </div>
                                                    <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                                                        {new Date(latestPay.payment_date).toLocaleDateString()} · {latestPay.payment_method}
                                                    </div>
                                                </>
                                            ) : (
                                                <div style={{ fontSize: '0.85rem', color: '#f59e0b', fontWeight: '600' }}>
                                                    Fees Pending
                                                </div>
                                            )}
                                        </div>

                                        {/* Status badge + Action */}
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexShrink: 0 }}>
                                            <span style={{
                                                fontSize: '0.74rem', padding: '3px 10px', borderRadius: '20px', fontWeight: '700',
                                                background: isPaid ? 'rgba(16,185,129,0.15)' : 'rgba(245,158,11,0.15)',
                                                color: isPaid ? '#10b981' : '#f59e0b'
                                            }}>
                                                {isPaid ? '✅ Paid' : '⏳ Pending'}
                                            </span>

                                            {!isPaid && hasPerm('fees', 'create') && (
                                                <button
                                                    onClick={() => openCollect(s)}
                                                    style={{
                                                        padding: '6px 16px', borderRadius: '8px', border: 'none', cursor: 'pointer',
                                                        background: 'linear-gradient(135deg,#10b981,#059669)',
                                                        color: '#fff', fontWeight: '700', fontSize: '0.82rem',
                                                        boxShadow: '0 2px 8px rgba(16,185,129,0.3)',
                                                        transition: 'transform 0.15s'
                                                    }}
                                                    onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.05)'}
                                                    onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
                                                >
                                                    💵 Collect
                                                </button>
                                            )}
                                            {isPaid && hasPerm('fees', 'create') && (
                                                <button
                                                    onClick={() => openCollect(s)}
                                                    style={{
                                                        padding: '6px 14px', borderRadius: '8px', border: '1px solid rgba(16,185,129,0.35)',
                                                        background: 'transparent', color: '#10b981', fontWeight: '600', fontSize: '0.8rem', cursor: 'pointer'
                                                    }}
                                                >
                                                    + Add More
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </>
            )}

            {/* ═══ PAYMENT HISTORY TAB ═══ */}
            {tab === 'history' && (
                <div className="card">
                    <div style={{ marginBottom: '1rem' }}>
                        <input type="text" className="form-input" placeholder="🔍 Search student name..."
                            value={search} onChange={e => setSearch(e.target.value)}
                            style={{ maxWidth: '320px' }} />
                    </div>
                    <div className="table-container">
                        <table className="table">
                            <thead>
                                <tr>
                                    <th>Date</th>
                                    <th>Student</th>
                                    <th>Amount</th>
                                    <th>Method</th>
                                    <th>Transaction ID</th>
                                    <th>Remarks</th>
                                    <th>Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                {payments.filter(p => {
                                    const n = (p.Student?.User?.name || '').toLowerCase();
                                    return !search || n.includes(search.toLowerCase());
                                }).length === 0 ? (
                                    <tr><td colSpan="7" className="text-center">No payment records found</td></tr>
                                ) : (
                                    payments.filter(p => {
                                        const n = (p.Student?.User?.name || '').toLowerCase();
                                        return !search || n.includes(search.toLowerCase());
                                    }).map(p => (
                                        <tr key={p.id}>
                                            <td>{new Date(p.payment_date).toLocaleDateString()}</td>
                                            <td>
                                                <strong>{p.Student?.User?.name}</strong><br />
                                                <small>{p.Student?.roll_number}</small>
                                            </td>
                                            <td style={{ color: '#10b981', fontWeight: '700' }}>
                                                +₹{parseFloat(p.amount_paid).toLocaleString()}
                                            </td>
                                            <td style={{ textTransform: 'capitalize' }}>{p.payment_method}</td>
                                            <td>{p.transaction_id || '—'}</td>
                                            <td>{p.remarks || '—'}</td>
                                            <td>
                                                <span className={`badge badge-${p.status === 'success' ? 'success' : 'warning'}`}>
                                                    {p.status}
                                                </span>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* ═══ FEE STRUCTURES TAB ═══ */}
            {tab === 'structure' && hasPerm('fees', 'read') && (
                <div className="card">
                    <div className="table-container">
                        <table className="table">
                            <thead>
                                <tr>
                                    <th>Class & Subject</th>
                                    <th>Fee Type</th>
                                    <th>Amount</th>
                                    <th>Due Date</th>
                                    <th>Description</th>
                                    {(hasPerm('fees', 'update') || hasPerm('fees', 'delete')) && <th style={{ textAlign: 'right' }}>Actions</th>}
                                </tr>
                            </thead>
                            <tbody>
                                {feeStructures.length === 0 ? (
                                    <tr><td colSpan={(hasPerm('fees', 'update') || hasPerm('fees', 'delete')) ? 6 : 5} className="text-center">No fee structures defined</td></tr>
                                ) : feeStructures.map(fs => (
                                    <tr key={fs.id}>
                                        <td>
                                            {fs.Class?.name} {fs.Class?.section}<br />
                                            <small style={{ color: '#6b7280' }}>
                                                {fs.Subject ? fs.Subject.name : 'All Subjects (Full Class)'}
                                            </small>
                                        </td>
                                        <td><span className="badge badge-info">{fs.fee_type}</span></td>
                                        <td>₹{parseFloat(fs.amount).toLocaleString()}</td>
                                        <td>{new Date(fs.due_date).toLocaleDateString()}</td>
                                        <td>{fs.description || '—'}</td>
                                        {(hasPerm('fees', 'update') || hasPerm('fees', 'delete')) && (
                                            <td style={{ textAlign: 'right', whiteSpace: 'nowrap' }}>
                                                {hasPerm('fees', 'update') && (
                                                    <button onClick={() => handleEditStructure(fs)} className="btn btn-secondary" style={{ padding: '4px 10px', fontSize: '0.8rem', marginRight: '6px' }}>
                                                        ✏️ Edit
                                                    </button>
                                                )}
                                                {hasPerm('fees', 'delete') && (
                                                    <button onClick={() => handleDeleteStructure(fs.id)} className="btn btn-danger" style={{ padding: '4px 10px', fontSize: '0.8rem' }}>
                                                        🗑️ Delete
                                                    </button>
                                                )}
                                            </td>
                                        )}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* ═══ COLLECT MODAL ═══ */}
            {collectingStudent && (
                <div className="modal-overlay">
                    <div className="modal-content" style={{ maxWidth: '460px', width: '95%' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.25rem' }}>
                            <div style={{
                                width: '52px', height: '52px', borderRadius: '50%',
                                background: 'linear-gradient(135deg,#10b981,#059669)',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                color: '#fff', fontWeight: '800', fontSize: '1.2rem', flexShrink: 0
                            }}>
                                {(collectingStudent.User?.name || 'S')[0].toUpperCase()}
                            </div>
                            <div>
                                <h2 style={{ margin: 0 }}>Collect Fee</h2>
                                <div style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                                    {collectingStudent.User?.name} · Roll {collectingStudent.roll_number}
                                </div>
                            </div>
                        </div>

                        <form onSubmit={handleCollect}>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '0.75rem' }}>
                                <div className="form-group" style={{ margin: 0 }}>
                                    <label className="form-label">Amount (₹) *</label>
                                    <input
                                        type="number" className="form-input" placeholder="e.g. 5000"
                                        value={payForm.amount} min="1" step="1" required
                                        onChange={e => setPayForm({ ...payForm, amount: e.target.value })}
                                        autoFocus
                                        style={{ fontWeight: '700', fontSize: '1.1rem' }}
                                    />
                                </div>
                                <div className="form-group" style={{ margin: 0 }}>
                                    <label className="form-label">Payment Date *</label>
                                    <input
                                        type="date" className="form-input" value={payForm.payment_date} required
                                        onChange={e => setPayForm({ ...payForm, payment_date: e.target.value })}
                                    />
                                </div>
                            </div>

                            <div className="form-group">
                                <label className="form-label">Payment Method</label>
                                <div style={{ display: 'flex', gap: '0.5rem' }}>
                                    {[['cash', '💵 Cash'], ['online', '📱 Online (UPI)'], ['cheque', '🏦 Cheque']].map(([val, lbl]) => (
                                        <button key={val} type="button"
                                            onClick={() => setPayForm({ ...payForm, payment_method: val })}
                                            style={{
                                                flex: 1, padding: '8px 4px', borderRadius: '8px', cursor: 'pointer',
                                                fontSize: '0.8rem', fontWeight: '600',
                                                border: `1.5px solid ${payForm.payment_method === val ? '#6366f1' : 'var(--border-color)'}`,
                                                background: payForm.payment_method === val ? 'rgba(99,102,241,0.1)' : 'transparent',
                                                color: payForm.payment_method === val ? '#6366f1' : 'var(--text-secondary)'
                                            }}>
                                            {lbl}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {payForm.payment_method !== 'cash' && (
                                <div className="form-group">
                                    <label className="form-label">Transaction / Reference ID</label>
                                    <input type="text" className="form-input"
                                        value={payForm.transaction_id} placeholder="UTR / Cheque No."
                                        onChange={e => setPayForm({ ...payForm, transaction_id: e.target.value })} />
                                </div>
                            )}

                            <div className="form-group">
                                <label className="form-label">Remarks (Optional)</label>
                                <input type="text" className="form-input"
                                    value={payForm.remarks} placeholder="e.g. Q1 tuition fee"
                                    onChange={e => setPayForm({ ...payForm, remarks: e.target.value })} />
                            </div>

                            {payError && (
                                <div style={{ color: '#ef4444', background: 'rgba(239,68,68,0.08)', padding: '0.6rem', borderRadius: '8px', marginBottom: '0.75rem', fontSize: '0.85rem' }}>
                                    ⚠️ {payError}
                                </div>
                            )}

                            {/* Amount preview */}
                            {payForm.amount && (
                                <div style={{
                                    background: 'linear-gradient(135deg,rgba(16,185,129,0.1),rgba(16,185,129,0.05))',
                                    border: '1px solid rgba(16,185,129,0.3)', borderRadius: '10px',
                                    padding: '0.75rem 1rem', marginBottom: '1rem',
                                    display: 'flex', justifyContent: 'space-between', alignItems: 'center'
                                }}>
                                    <span style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Collecting from {collectingStudent.User?.name}</span>
                                    <span style={{ fontWeight: '800', color: '#10b981', fontSize: '1.3rem' }}>
                                        ₹{parseFloat(payForm.amount).toLocaleString()}
                                    </span>
                                </div>
                            )}

                            <div className="modal-actions">
                                <button type="button" className="btn btn-secondary"
                                    onClick={() => setCollectingStudent(null)} disabled={collecting}>
                                    Cancel
                                </button>
                                <button type="submit" disabled={collecting} style={{
                                    padding: '0.65rem 1.5rem', borderRadius: '10px', border: 'none',
                                    background: 'linear-gradient(135deg,#10b981,#059669)',
                                    color: '#fff', fontWeight: '700', fontSize: '0.95rem', cursor: 'pointer'
                                }}>
                                    {collecting ? 'Processing…' : '✅ Confirm Collection'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* ═══ STRUCTURE MODAL ═══ */}
            {showStructureModal && (hasPerm('fees', 'create') || hasPerm('fees', 'update')) && (
                <div className="modal-overlay">
                    <div className="modal-content" style={{ maxWidth: '480px', width: '95%' }}>
                        <h2 style={{ marginBottom: '1.25rem' }}>{editingStructureId ? '✏️ Edit Fee Structure' : '📐 Add Fee Structure'}</h2>
                        <form onSubmit={handleStructureSubmit}>
                            <div className="form-group">
                                <label className="form-label">Class</label>
                                <select className="form-select" value={structureForm.class_id} required
                                    onChange={e => { setStructureForm({ ...structureForm, class_id: e.target.value, subject_id: '' }); fetchSubjectsForClass(e.target.value); }}>
                                    <option value="">Select Class</option>
                                    {classes.map(c => <option key={c.id} value={c.id}>{c.name} {c.section}</option>)}
                                </select>
                            </div>
                            <div className="form-group">
                                <label className="form-label">Subject (Optional)</label>
                                <select className="form-select" value={structureForm.subject_id}
                                    onChange={e => setStructureForm({ ...structureForm, subject_id: e.target.value })}>
                                    <option value="">All Subjects (Full Class)</option>
                                    {availableSubjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                                </select>
                            </div>
                            <div className="form-group">
                                <label className="form-label">Fee Type</label>
                                <select className="form-select" value={structureForm.fee_type}
                                    onChange={e => setStructureForm({ ...structureForm, fee_type: e.target.value })}>
                                    {['Tuition Fee', 'Exam Fee', 'Transport Fee', 'Library Fee', 'Other'].map(t => <option key={t}>{t}</option>)}
                                </select>
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                                <div className="form-group">
                                    <label className="form-label">Amount (₹)</label>
                                    <input type="number" className="form-input" required min="1" value={structureForm.amount}
                                        onChange={e => setStructureForm({ ...structureForm, amount: e.target.value })} />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Due Date</label>
                                    <input type="date" className="form-input" required value={structureForm.due_date}
                                        onChange={e => setStructureForm({ ...structureForm, due_date: e.target.value })} />
                                </div>
                            </div>
                            <div className="form-group">
                                <label className="form-label">Description</label>
                                <textarea className="form-input" rows="2" value={structureForm.description}
                                    onChange={e => setStructureForm({ ...structureForm, description: e.target.value })} />
                            </div>
                            <div className="modal-actions">
                                <button type="button" className="btn btn-secondary" onClick={() => setShowStructureModal(false)}>Cancel</button>
                                <button type="submit" className="btn btn-primary" style={{ background: 'linear-gradient(135deg,#6366f1,#a855f7)', border: 'none' }}>
                                    {editingStructureId ? 'Save Changes' : 'Create Structure'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}

export default Fees;
