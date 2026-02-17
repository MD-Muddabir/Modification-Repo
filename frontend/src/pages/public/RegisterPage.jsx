/**
 * Public Registration Page
 * Professional registration with validation and plan selection
 */

import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../../services/api";
import "./PublicPages.css";

function RegisterPage() {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [plans, setPlans] = useState([]);
    const [errors, setErrors] = useState({});

    const [formData, setFormData] = useState({
        instituteName: "",
        email: "",
        password: "",
        confirmPassword: "",
        phone: "",
        address: "",
        city: "",
        state: "",
        pincode: "",
        planId: "",
        agreedToTerms: false
    });

    useEffect(() => {
        fetchPlans();
        // Check if plan was pre-selected from pricing page
        const selectedPlan = localStorage.getItem("selectedPlan");
        if (selectedPlan) {
            setFormData(prev => ({ ...prev, planId: selectedPlan }));
        }
    }, []);

    const fetchPlans = async () => {
        try {
            const response = await api.get("/plans");
            const activePlans = response.data.data.filter(plan => plan.status === "active");
            setPlans(activePlans);
        } catch (error) {
            console.error("Error fetching plans:", error);
        }
    };

    const validateForm = () => {
        const newErrors = {};

        // Institute Name
        if (!formData.instituteName.trim()) {
            newErrors.instituteName = "Institute name is required";
        } else if (formData.instituteName.trim().length < 3) {
            newErrors.instituteName = "Institute name must be at least 3 characters";
        }

        // Email
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!formData.email.trim()) {
            newErrors.email = "Email is required";
        } else if (!emailRegex.test(formData.email)) {
            newErrors.email = "Please enter a valid email address";
        }

        // Password
        if (!formData.password) {
            newErrors.password = "Password is required";
        } else if (formData.password.length < 8) {
            newErrors.password = "Password must be at least 8 characters";
        } else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(formData.password)) {
            newErrors.password = "Password must contain uppercase, lowercase, and number";
        }

        // Confirm Password
        if (formData.password !== formData.confirmPassword) {
            newErrors.confirmPassword = "Passwords do not match";
        }

        // Phone
        const phoneRegex = /^[6-9]\d{9}$/;
        if (!formData.phone.trim()) {
            newErrors.phone = "Phone number is required";
        } else if (!phoneRegex.test(formData.phone.replace(/\s/g, ""))) {
            newErrors.phone = "Please enter a valid 10-digit phone number";
        }

        // Address
        if (!formData.address.trim()) {
            newErrors.address = "Address is required";
        }

        // City
        if (!formData.city.trim()) {
            newErrors.city = "City is required";
        }

        // State
        if (!formData.state.trim()) {
            newErrors.state = "State is required";
        }

        // Pincode
        const pincodeRegex = /^\d{6}$/;
        if (!formData.pincode.trim()) {
            newErrors.pincode = "Pincode is required";
        } else if (!pincodeRegex.test(formData.pincode)) {
            newErrors.pincode = "Please enter a valid 6-digit pincode";
        }

        // Plan
        if (!formData.planId) {
            newErrors.planId = "Please select a plan";
        }

        // Terms
        if (!formData.agreedToTerms) {
            newErrors.agreedToTerms = "You must agree to the terms and conditions";
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === "checkbox" ? checked : value
        }));
        // Clear error for this field
        if (errors[name]) {
            setErrors(prev => ({ ...prev, [name]: "" }));
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!validateForm()) {
            return;
        }

        setLoading(true);

        try {
            // Register institute
            const response = await api.post("/auth/register-institute", {
                name: formData.instituteName.trim(),
                email: formData.email.trim().toLowerCase(),
                password: formData.password,
                phone: formData.phone.replace(/\s/g, ""),
                address: formData.address.trim(),
                city: formData.city.trim(),
                state: formData.state.trim(),
                pincode: formData.pincode.trim(),
                plan_id: formData.planId
            });

            if (response.data.success) {
                // Clear selected plan from localStorage
                localStorage.removeItem("selectedPlan");

                // Show success message
                alert("Registration successful! Please complete payment to activate your account.");

                // Redirect to payment page or login
                // For now, redirect to login
                navigate("/login");
            }
        } catch (error) {
            console.error("Registration error:", error);
            if (error.response?.data?.message) {
                if (error.response.data.message.includes("email")) {
                    setErrors({ email: "This email is already registered" });
                } else {
                    alert(error.response.data.message);
                }
            } else {
                alert("Registration failed. Please try again.");
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="register-page">
            {/* Navigation */}
            <nav className="public-nav">
                <div className="container">
                    <div className="nav-content">
                        <Link to="/" className="logo">
                            🎓 <span>EduManage</span>
                        </Link>
                        <div className="nav-links">
                            <Link to="/login" className="btn-secondary">Already have an account? Login</Link>
                        </div>
                    </div>
                </div>
            </nav>

            {/* Registration Form */}
            <section className="register-section">
                <div className="container-small">
                    <div className="register-card">
                        <div className="register-header">
                            <h1>Start Your Free Trial</h1>
                            <p>Create your account and get started in minutes</p>
                        </div>

                        <form onSubmit={handleSubmit} className="register-form">
                            {/* Institute Details */}
                            <div className="form-section">
                                <h3>Institute Information</h3>

                                <div className="form-group">
                                    <label className="form-label">Institute Name *</label>
                                    <input
                                        type="text"
                                        name="instituteName"
                                        className={`form-input ${errors.instituteName ? 'error' : ''}`}
                                        value={formData.instituteName}
                                        onChange={handleChange}
                                        placeholder="Enter your institute name"
                                    />
                                    {errors.instituteName && <span className="error-message">{errors.instituteName}</span>}
                                </div>

                                <div className="form-row">
                                    <div className="form-group">
                                        <label className="form-label">Email *</label>
                                        <input
                                            type="email"
                                            name="email"
                                            className={`form-input ${errors.email ? 'error' : ''}`}
                                            value={formData.email}
                                            onChange={handleChange}
                                            placeholder="institute@example.com"
                                        />
                                        {errors.email && <span className="error-message">{errors.email}</span>}
                                    </div>

                                    <div className="form-group">
                                        <label className="form-label">Phone *</label>
                                        <input
                                            type="tel"
                                            name="phone"
                                            className={`form-input ${errors.phone ? 'error' : ''}`}
                                            value={formData.phone}
                                            onChange={handleChange}
                                            placeholder="9876543210"
                                        />
                                        {errors.phone && <span className="error-message">{errors.phone}</span>}
                                    </div>
                                </div>

                                <div className="form-group">
                                    <label className="form-label">Address *</label>
                                    <textarea
                                        name="address"
                                        className={`form-input ${errors.address ? 'error' : ''}`}
                                        value={formData.address}
                                        onChange={handleChange}
                                        placeholder="Enter complete address"
                                        rows="2"
                                    />
                                    {errors.address && <span className="error-message">{errors.address}</span>}
                                </div>

                                <div className="form-row">
                                    <div className="form-group">
                                        <label className="form-label">City *</label>
                                        <input
                                            type="text"
                                            name="city"
                                            className={`form-input ${errors.city ? 'error' : ''}`}
                                            value={formData.city}
                                            onChange={handleChange}
                                            placeholder="City"
                                        />
                                        {errors.city && <span className="error-message">{errors.city}</span>}
                                    </div>

                                    <div className="form-group">
                                        <label className="form-label">State *</label>
                                        <input
                                            type="text"
                                            name="state"
                                            className={`form-input ${errors.state ? 'error' : ''}`}
                                            value={formData.state}
                                            onChange={handleChange}
                                            placeholder="State"
                                        />
                                        {errors.state && <span className="error-message">{errors.state}</span>}
                                    </div>

                                    <div className="form-group">
                                        <label className="form-label">Pincode *</label>
                                        <input
                                            type="text"
                                            name="pincode"
                                            className={`form-input ${errors.pincode ? 'error' : ''}`}
                                            value={formData.pincode}
                                            onChange={handleChange}
                                            placeholder="123456"
                                            maxLength="6"
                                        />
                                        {errors.pincode && <span className="error-message">{errors.pincode}</span>}
                                    </div>
                                </div>
                            </div>

                            {/* Security */}
                            <div className="form-section">
                                <h3>Security</h3>

                                <div className="form-row">
                                    <div className="form-group">
                                        <label className="form-label">Password *</label>
                                        <input
                                            type="password"
                                            name="password"
                                            className={`form-input ${errors.password ? 'error' : ''}`}
                                            value={formData.password}
                                            onChange={handleChange}
                                            placeholder="Min 8 characters"
                                        />
                                        {errors.password && <span className="error-message">{errors.password}</span>}
                                    </div>

                                    <div className="form-group">
                                        <label className="form-label">Confirm Password *</label>
                                        <input
                                            type="password"
                                            name="confirmPassword"
                                            className={`form-input ${errors.confirmPassword ? 'error' : ''}`}
                                            value={formData.confirmPassword}
                                            onChange={handleChange}
                                            placeholder="Re-enter password"
                                        />
                                        {errors.confirmPassword && <span className="error-message">{errors.confirmPassword}</span>}
                                    </div>
                                </div>
                            </div>

                            {/* Plan Selection */}
                            <div className="form-section">
                                <h3>Choose Your Plan</h3>

                                <div className="form-group">
                                    <label className="form-label">Select Plan *</label>
                                    <select
                                        name="planId"
                                        className={`form-select ${errors.planId ? 'error' : ''}`}
                                        value={formData.planId}
                                        onChange={handleChange}
                                    >
                                        <option value="">-- Select a plan --</option>
                                        {plans.map(plan => (
                                            <option key={plan.id} value={plan.id}>
                                                {plan.name} - ₹{plan.price}/month (Up to {plan.max_students} students)
                                            </option>
                                        ))}
                                    </select>
                                    {errors.planId && <span className="error-message">{errors.planId}</span>}
                                    <small className="form-hint">
                                        Don't see the right plan? <Link to="/pricing">View all plans</Link>
                                    </small>
                                </div>
                            </div>

                            {/* Terms */}
                            <div className="form-section">
                                <div className="form-group checkbox-group">
                                    <label className="checkbox-label">
                                        <input
                                            type="checkbox"
                                            name="agreedToTerms"
                                            checked={formData.agreedToTerms}
                                            onChange={handleChange}
                                        />
                                        <span>
                                            I agree to the <Link to="/terms" target="_blank">Terms of Service</Link> and{" "}
                                            <Link to="/privacy" target="_blank">Privacy Policy</Link>
                                        </span>
                                    </label>
                                    {errors.agreedToTerms && <span className="error-message">{errors.agreedToTerms}</span>}
                                </div>
                            </div>

                            {/* Submit */}
                            <button
                                type="submit"
                                className="btn-primary-large btn-block"
                                disabled={loading}
                            >
                                {loading ? "Creating Account..." : "Create Account & Continue"}
                            </button>

                            <p className="form-footer-text">
                                Already have an account? <Link to="/login">Login here</Link>
                            </p>
                        </form>
                    </div>
                </div>
            </section>
        </div>
    );
}

export default RegisterPage;
