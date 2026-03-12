import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { toast } from 'react-hot-toast';

const FacultyAssignments = () => {
    const [assignments, setAssignments] = useState([]);
    const [loading, setLoading] = useState(true);

    // For Create Modal
    const [showModal, setShowModal] = useState(false);
    const [uploading, setUploading] = useState(false);

    // Submissions View State
    const [viewSubmissions, setViewSubmissions] = useState(false);
    const [selectedAssignment, setSelectedAssignment] = useState(null);
    const [submissions, setSubmissions] = useState([]);
    const [subLoading, setSubLoading] = useState(false);

    // Grading State
    const [showGradeModal, setShowGradeModal] = useState(false);
    const [selectedSubmission, setSelectedSubmission] = useState(null);
    const [gradingData, setGradingData] = useState({
        marks_obtained: "",
        grade: "",
        feedback: ""
    });
    const [grading, setGrading] = useState(false);

    const [classes, setClasses] = useState([]);
    const [subjects, setSubjects] = useState([]);
    const [filteredSubjects, setFilteredSubjects] = useState([]);

    const [formData, setFormData] = useState({
        title: "",
        description: "",
        class_id: "",
        subject_id: "",
        due_date: "",
        max_marks: "",
        status: "draft",
        file: null
    });

    useEffect(() => {
        fetchAssignments();
    }, []);

    const fetchAssignments = async () => {
        try {
            setLoading(true);
            const res = await api.get('/assignments');
            if (res.data.success) {
                setAssignments(res.data.assignments);
            }

            // Load classes & subjects for faculty
            const subRes = await api.get('/subjects');
            const mySubjects = subRes.data.success ? subRes.data.data : [];
            setSubjects(mySubjects);

            const classMap = new Map();
            mySubjects.forEach(s => {
                if (s.Class) classMap.set(s.Class.id, s.Class);
            });
            setClasses(Array.from(classMap.values()));

        } catch (error) {
            console.error("Error fetching assignments:", error);
        } finally {
            setLoading(false);
        }
    };

    if (loading && assignments.length === 0) return <div style={{ padding: '20px' }}>Loading Assignments...</div>;

    const handleChange = (e) => {
        const { name, value, files } = e.target;
        if (name === "file") {
            setFormData(f => ({ ...f, file: files[0] }));
        } else if (name === "class_id") {
            const subForClass = subjects.filter(s => String(s.class_id) === String(value) || String(s.Class?.id) === String(value));
            setFilteredSubjects(subForClass);
            setFormData(f => ({ ...f, class_id: value, subject_id: "" }));
        } else {
            setFormData(f => ({ ...f, [name]: value }));
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setUploading(true);

        const data = new FormData();
        data.append("title", formData.title);
        data.append("description", formData.description);
        data.append("class_id", formData.class_id);
        data.append("subject_id", formData.subject_id);
        data.append("due_date", formData.due_date);
        data.append("max_marks", formData.max_marks || 100);
        data.append("status", formData.status);
        if (formData.file) {
            data.append("reference_file", formData.file);
        }

        try {
            const res = await api.post("/assignments", data, {
                headers: { "Content-Type": "multipart/form-data" }
            });
            if (res.data.success) {
                toast.success("Assignment created successfully!");
                setShowModal(false);
                setFormData({ title: "", description: "", class_id: "", subject_id: "", due_date: "", max_marks: "", status: "draft", file: null });
                fetchAssignments();
            }
        } catch (err) {
            toast.error(err.response?.data?.message || "Failed to create assignment");
        } finally {
            setUploading(false);
        }
    };

    const handleViewSubmissions = async (asg) => {
        setSelectedAssignment(asg);
        setViewSubmissions(true);
        setSubLoading(true);
        try {
            const res = await api.get(`/assignments/${asg.id}/submissions`);
            if (res.data.success) {
                setSubmissions(res.data.submissions);
            }
        } catch (error) {
            toast.error("Failed to fetch submissions");
        } finally {
            setSubLoading(false);
        }
    };

    const openGradeModal = (sub) => {
        setSelectedSubmission(sub);
        setGradingData({
            marks_obtained: sub.marks_obtained || "",
            grade: sub.grade || "",
            feedback: sub.feedback || ""
        });
        setShowGradeModal(true);
    };

    const handleGradeSubmit = async (e) => {
        e.preventDefault();
        setGrading(true);
        try {
            const res = await api.patch(`/assignments/${selectedAssignment.id}/submissions/${selectedSubmission.id}/grade`, gradingData);
            if (res.data.success) {
                toast.success("Graded successfully");
                setShowGradeModal(false);
                // Refresh submissions list
                handleViewSubmissions(selectedAssignment);
            }
        } catch (err) {
            toast.error(err.response?.data?.message || "Failed to grade");
        } finally {
            setGrading(false);
        }
    };

    return (
        <div className="dashboard-container">
            <div className="dashboard-header" style={{ display: 'flex', justifyContent: 'space-between' }}>
                <div>
                    <h1>📝 My Assignments</h1>
                    <p>Manage assignments you have created.</p>
                </div>
                <div>
                    <button className="btn btn-primary" onClick={() => setShowModal(true)}>
                        + Create Assignment
                    </button>
                </div>
            </div>

            <div className="card" style={{ marginTop: '20px', padding: '20px' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '10px' }}>
                    <thead>
                        <tr style={{ background: '#f3f4f6', textAlign: 'left' }}>
                            <th style={{ padding: '10px', borderBottom: '2px solid #e5e7eb' }}>Title</th>
                            <th style={{ padding: '10px', borderBottom: '2px solid #e5e7eb' }}>Class & Subject</th>
                            <th style={{ padding: '10px', borderBottom: '2px solid #e5e7eb' }}>Due Date</th>
                            <th style={{ padding: '10px', borderBottom: '2px solid #e5e7eb' }}>Status</th>
                            <th style={{ padding: '10px', borderBottom: '2px solid #e5e7eb' }}>Submissions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {assignments.length === 0 ? (
                            <tr><td colSpan="5" style={{ padding: '20px', textAlign: 'center' }}>No assignments found</td></tr>
                        ) : assignments.map(a => (
                            <tr key={a.id} style={{ borderBottom: '1px solid #e5e7eb' }}>
                                <td style={{ padding: '10px' }}>{a.title}</td>
                                <td style={{ padding: '10px' }}>{a.Class?.name} - {a.Subject?.name}</td>
                                <td style={{ padding: '10px' }}>{new Date(a.due_date).toLocaleDateString()}</td>
                                <td style={{ padding: '10px' }}>
                                    <span style={{
                                        padding: '5px 10px', borderRadius: '15px', fontSize: '12px',
                                        background: a.status === 'published' ? '#d1fae5' : a.status === 'draft' ? '#f3f4f6' : '#fee2e2',
                                        color: a.status === 'published' ? '#065f46' : a.status === 'draft' ? '#4b5563' : '#991b1b'
                                    }}>
                                        {a.status}
                                    </span>
                                </td>
                                <td style={{ padding: '10px' }}>
                                    <button
                                        className="btn btn-sm btn-secondary"
                                        onClick={() => handleViewSubmissions(a)}
                                        style={{ padding: '4px 8px', fontSize: '12px' }}
                                    >
                                        {a.stats?.total_submissions} / {a.stats?.total_students} Submissions
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* View Submissions Modal */}
            {viewSubmissions && (
                <div className="modal-overlay">
                    <div className="modal-content" style={{ maxWidth: 900, width: '95%', maxHeight: '90vh', overflowY: 'auto' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                            <h2 style={{ margin: 0 }}>📊 Submissions for: {selectedAssignment.title}</h2>
                            <button className="btn btn-secondary" onClick={() => setViewSubmissions(false)}>✕</button>
                        </div>

                        {subLoading ? (
                            <div style={{ padding: '40px', textAlign: 'center' }}>Loading submissions...</div>
                        ) : (
                            <div className="card" style={{ padding: '0', overflow: 'hidden' }}>
                                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                    <thead>
                                        <tr style={{ background: '#f8fafc', textAlign: 'left' }}>
                                            <th style={{ padding: '12px', borderBottom: '1px solid #e2e8f0' }}>Student Name</th>
                                            <th style={{ padding: '12px', borderBottom: '1px solid #e2e8f0' }}>Submitted On</th>
                                            <th style={{ padding: '12px', borderBottom: '1px solid #e2e8f0' }}>File</th>
                                            <th style={{ padding: '12px', borderBottom: '1px solid #e2e8f0' }}>Status</th>
                                            <th style={{ padding: '12px', borderBottom: '1px solid #e2e8f0' }}>Marks / Grade</th>
                                            <th style={{ padding: '12px', borderBottom: '1px solid #e2e8f0' }}>Action</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {submissions.length === 0 ? (
                                            <tr><td colSpan="6" style={{ padding: '20px', textAlign: 'center' }}>No submissions yet.</td></tr>
                                        ) : submissions.map(s => (
                                            <tr key={s.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                                                <td style={{ padding: '12px' }}>
                                                    <strong>{s.Student?.User?.name}</strong><br />
                                                    <small style={{ color: '#64748b' }}>Roll No: {s.Student?.roll_number}</small>
                                                </td>
                                                <td style={{ padding: '12px' }}>
                                                    {new Date(s.submitted_at).toLocaleString()}
                                                    {s.is_late && <div style={{ color: '#ef4444', fontSize: '11px', fontWeight: 'bold' }}>LATE</div>}
                                                </td>
                                                <td style={{ padding: '12px' }}>
                                                    <a
                                                        href={`${api.defaults.baseURL.replace('/api', '')}${s.submission_file_url}`}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="btn btn-secondary btn-sm"
                                                        style={{ padding: '2px 8px', fontSize: '11px' }}
                                                    >
                                                        View File
                                                    </a>
                                                </td>
                                                <td style={{ padding: '12px' }}>
                                                    <span style={{
                                                        padding: '4px 8px', borderRadius: '12px', fontSize: '11px',
                                                        background: s.status === 'graded' ? '#dcfce7' : '#fef9c3',
                                                        color: s.status === 'graded' ? '#166534' : '#854d0e'
                                                    }}>
                                                        {s.status}
                                                    </span>
                                                </td>
                                                <td style={{ padding: '12px' }}>
                                                    {s.status === 'graded' ? (
                                                        <span>{s.marks_obtained} / {selectedAssignment.max_marks} ({s.grade})</span>
                                                    ) : '-'}
                                                </td>
                                                <td style={{ padding: '12px' }}>
                                                    <button className="btn btn-primary btn-sm" onClick={() => openGradeModal(s)}>
                                                        {s.status === 'graded' ? 'Edit Grade' : 'Grade Now'}
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Grading Modal */}
            {showGradeModal && (
                <div className="modal-overlay" style={{ zIndex: 1100 }}>
                    <div className="modal-content" style={{ maxWidth: 500, width: '90%' }}>
                        <h3>📝 Grade Submission: {selectedSubmission?.Student?.User?.name}</h3>
                        <form onSubmit={handleGradeSubmit}>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginTop: '15px' }}>
                                <div className="form-group">
                                    <label className="form-label">Marks Obtained (Max: {selectedAssignment.max_marks}) *</label>
                                    <input
                                        type="number"
                                        className="form-input"
                                        value={gradingData.marks_obtained}
                                        onChange={(e) => setGradingData({ ...gradingData, marks_obtained: e.target.value })}
                                        required
                                        max={selectedAssignment.max_marks}
                                        min="0"
                                        step="0.01"
                                    />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Grade (Optional)</label>
                                    <input
                                        type="text"
                                        className="form-input"
                                        placeholder="A, B+, Excellent etc"
                                        value={gradingData.grade}
                                        onChange={(e) => setGradingData({ ...gradingData, grade: e.target.value })}
                                    />
                                </div>
                            </div>
                            <div className="form-group" style={{ marginTop: '15px' }}>
                                <label className="form-label">Feedback to Student</label>
                                <textarea
                                    className="form-input"
                                    rows="3"
                                    placeholder="Good work, keep it up..."
                                    value={gradingData.feedback}
                                    onChange={(e) => setGradingData({ ...gradingData, feedback: e.target.value })}
                                ></textarea>
                            </div>
                            <div className="modal-actions" style={{ marginTop: '20px', display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                                <button type="button" className="btn btn-secondary" onClick={() => setShowGradeModal(false)} disabled={grading}>Cancel</button>
                                <button type="submit" className="btn btn-primary" disabled={grading}>
                                    {grading ? "Saving..." : "Save Grade"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Create Assignment Modal */}
            {showModal && (
                <div className="modal-overlay">
                    <div className="modal-content" style={{ maxWidth: 600, width: '95%' }}>
                        <h2>📝 Create Assignment</h2>
                        <form onSubmit={handleSubmit}>
                            <div className="form-group">
                                <label className="form-label">Title *</label>
                                <input type="text" name="title" className="form-input" placeholder="Assignment Title" value={formData.title} onChange={handleChange} required />
                            </div>

                            <div className="form-group">
                                <label className="form-label">Description</label>
                                <textarea name="description" className="form-input" rows="2" placeholder="Brief instructions..." value={formData.description} onChange={handleChange}></textarea>
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                <div className="form-group">
                                    <label className="form-label">Class *</label>
                                    <select name="class_id" className="form-input" value={formData.class_id} onChange={handleChange} required>
                                        <option value="">Select Class</option>
                                        {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                                    </select>
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Subject *</label>
                                    <select name="subject_id" className="form-input" value={formData.subject_id} onChange={handleChange} required disabled={!formData.class_id}>
                                        <option value="">{formData.class_id ? "Select Subject" : "Select class first"}</option>
                                        {filteredSubjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                                    </select>
                                </div>
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                <div className="form-group">
                                    <label className="form-label">Due Date *</label>
                                    <input type="datetime-local" name="due_date" className="form-input" value={formData.due_date} onChange={handleChange} required />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Max Marks *</label>
                                    <input type="number" name="max_marks" className="form-input" placeholder="100" value={formData.max_marks} onChange={handleChange} required />
                                </div>
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                <div className="form-group">
                                    <label className="form-label">Status</label>
                                    <select name="status" className="form-input" value={formData.status} onChange={handleChange}>
                                        <option value="draft">Draft - Save for later</option>
                                        <option value="published">Publish immediately</option>
                                    </select>
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Reference File (Optional)</label>
                                    <input type="file" name="file" className="form-input" onChange={handleChange} accept=".pdf,.doc,.docx,.zip,.jpg,.jpeg,.png" />
                                </div>
                            </div>

                            <div className="modal-actions" style={{ marginTop: '20px', display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)} disabled={uploading}>Cancel</button>
                                <button type="submit" className="btn btn-primary" disabled={uploading}>
                                    {uploading ? "Creating..." : "Create Assignment"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default FacultyAssignments;
