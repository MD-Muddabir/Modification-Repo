/**
 * Pricing Page - Dynamic Plan Loading with Lifetime Access Card
 */

import { useState, useEffect, useContext } from "react";
import { Link, useNavigate } from "react-router-dom";
import { AuthContext } from "../../context/AuthContext";
import api from "../../services/api";
import PublicNavbar from "../../components/layout/PublicNavbar";
import "./PublicPages.css";

function PricingPage() {
    const navigate = useNavigate();
    const { user } = useContext(AuthContext);
    const [plans, setPlans] = useState([]);
    const [lifetimePlan, setLifetimePlan] = useState(null);
    const [loading, setLoading] = useState(true);
    const [billingCycle, setBillingCycle] = useState("monthly");

    useEffect(() => {
        fetchPlans();
        fetchLifetimePlan();
    }, []);

    const fetchPlans = async () => {
        try {
            const response = await api.get("/plans");
            const activePlans = response.data.data.filter(plan => plan.status === "active" && !plan.is_lifetime);
            setPlans(activePlans);
        } catch (error) {
            console.error("Error fetching plans:", error);
        } finally {
            setLoading(false);
        }
    };

    const fetchLifetimePlan = async () => {
        try {
            const response = await api.get("/lifetime/info");
            if (response.data.success) {
                setLifetimePlan(response.data.plan);
            }
        } catch (error) {
            // Lifetime plan may not be configured yet
            console.log("No lifetime plan available");
        }
    };

    const handleChoosePlan = (planId) => {
        if (user && user.role === 'admin') {
            navigate(`/checkout?plan_id=${planId}`);
        } else {
            localStorage.setItem("selectedPlan", planId);
            navigate("/register");
        }
    };

    const handleChooseLifetime = () => {
        if (user && user.role === 'admin') {
            navigate('/billing?tab=lifetime');
        } else {
            navigate("/register?intent=lifetime");
        }
    };

    const getPlanFeatures = (plan) => {
        const features = [];
        if (plan.feature_students) features.push(`Up to ${plan.max_students} students`);
        if (plan.feature_faculty) features.push("Faculty management");
        if (plan.feature_attendance) features.push("Attendance tracking");
        if (plan.feature_fees) features.push("Fee management");
        if (plan.feature_exams) features.push("Examination management");
        if (plan.feature_timetable) features.push("Master timetable generation");
        if (plan.feature_reports) features.push("Reports & analytics");
        if (plan.feature_sms) features.push("SMS notifications");
        if (plan.feature_email) features.push("Email notifications");
        if (plan.feature_parent_portal) features.push("Parent portal");
        if (plan.feature_mobile_app) features.push("Mobile app access");
        if (plan.feature_api_access) features.push("API access");
        return features;
    };

    const isEnterprisePlan = (plan) => {
        return plan.name.toLowerCase().includes("enterprise") || plan.max_students >= 1000;
    };

    const LifetimeFeatures = [
        "✅ Unlimited students & faculty",
        "✅ All premium features unlocked forever",
        "✅ Advanced attendance & biometric",
        "✅ Full finance & salary management",
        "✅ Custom branding & mobile app",
        "✅ API access & multi-branch",
        "✅ Priority support (24/7)",
        "✅ Free future feature updates",
        "✅ Custom subdomain",
        "✅ No monthly/yearly fees — ever",
    ];

    if (loading) {
        return (
            <div className="pricing-page">
                <div className="container">
                    <div className="loading-state">Loading plans...</div>
                </div>
            </div>
        );
    }

    return (
        <div className="pricing-page">
            {/* Navigation */}
            <PublicNavbar />

            {/* Pricing Header */}
            <section className="pricing-header">
                <div className="container">
                    <h1 className="page-title">Simple, Transparent Pricing</h1>
                    <p className="page-subtitle">Choose the perfect plan for your coaching center</p>

                    {/* Billing Toggle */}
                    <div className="billing-toggle">
                        <button
                            className={billingCycle === "monthly" ? "active" : ""}
                            onClick={() => setBillingCycle("monthly")}
                        >
                            Monthly
                        </button>
                        <button
                            className={billingCycle === "yearly" ? "active" : ""}
                            onClick={() => setBillingCycle("yearly")}
                        >
                            Yearly <span className="discount-badge">Save 20%</span>
                        </button>
                    </div>
                </div>
            </section>

            {/* ── Lifetime Access Premium Banner ── */}
            {lifetimePlan && (
                <section style={{ padding: '0 0 2rem' }}>
                    <div className="container">
                        <div style={{
                            background: 'linear-gradient(135deg, #1a0533 0%, #3b0764 40%, #4c1d95 70%, #7c3aed 100%)',
                            borderRadius: '20px',
                            padding: '3rem',
                            color: '#fff',
                            position: 'relative',
                            overflow: 'hidden',
                            border: '1px solid rgba(167,139,250,0.3)',
                            boxShadow: '0 20px 60px rgba(124,58,237,0.4)'
                        }}>
                            {/* Decorative sparkles */}
                            <div style={{ position: 'absolute', top: 20, right: 30, fontSize: 40, opacity: 0.15 }}>💎</div>
                            <div style={{ position: 'absolute', bottom: 20, right: 80, fontSize: 60, opacity: 0.1 }}>⭐</div>

                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '2rem', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                                {/* Left: Info */}
                                <div style={{ flex: '1', minWidth: '280px' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                                        <span style={{ fontSize: '2.5rem' }}>💎</span>
                                        <div>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                                <h2 style={{ margin: 0, fontSize: '1.8rem', fontWeight: 800 }}>Lifetime Access</h2>
                                                {lifetimePlan.is_founding_available && (
                                                    <span style={{ background: '#f59e0b', color: '#000', fontSize: '11px', fontWeight: 700, padding: '3px 10px', borderRadius: '20px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                                                        🌟 Founding Member
                                                    </span>
                                                )}
                                            </div>
                                            <p style={{ margin: '4px 0 0', color: '#c4b5fd', fontSize: '14px' }}>
                                                Pay once. Use forever. No subscriptions.
                                            </p>
                                        </div>
                                    </div>

                                    {/* Urgency: slots */}
                                    <div style={{ background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.4)', borderRadius: '10px', padding: '10px 16px', marginBottom: '20px', display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
                                        <span style={{ fontSize: '16px' }}>⚡</span>
                                        <span style={{ fontSize: '13px', color: '#fca5a5', fontWeight: 600 }}>
                                            Only <strong style={{ color: '#fff' }}>{lifetimePlan.slots_remaining}</strong> slots remaining out of {lifetimePlan.lifetime_slots_total}!
                                        </span>
                                    </div>

                                    {/* Features grid */}
                                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '6px' }}>
                                        {LifetimeFeatures.map((f, i) => (
                                            <div key={i} style={{ fontSize: '14px', color: '#e9d5ff', padding: '4px 0' }}>{f}</div>
                                        ))}
                                    </div>
                                </div>

                                {/* Right: Price + CTA */}
                                <div style={{ minWidth: '220px', textAlign: 'center', background: 'rgba(255,255,255,0.07)', borderRadius: '16px', padding: '2rem', border: '1px solid rgba(255,255,255,0.15)', backdropFilter: 'blur(10px)' }}>
                                    {lifetimePlan.is_founding_available && (
                                        <div style={{ textDecoration: 'line-through', color: '#a78bfa', fontSize: '18px', marginBottom: '4px' }}>
                                            ₹{lifetimePlan.standard_price?.toLocaleString('en-IN') || '24,999'}
                                        </div>
                                    )}
                                    <div style={{ fontSize: '3rem', fontWeight: 900, color: '#fff', lineHeight: 1 }}>
                                        ₹{lifetimePlan.current_price?.toLocaleString('en-IN') || '19,999'}
                                    </div>
                                    <div style={{ color: '#c4b5fd', fontSize: '14px', marginBottom: '6px' }}>one-time payment</div>
                                    {lifetimePlan.is_founding_available && (
                                        <div style={{ background: '#f59e0b', color: '#000', borderRadius: '8px', padding: '6px', fontSize: '12px', fontWeight: 700, marginBottom: '16px' }}>
                                            🌟 FOUNDING PRICE — Save ₹{((lifetimePlan.standard_price || 24999) - lifetimePlan.current_price).toLocaleString('en-IN')}
                                        </div>
                                    )}
                                    <button
                                        id="btn-get-lifetime-access"
                                        onClick={handleChooseLifetime}
                                        style={{
                                            width: '100%',
                                            background: 'linear-gradient(135deg, #f59e0b, #d97706)',
                                            color: '#000',
                                            fontWeight: 800,
                                            fontSize: '16px',
                                            padding: '14px 24px',
                                            borderRadius: '12px',
                                            border: 'none',
                                            cursor: 'pointer',
                                            boxShadow: '0 8px 24px rgba(245,158,11,0.4)',
                                            transition: 'transform 0.2s, box-shadow 0.2s',
                                            letterSpacing: '0.3px'
                                        }}
                                        onMouseOver={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 12px 32px rgba(245,158,11,0.5)'; }}
                                        onMouseOut={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 8px 24px rgba(245,158,11,0.4)'; }}
                                    >
                                        💎 Get Lifetime Access
                                    </button>
                                    <div style={{ color: '#9ca3af', fontSize: '12px', marginTop: '10px' }}>
                                        🔒 Secure payment via Razorpay
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>
            )}

            {/* Plans Grid */}
            <section className="plans-section">
                <div className="container">
                    {lifetimePlan && (
                        <h2 style={{ textAlign: 'center', marginBottom: '1rem', fontSize: '1.4rem', color: 'var(--text-secondary, #6b7280)' }}>
                            Or choose a subscription plan:
                        </h2>
                    )}
                    {plans.length === 0 ? (
                        <div className="no-plans">
                            <p>No plans available at the moment. Please contact us for custom pricing.</p>
                            <Link to="/contact" className="btn-primary">Contact Sales</Link>
                        </div>
                    ) : (
                        <div className="plans-grid">
                            {plans.map((plan) => (
                                <div
                                    key={plan.id}
                                    className={`plan-card ${plan.is_popular ? 'popular' : ''}`}
                                >
                                    {plan.is_popular && <div className="popular-badge">Most Popular</div>}

                                    <div className="plan-header">
                                        <h3 className="plan-name">{plan.name}</h3>
                                        <div className="plan-price">
                                            <span className="currency">₹</span>
                                            <span className="amount">
                                                {billingCycle === "yearly"
                                                    ? Math.floor(plan.price * 12 * 0.8)
                                                    : plan.price}
                                            </span>
                                            <span className="period">
                                                /{billingCycle === "yearly" ? "year" : "month"}
                                            </span>
                                        </div>
                                        <p className="plan-description">{plan.description}</p>
                                    </div>

                                    <div className="plan-features">
                                        <ul>
                                            {getPlanFeatures(plan).map((feature, index) => (
                                                <li key={index}>
                                                    <span className="check-icon">✓</span>
                                                    {feature}
                                                </li>
                                            ))}
                                        </ul>
                                    </div>

                                    <div className="plan-cta">
                                        {isEnterprisePlan(plan) ? (
                                            <Link to="/contact" className="btn-outline">
                                                Contact Sales
                                            </Link>
                                        ) : (
                                            <button
                                                className={`btn-plan ${plan.is_popular ? 'btn-primary' : 'btn-outline'}`}
                                                onClick={() => handleChoosePlan(plan.id)}
                                            >
                                                Choose {plan.name}
                                            </button>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </section>

            {/* FAQ Section */}
            <section className="faq-section">
                <div className="container">
                    <h2 className="section-title">Frequently Asked Questions</h2>
                    <div className="faq-grid">
                        <div className="faq-item">
                            <h3>Can I change my plan later?</h3>
                            <p>Yes! You can upgrade or downgrade your plan at any time. Changes take effect immediately.</p>
                        </div>
                        <div className="faq-item">
                            <h3>Is there a free trial?</h3>
                            <p>Yes, all plans come with a 14-day free trial. No credit card required.</p>
                        </div>
                        <div className="faq-item">
                            <h3>What payment methods do you accept?</h3>
                            <p>We accept all major credit/debit cards, UPI, net banking, and digital wallets.</p>
                        </div>
                        <div className="faq-item">
                            <h3>What does Lifetime Access include?</h3>
                            <p>Lifetime Access gives you all features forever with unlimited students & faculty — no monthly fees, ever. Founding member spots are limited.</p>
                        </div>
                        <div className="faq-item">
                            <h3>Is my data secure?</h3>
                            <p>Absolutely! We use bank-level encryption and automated backups to keep your data safe.</p>
                        </div>
                        <div className="faq-item">
                            <h3>Is lifetime access really forever?</h3>
                            <p>Yes. A one-time payment gives you access to all current and future features with no hidden renewal charges.</p>
                        </div>
                    </div>
                </div>
            </section>

            {/* CTA Section */}
            <section className="pricing-cta-section">
                <div className="container">
                    <h2>Still have questions?</h2>
                    <p>Our team is here to help you choose the right plan</p>
                    <Link to="/contact" className="btn-primary-large">Contact Us</Link>
                </div>
            </section>

            {/* Footer */}
            <footer className="public-footer">
                <div className="container">
                    <div className="footer-grid">
                        <div className="footer-col">
                            <h4>ZF Solution</h4>
                            <p>Professional coaching center management software</p>
                        </div>
                        <div className="footer-col">
                            <h4>Product</h4>
                            <Link to="/features">Features</Link>
                            <Link to="/pricing">Pricing</Link>
                            <Link to="/about">About Us</Link>
                        </div>
                        <div className="footer-col">
                            <h4>Support</h4>
                            <Link to="/contact">Contact</Link>
                            <Link to="/terms">Terms of Service</Link>
                            <Link to="/privacy">Privacy Policy</Link>
                        </div>
                        <div className="footer-col">
                            <h4>Connect</h4>
                            <a href="mailto:support@zfsolution.com">support@zfsolution.com</a>
                            <a href="tel:+911234567890">+91 123 456 7890</a>
                        </div>
                    </div>
                    <div className="footer-bottom">
                        <p>&copy; 2026 ZF Solution. All rights reserved.</p>
                    </div>
                </div>
            </footer>
        </div>
    );
}

export default PricingPage;
