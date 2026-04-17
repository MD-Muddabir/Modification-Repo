import { useState, useEffect, useContext } from "react";
import api from "../../services/api";
import { AuthContext } from "../../context/AuthContext";
import BackButton from "../../components/common/BackButton";
import "../admin/Dashboard.css"; // Reuse dashboard UI

const DAYS_OF_WEEK = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

function StudentTimetable() {
    const { user } = useContext(AuthContext);
    const [loading, setLoading] = useState(true);
    const [slots, setSlots] = useState([]);
    const [timetable, setTimetable] = useState([]);

    const [classes, setClasses] = useState([]);
    const [selectedClass, setSelectedClass] = useState("");

    // ── Enrolled subject IDs fetched from /students/me ──
    const [enrolledSubjectIds, setEnrolledSubjectIds] = useState(new Set());
    const [enrolledSubjectNames, setEnrolledSubjectNames] = useState([]);

    useEffect(() => {
        fetchStudentData();
    }, []);

    useEffect(() => {
        if (selectedClass) {
            fetchStudentTimetable(selectedClass);
        } else {
            setTimetable([]);
        }
    }, [selectedClass]);

    const fetchStudentData = async () => {
        setLoading(true);
        try {
            const res = await api.get("/students/me");
            const studentData = res.data.data;

            // ── Store enrolled subject IDs as a Set for O(1) lookup ──
            if (studentData?.Subjects?.length > 0) {
                setEnrolledSubjectIds(new Set(studentData.Subjects.map(s => s.id)));
                setEnrolledSubjectNames(studentData.Subjects.map(s => s.name));
            }

            if (studentData && studentData.Classes && studentData.Classes.length > 0) {
                setClasses(studentData.Classes);
                setSelectedClass(studentData.Classes[0].id);
            } else {
                setLoading(false); // No classes assigned
            }
        } catch (error) {
            console.error("Error fetching student data", error);
            setLoading(false);
        }
    };

    const fetchStudentTimetable = async (classId) => {
        setLoading(true);
        try {
            const [slotsRes, timetableRes] = await Promise.all([
                api.get("/timetable/slots"),
                api.get(`/timetable/class/${classId}`)
            ]);
            setSlots(slotsRes.data.data || []);
            setTimetable(timetableRes.data.data || []);
        } catch (error) {
            console.error("Error fetching timetable", error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return <div className="dashboard-container">Loading Class Schedule...</div>;
    }

    return (
        <div className="dashboard-container">
            <div className="dashboard-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                    <h1>📅 My Class Timetable</h1>
                    <p>Showing only your enrolled subjects' schedule.</p>
                </div>
                <BackButton to="/student/dashboard" />
            </div>

            {/* ── Enrolled Subjects Info Banner ── */}
            {enrolledSubjectNames.length > 0 && (
                <div style={{
                    display: 'flex',
                    flexWrap: 'wrap',
                    gap: '8px',
                    alignItems: 'center',
                    marginBottom: '1.5rem',
                    padding: '0.85rem 1.2rem',
                    background: 'var(--bg-card, #f8fafc)',
                    borderRadius: '12px',
                    border: '1px solid var(--border-color)',
                }}>
                    <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)', marginRight: '4px' }}>
                        📚 Your enrolled subjects:
                    </span>
                    {enrolledSubjectNames.map((name, i) => (
                        <span key={i} style={{
                            fontSize: '0.8rem',
                            fontWeight: 600,
                            padding: '3px 10px',
                            borderRadius: '999px',
                            background: 'linear-gradient(135deg, #4f46e5, #7c3aed)',
                            color: '#fff',
                            letterSpacing: '0.02em'
                        }}>
                            {name}
                        </span>
                    ))}
                </div>
            )}

            {classes.length > 1 && (
                <div className="filter-container" style={{ marginBottom: "2rem" }}>
                    <span className="filter-label">Select Class:</span>
                    <select
                        className="form-select"
                        style={{ width: "250px", margin: 0 }}
                        value={selectedClass}
                        onChange={(e) => setSelectedClass(e.target.value)}
                    >
                        {classes.map(cls => (
                            <option key={cls.id} value={cls.id}>{cls.name}</option>
                        ))}
                    </select>
                </div>
            )}

            {slots.length === 0 ? (
                <div className="card" style={{ padding: "3rem", textAlign: "center", color: "var(--text-secondary)" }}>
                    No time slots or schedules have been set up by the institute administrators.
                </div>
            ) : (
                <div className="card" style={{ overflowX: "auto" }}>
                    <table className="table timetable-table mobile-keep" style={{ minWidth: "800px" }}>
                        <thead>
                            <tr>
                                <th style={{ width: "120px" }}></th>
                                {DAYS_OF_WEEK.map(day => (
                                    <th key={day} style={{ textAlign: "center", background: '#f8fafc', borderRadius: '12px' }}>{day}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {slots.map((slot, idx) => (
                                <tr key={slot.id}>
                                    <td className="time-slot-label">
                                        <strong>Period {idx + 1}</strong>
                                        <span>{slot.start_time.slice(0, 5)} - {slot.end_time.slice(0, 5)}</span>
                                    </td>
                                    {DAYS_OF_WEEK.map(day => {
                                        // Find the full class timetable entry for this slot+day
                                        const entry = timetable.find(t => t.slot_id === slot.id && t.day_of_week === day);

                                        // ── Only show entry if the student is enrolled in that subject ──
                                        const isEnrolled = entry && enrolledSubjectIds.has(entry.subject_id);

                                        let colorClass = "pill-color-0";
                                        if (isEnrolled) {
                                            colorClass = `pill-color-${entry.subject_id % 7}`;
                                        }

                                        return (
                                            <td key={`${slot.id}-${day}`}>
                                                {isEnrolled ? (
                                                    <div className={`timetable-pill ${colorClass}`}>
                                                        <span style={{ fontWeight: 600 }}>{entry.Subject?.name}</span>
                                                        <div style={{ fontSize: "0.8rem", color: "var(--text-secondary)", marginTop: "4px" }}>
                                                            {entry.Faculty?.User?.name}
                                                        </div>
                                                        {entry.room_number && (
                                                            <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginTop: "3px", fontWeight: 500 }}>
                                                                🚪 Room {entry.room_number}
                                                            </div>
                                                        )}
                                                    </div>
                                                ) : (
                                                    <div className="timetable-pill" style={{
                                                        backgroundColor: 'transparent',
                                                        border: '1px dashed var(--border-color)',
                                                        color: 'var(--text-muted)'
                                                    }}>
                                                        -
                                                    </div>
                                                )}
                                            </td>
                                        );
                                    })}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}

export default StudentTimetable;
