import { Link } from "react-router-dom";
import ThemeSelector from "../ThemeSelector";
import "../../pages/public/Public.css";

const PublicNavbar = () => {
    return (
        <nav className="public-navbar">
            <Link to="/" className="nav-brand">
                🎓 Student SaaS
            </Link>
            <div className="nav-links">
                <Link to="/" className="nav-link">Home</Link>
                <Link to="/features" className="nav-link">Features</Link>
                <Link to="/pricing" className="nav-link">Pricing</Link>
                <Link to="/about" className="nav-link">About</Link>
                <Link to="/contact" className="nav-link">Contact</Link>

                {/* ── Theme Selector ── */}
                <div className="nav-theme-controls">
                    <ThemeSelector />
                </div>

                <Link to="/login" className="nav-link nav-login-link">Login</Link>
                <Link to="/register" className="nav-btn">Get Started</Link>
            </div>
        </nav>
    );
};

export default PublicNavbar;
