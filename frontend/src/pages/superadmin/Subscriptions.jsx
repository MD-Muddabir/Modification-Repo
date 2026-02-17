/**
 * Super Admin - Subscriptions Management
 * Manage all institute subscriptions
 */

import { useState, useEffect } from "react";
import api from "../../services/api";
import BackButton from "../../components/common/BackButton";
import "../admin/Dashboard.css";

function Subscriptions() {
    const [subscriptions, setSubscriptions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [statusFilter, setStatusFilter] = useState("all");

    useEffect(() => {
        fetchSubscriptions();
    }, [statusFilter]);

    const fetchSubscriptions = async () => {
        setLoading(true);
        try {
            const params = statusFilter !== "all" ? `?status=${statusFilter}` : "";
            const response = await api.get(`/subscriptions${params}`);
            // API returns: { success: true, data: { subscriptions: [...], pagination: {...} } }
            setSubscriptions(response.data.data?.subscriptions || []);
        } catch (error) {
            console.error("Error fetching subscriptions:", error);
            setSubscriptions([]); // Set empty array on error
        } finally {
            setLoading(false);
        }
    };

    const handleUpdateStatus = async (subscriptionId, newStatus) => {
        if (!window.confirm(`Are you sure you want to mark this subscription as ${newStatus}?`)) {
            return;
        }

        try {
            await api.patch(`/subscriptions/${subscriptionId}/status`, {
                payment_status: newStatus
            });
            alert(`Subscription status updated to ${newStatus}`);
            fetchSubscriptions();
        } catch (error) {
            console.error("Error updating subscription:", error);
            alert("Failed to update subscription status");
        }
    };

    if (loading) {
        return <div className="dashboard-container">Loading...</div>;
    }

    return (
        <div className="dashboard-container">
            <div className="dashboard-header">
                <div>
                    <h1>💳 Subscriptions Management</h1>
                    <p>Track and manage institute subscriptions</p>
                </div>
                <BackButton />
            </div>

            {/* Filters */}
            <div className="filters-section" style={{ marginBottom: "1.5rem" }}>
                <select
                    className="form-select"
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    style={{ padding: "0.5rem", borderRadius: "0.375rem", border: "1px solid #d1d5db" }}
                >
                    <option value="all">All Status</option>
                    <option value="paid">Paid</option>
                    <option value="pending">Pending</option>
                    <option value="failed">Failed</option>
                </select>
            </div>

            {/* Subscriptions Table */}
            <div className="card">
                <div className="table-container">
                    <table className="table">
                        <thead>
                            <tr>
                                <th>ID</th>
                                <th>Institute</th>
                                <th>Plan</th>
                                <th>Amount</th>
                                <th>Period</th>
                                <th>Status</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {subscriptions.length === 0 ? (
                                <tr>
                                    <td colSpan="7" style={{ textAlign: "center", padding: "2rem" }}>
                                        No subscription records found
                                    </td>
                                </tr>
                            ) : (
                                subscriptions.map((sub) => (
                                    <tr key={sub.id}>
                                        <td>#{sub.id}</td>
                                        <td>
                                            <div>
                                                <strong>{sub.Institute?.name || "Unknown"}</strong>
                                                <div style={{ fontSize: "0.75rem", color: "#6b7280" }}>
                                                    {sub.Institute?.email}
                                                </div>
                                            </div>
                                        </td>
                                        <td>{sub.Plan?.name || "Custom Plan"}</td>
                                        <td>₹{sub.amount_paid}</td>
                                        <td>
                                            {new Date(sub.start_date).toLocaleDateString()} -{" "}
                                            {new Date(sub.end_date).toLocaleDateString()}
                                        </td>
                                        <td>
                                            <span className={`badge badge-${sub.payment_status === 'paid' ? 'success' :
                                                sub.payment_status === 'pending' ? 'warning' : 'danger'
                                                }`}>
                                                {sub.payment_status}
                                            </span>
                                        </td>
                                        <td>
                                            {sub.payment_status === "pending" && (
                                                <button
                                                    className="btn btn-sm btn-success"
                                                    onClick={() => handleUpdateStatus(sub.id, "paid")}
                                                    style={{ marginRight: "0.5rem" }}
                                                >
                                                    Mark Paid
                                                </button>
                                            )}
                                            {sub.payment_status !== "failed" && sub.payment_status !== "paid" && (
                                                <button
                                                    className="btn btn-sm btn-danger"
                                                    onClick={() => handleUpdateStatus(sub.id, "failed")}
                                                >
                                                    Mark Failed
                                                </button>
                                            )}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}

export default Subscriptions;
