/**
 * InstituteLogo Component
 * Displays the institute logo in the dashboard header (top-left blue nav area).
 * Fetches logo from auth context (institute_logo) which is populated at login/profile.
 * Falls back gracefully to a styled abbreviation if no logo is set.
 */

import { useContext, useState } from "react";
import { AuthContext } from "../../context/AuthContext";
import "./InstituteLogo.css";

function InstituteLogo({ size = "md" }) {
    const { user } = useContext(AuthContext);
    const [imgError, setImgError] = useState(false);

    let logoUrl = user?.institute_logo;

    // Resolve relative URL using the environment's backend server URL
    if (logoUrl && logoUrl.startsWith("/")) {
        const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:5000/api";
        const backendBase = apiUrl.replace(/\/api\/?$/, ""); // strip /api
        logoUrl = `${backendBase}${logoUrl}`;
    }

    const name = user?.institute_name || user?.name || "I";
    // Get first two initials for the fallback
    const initials = name
        .split(" ")
        .filter(Boolean)
        .slice(0, 2)
        .map((w) => w[0].toUpperCase())
        .join("");

    const sizeClass = `inst-logo--${size}`;

    if (logoUrl && !imgError) {
        return (
            <div className={`inst-logo ${sizeClass}`} title={name}>
                <img
                    src={logoUrl}
                    alt={`${name} logo`}
                    className="inst-logo__img"
                    onError={() => setImgError(true)}
                />
            </div>
        );
    }

    // Fallback: gradient circle with initials
    return (
        <div className={`inst-logo inst-logo--fallback ${sizeClass}`} title={name}>
            <span className="inst-logo__initials">{initials || "🏫"}</span>
        </div>
    );
}

export default InstituteLogo;
