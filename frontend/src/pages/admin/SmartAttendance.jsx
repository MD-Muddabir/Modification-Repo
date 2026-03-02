import { useState, useEffect, useContext } from "react";
import { Link } from "react-router-dom";
import { QRCodeSVG } from "qrcode.react";
import api from "../../services/api";
import { AuthContext } from "../../context/AuthContext";
import "./Dashboard.css";
import ThemeSelector from "../../components/ThemeSelector";

function SmartAttendance() {
    const { user } = useContext(AuthContext);
    const [classes, setClasses] = useState([]);
    const [selectedClass, setSelectedClass] = useState("");
    const [subjects, setSubjects] = useState([]);
    const [selectedSubject, setSelectedSubject] = useState("");
    const [activeSession, setActiveSession] = useState(null);
    const [loading, setLoading] = useState(false);
    const [timeLeft, setTimeLeft] = useState(0);

    useEffect(() => {
        fetchClasses();
        checkActiveSession("current"); // check if user has an active session
    }, []);

    useEffect(() => {
        if (selectedClass) {
            fetchSubjects();
            checkActiveSession(selectedClass);
        } else {
            setSubjects([]);
            setSelectedSubject("");
        }
    }, [selectedClass]);

    useEffect(() => {
        let timer;
        if (activeSession && activeSession.expires_at) {
            timer = setInterval(() => {
                const now = new Date().getTime();
                const expiry = new Date(activeSession.expires_at).getTime();
                const diff = Math.floor((expiry - now) / 1000);
                if (diff > 0) {
                    setTimeLeft(diff);
                } else {
                    setTimeLeft(0);
                    setActiveSession(null); // auto expire UI
                }
            }, 1000);
        }
        return () => clearInterval(timer);
    }, [activeSession]);

    const fetchClasses = async () => {
        try {
            // Note: If user is faculty, the backend /classes already returns only assigned classes
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

    const checkActiveSession = async (classId) => {
        try {
            setLoading(true);
            const response = await api.get(`/attendance/active-session/${classId}`);
            if (response.data.success && response.data.data) {
                setActiveSession(response.data.data);
                setSelectedClass(response.data.data.class_id);
                if (response.data.data.subject_id) {
                    setSelectedSubject(response.data.data.subject_id);
                }
            } else {
                if (classId !== "current") {
                    setActiveSession(null);
                }
            }
        } catch (error) {
            if (classId !== "current") {
                setActiveSession(null);
            }
        } finally {
            setLoading(false);
        }
    };

    const startSession = async () => {
        if (!selectedClass) return alert("Please select a class");
        if (!selectedSubject) return alert("Please select a subject");

        try {
            setLoading(true);
            const response = await api.post("/attendance/start-session", {
                class_id: selectedClass,
                subject_id: selectedSubject
            });
            if (response.data.success) {
                setActiveSession(response.data.data);
            }
        } catch (error) {
            alert(error.response?.data?.message || "Failed to start session");
        } finally {
            setLoading(false);
        }
    };

    const endSession = async () => {
        if (!activeSession) return;
        try {
            setLoading(true);
            await api.post(`/attendance/end-session/${activeSession.id}`);
            setActiveSession(null);
            setTimeLeft(0);
            alert("Session ended successfully");
        } catch (error) {
            alert(error.response?.data?.message || "Failed to end session");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="dashboard-container">
            <div className="dashboard-header">
                <div>
                    <h1>⚡ Smart Attendance</h1>
                    <p>Start a session and display QR code for students to scan.</p>
                </div>
                <Link to="/admin/dashboard" className="btn btn-secondary">
                    ← Back
                </Link>
            </div>

            <div className="card" style={{ padding: "2rem", maxWidth: "600px", margin: "0 auto", textAlign: "center" }}>
                {!activeSession ? (
                    <div>
                        <h2 style={{ marginBottom: "1rem" }}>Start a New Session</h2>
                        <div className="form-group" style={{ textAlign: "left" }}>
                            <label className="form-label">Select Class</label>
                            <select
                                className="form-input"
                                value={selectedClass}
                                onChange={(e) => setSelectedClass(e.target.value)}
                            >
                                <option value="">-- Choose Class --</option>
                                {classes.map((cls) => (
                                    <option key={cls.id} value={cls.id}>
                                        {cls.name} {cls.section ? `(${cls.section})` : ""}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div className="form-group" style={{ textAlign: "left", marginTop: "1rem" }}>
                            <label className="form-label">Select Subject</label>
                            <select
                                className="form-input"
                                value={selectedSubject}
                                onChange={(e) => setSelectedSubject(e.target.value)}
                                disabled={!selectedClass}
                            >
                                <option value="">-- Choose Subject --</option>
                                {subjects.map((sub) => (
                                    <option key={sub.id} value={sub.id}>
                                        {sub.name}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <button
                            className="btn btn-primary btn-animated"
                            style={{ width: "100%", padding: "1rem", fontSize: "1.1rem", marginTop: "1rem" }}
                            onClick={startSession}
                            disabled={loading || !selectedClass || !selectedSubject}
                        >
                            {loading ? "Starting..." : "Start Attendance Session"}
                        </button>
                    </div>
                ) : (
                    <div>
                        <div style={{ padding: "1rem", backgroundColor: "#ecfdf5", color: "#065f46", borderRadius: "8px", marginBottom: "2rem", border: "1px solid #10b981" }}>
                            <h2 style={{ margin: 0, display: "flex", alignItems: "center", justifyContent: "center", gap: "10px" }}>
                                🟢 Session Active
                            </h2>
                            <p style={{ margin: "0.5rem 0 0 0", fontSize: "1.2rem" }}>
                                Time Remaining: <strong>{Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, '0')}</strong>
                            </p>
                        </div>

                        <div style={{ background: "white", padding: "1.5rem", display: "inline-block", borderRadius: "12px", boxShadow: "0 4px 6px -1px rgba(0,0,0,0.1)" }}>
                            <QRCodeSVG
                                value={activeSession.session_token}
                                size={256}
                                bgColor={"#ffffff"}
                                fgColor={"#000000"}
                                level={"Q"}
                                includeMargin={false}
                            />
                        </div>

                        <p style={{ marginTop: "2rem", color: "#6b7280" }}>
                            Students can scan this QR code from their dashboard to mark attendance.
                        </p>

                        <button
                            className="btn btn-danger"
                            style={{ width: "100%", padding: "1rem", fontSize: "1.1rem", marginTop: "1rem" }}
                            onClick={endSession}
                            disabled={loading}
                        >
                            {loading ? "Ending..." : "End Session Now"}
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}

export default SmartAttendance;
