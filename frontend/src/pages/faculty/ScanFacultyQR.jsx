import { useState, useEffect, useContext } from "react";
import { Link, useNavigate } from "react-router-dom";
import { QRCodeSVG } from "qrcode.react";
import QRCode from "qrcode";
import api from "../../services/api";
import { AuthContext } from "../../context/AuthContext";
import "../admin/Dashboard.css";

function FacultyQRCode() {
    const { user } = useContext(AuthContext);
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [facultyData, setFacultyData] = useState(null);
    const [downloading, setDownloading] = useState(false);

    useEffect(() => {
        fetchFacultyData();
    }, []);

    const fetchFacultyData = async () => {
        try {
            const profileRes = await api.get("/faculty/me");
            setFacultyData(profileRes.data.data);
        } catch (error) {
            console.error("Error fetching faculty profile:", error);
        } finally {
            setLoading(false);
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

    const handleDownloadCard = async () => {
        if (!facultyData) return;
        setDownloading(true);
        try {
            const { jsPDF } = await import('jspdf');
            const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: [85, 148] });

            let logoBase64 = null;
            if (user?.institute_logo || facultyData?.institute_logo || facultyData?.Institute?.logo) {
                let logoUrl = user?.institute_logo || facultyData?.institute_logo || facultyData?.Institute?.logo;
                if (logoUrl.startsWith('/')) {
                    const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:5000/api";
                    logoUrl = `${apiUrl.replace(/\/api\/?$/, "")}${logoUrl}`;
                }
                logoBase64 = await getBase64ImageFromUrl(logoUrl);
            }

            const fm = facultyData;
            const instName = user?.institute_name || fm?.Institute?.name || 'Institute Name';
            const instPhone = user?.institute_phone || fm?.Institute?.phone || '';
            const designation = fm.designation || 'Faculty';
            const fName = fm.User?.name || user?.name || '';
            const fEmail = fm.User?.email || user?.email || '';
            const fPhone = fm.User?.phone || user?.phone || 'N/A';
            const joinDate = fm.join_date ? new Date(fm.join_date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : 'N/A';
            
            let teachingText = 'N/A';
            if (fm.Subjects && fm.Subjects.length > 0) {
                teachingText = fm.Subjects.map(s => s.name).join(', ');
            }

            const qrDataUrl = await QRCode.toDataURL(`FACULTY_QR_${fm.id}`, { width: 300, margin: 1 });

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

            doc.save(`${fName}_ID_Card.pdf`);
        } catch (err) {
            alert('Failed to generate PDF: ' + err.message);
        } finally {
            setDownloading(false);
        }
    };

    if (loading) return <div className="dashboard-container">Loading...</div>;

    const qrValue = facultyData ? `FACULTY_QR_${facultyData.id}` : "";

    return (
        <div className="dashboard-container">
            <div className="dashboard-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                    <h1>🤳 My QR Code</h1>
                    <p>Show this static QR code to your Admin to mark attendance.</p>
                </div>
                <button className="btn btn-secondary" onClick={() => navigate("/faculty/dashboard")}>
                    ← Back
                </button>
            </div>

            <div className="card" style={{ padding: "3rem", maxWidth: "540px", margin: "0 auto", textAlign: "center" }}>
                {!facultyData ? (
                    <div style={{ backgroundColor: "#fef2f2", padding: "2rem", borderRadius: "12px", border: "1px solid #ef4444" }}>
                        <h2 style={{ color: "#991b1b", marginBottom: "1rem" }}>🚫 Error</h2>
                        <p style={{ color: "#7f1d1d", fontSize: "1.1rem" }}>
                            Could not load your faculty data.
                        </p>
                    </div>
                ) : (
                    <div>
                        <h2 style={{ marginBottom: "1.5rem", color: "#1f2937" }}>Your Unique ID Code</h2>
                        <div style={{
                            background: "white",
                            padding: "1.5rem",
                            borderRadius: "16px",
                            display: "inline-block",
                            border: "2px solid #e5e7eb",
                            boxShadow: "0 10px 25px rgba(0,0,0,0.1)"
                        }}>
                            <QRCodeSVG
                                value={qrValue}
                                size={250}
                                level={"H"}
                                includeMargin={true}
                            />
                        </div>
                        <p style={{ marginTop: "1.5rem", color: "#4b5563", fontSize: "1.1rem", fontWeight: "bold" }}>
                            {facultyData?.User?.name || user?.name}
                        </p>
                        <p style={{ marginTop: "0.5rem", color: "#6b7280", fontSize: "0.95rem", marginBottom: "1.5rem" }}>
                            This QR code is unique to you and will not change. You can print it or show it directly from your device.
                        </p>
                        <button
                            className="btn btn-primary btn-animated"
                            style={{ display: "inline-flex", alignItems: "center", gap: "0.5rem", padding: "0.75rem 1.5rem" }}
                            onClick={handleDownloadCard}
                            disabled={downloading}
                        >
                            {downloading ? "⏳ Generating PDF..." : "⬇ Download Identity Card"}
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}

export default FacultyQRCode;
