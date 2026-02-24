import { useState, useEffect, useContext } from "react";
import { Link } from "react-router-dom";
import api from "../../services/api";
import { AuthContext } from "../../context/AuthContext";
import "../admin/Dashboard.css";

function PayFees() {
    const { user } = useContext(AuthContext);
    const [feeStructures, setFeeStructures] = useState([]);
    const [payments, setPayments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedFee, setSelectedFee] = useState(null);
    const [showModal, setShowModal] = useState(false);
    const [paymentAmount, setPaymentAmount] = useState("");
    const [error, setError] = useState("");
    const [studentId, setStudentId] = useState(null);
    const [totalPaid, setTotalPaid] = useState(0);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            setLoading(true);

            // First get the student profile
            const meRes = await api.get('/students/me');
            const myStudentId = meRes.data.data.id;
            setStudentId(myStudentId);

            // Fetch Fee Structures applicable to the student's classes
            const structuresRes = await api.get('/fees/structure');
            const structures = structuresRes.data.data;
            setFeeStructures(structures);

            // Fetch Student's own payments
            const paymentRes = await api.get(`/fees/payment/${myStudentId}`);
            setPayments(paymentRes.data.data.payments);
            setTotalPaid(paymentRes.data.data.total_paid);

        } catch (err) {
            console.error(err);
            setError("Failed to load fee information.");
        } finally {
            setLoading(false);
        }
    };

    const handlePayClick = (fee) => {
        setSelectedFee(fee);
        setPaymentAmount(fee.amount); // Default to full amount
        setShowModal(true);
    };

    const handleMockPaymentSubmit = async (e) => {
        e.preventDefault();
        try {
            // Simulated fake gateway wait
            await new Promise(resolve => setTimeout(resolve, 800));

            await api.post("/fees/pay", {
                student_id: studentId,
                amount: parseFloat(paymentAmount),
                payment_method: "Credit Card",
                remarks: `Payment for ${selectedFee.fee_type}`
            });
            alert("Payment Successful!");

            setShowModal(false);
            setPaymentAmount("");
            setSelectedFee(null);
            fetchData();
        } catch (err) {
            alert(err.response?.data?.message || "Payment Failed.");
        }
    };

    if (loading) return <div className="dashboard-container">Loading...</div>;

    const safeTotalPaid = totalPaid || 0;
    const totalRequired = feeStructures.reduce((sum, fee) => sum + (parseFloat(fee.amount) || 0), 0);
    const balanceDue = totalRequired - safeTotalPaid;

    return (
        <div className="dashboard-container">
            <div className="dashboard-header">
                <div>
                    <h1>💳 Pay Fees</h1>
                    <p>View your fee structures and make online payments</p>
                </div>
                <div style={{ display: "flex", gap: "10px" }}>
                    <Link to="/student/dashboard" className="btn btn-secondary">
                        ← Back
                    </Link>
                </div>
            </div>

            {error && <div style={{ color: "red", padding: "10px", marginBottom: "1rem", backgroundColor: "#ffebeb", borderRadius: "5px" }}>{error}</div>}

            <div className="stats-grid" style={{ marginBottom: "2rem" }}>
                <div className="stat-card">
                    <div className="stat-icon">📈</div>
                    <div className="stat-content">
                        <h3>${totalRequired.toFixed(2)}</h3>
                        <p>Total Fees Assigned</p>
                    </div>
                </div>
                <div className="stat-card">
                    <div className="stat-icon">💰</div>
                    <div className="stat-content">
                        <h3>${safeTotalPaid.toFixed(2)}</h3>
                        <p>Total Paid</p>
                    </div>
                </div>
                <div className="stat-card">
                    <div className="stat-icon">⚠️</div>
                    <div className="stat-content">
                        <h3 style={{ color: balanceDue > 0 ? "red" : "green" }}>
                            ${Math.max(0, balanceDue).toFixed(2)}
                        </h3>
                        <p>Balance Due</p>
                    </div>
                </div>
            </div>

            <div className="card" style={{ marginBottom: "2rem" }}>
                <div className="card-header">
                    <h3 className="card-title">Pending Fee Structures</h3>
                </div>
                <div className="table-container">
                    <table className="table">
                        <thead>
                            <tr>
                                <th>Fee Type</th>
                                <th>Description</th>
                                <th>Due Date</th>
                                <th>Amount</th>
                                <th>Status</th>
                                <th>Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            {feeStructures.length === 0 ? (
                                <tr>
                                    <td colSpan="6" style={{ textAlign: "center", padding: "2rem" }}>
                                        No fees assigned to your classes yet.
                                    </td>
                                </tr>
                            ) : (
                                feeStructures.map((fee) => {
                                    return (
                                        <tr key={fee.id}>
                                            <td><strong>{fee.fee_type}</strong></td>
                                            <td>{fee.description || "-"}</td>
                                            <td>{new Date(fee.due_date).toLocaleDateString()}</td>
                                            <td>${parseFloat(fee.amount).toFixed(2)}</td>
                                            <td>
                                                <span className="badge badge-secondary">Assigned</span>
                                            </td>
                                            <td>
                                                <button
                                                    onClick={() => handlePayClick(fee)}
                                                    className="btn btn-sm btn-primary"
                                                >
                                                    Pay Now
                                                </button>
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            <div className="card">
                <div className="card-header">
                    <h3 className="card-title">Payment History</h3>
                </div>
                <div className="table-container">
                    <table className="table">
                        <thead>
                            <tr>
                                <th>Transaction ID</th>
                                <th>Date</th>
                                <th>Method</th>
                                <th>Amount Paid</th>
                                <th>Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            {payments.length === 0 ? (
                                <tr>
                                    <td colSpan="5" style={{ textAlign: "center", padding: "2rem" }}>
                                        No payment history found.
                                    </td>
                                </tr>
                            ) : (
                                payments.map((payment) => (
                                    <tr key={payment.id}>
                                        <td>
                                            <span className="badge badge-secondary">{payment.transaction_id}</span>
                                        </td>
                                        <td>{new Date(payment.payment_date).toLocaleDateString()}</td>
                                        <td>{payment.payment_method}</td>
                                        <td><strong>${parseFloat(payment.amount_paid).toFixed(2)}</strong></td>
                                        <td>
                                            <span className={`badge ${payment.status === 'success' ? 'badge-success' : 'badge-danger'}`}>
                                                {payment.status}
                                            </span>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Payment Modal */}
            {showModal && (
                <div className="modal-overlay" onClick={() => setShowModal(false)}>
                    <div className="modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: "400px" }}>
                        <div className="modal-header">
                            <h3>💳 Secure Checkout</h3>
                            <button onClick={() => setShowModal(false)} className="btn btn-sm">×</button>
                        </div>
                        <div className="modal-body">
                            <form onSubmit={handleMockPaymentSubmit}>
                                <div className="form-group">
                                    <label className="form-label">Fee Details</label>
                                    <input
                                        type="text"
                                        className="form-input"
                                        value={selectedFee?.fee_type || ""}
                                        disabled
                                    />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Amount (USD) *</label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        className="form-input"
                                        value={paymentAmount}
                                        onChange={e => setPaymentAmount(e.target.value)}
                                        required
                                        min="1"
                                    />
                                </div>
                                <div className="form-group" style={{ marginTop: "15px" }}>
                                    <label className="form-label">Select Payment Method</label>
                                    <select className="form-select">
                                        <option>Credit / Debit Card</option>
                                        <option>UPI</option>
                                        <option>Bank Transfer</option>
                                    </select>
                                </div>
                                <div className="modal-footer" style={{ marginTop: "20px" }}>
                                    <button type="button" onClick={() => setShowModal(false)} className="btn btn-secondary">
                                        Cancel
                                    </button>
                                    <button type="submit" className="btn btn-primary" style={{ backgroundColor: "#10b981", borderColor: "#10b981" }}>
                                        Pay ${paymentAmount}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default PayFees;
