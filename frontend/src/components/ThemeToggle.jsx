/**
 * ThemeToggle
 * A premium sliding toggle button that switches between dark and light mode.
 * Reads / updates the global ThemeContext.
 */

import { useContext } from "react";
import { ThemeContext } from "../context/ThemeContext";
import "./ThemeToggle.css";

function ThemeToggle() {
    const { isDark, toggleTheme } = useContext(ThemeContext);

    return (
        <button
            id="theme-toggle-btn"
            className={`theme-toggle${isDark ? " theme-toggle--dark" : ""}`}
            onClick={toggleTheme}
            aria-label={isDark ? "Switch to Light Mode" : "Switch to Dark Mode"}
            title={isDark ? "Switch to Light Mode" : "Switch to Dark Mode"}
        >
            {/* Track */}
            <span className="theme-toggle__track">
                {/* Sun icon (light) */}
                <span className="theme-toggle__icon theme-toggle__icon--sun">☀️</span>
                {/* Moon icon (dark) */}
                <span className="theme-toggle__icon theme-toggle__icon--moon">🌙</span>
                {/* Sliding thumb */}
                <span className="theme-toggle__thumb" />
            </span>
            {/* Label */}
            <span className="theme-toggle__label">
                {isDark ? "Dark Mode" : "Light Mode"}
            </span>
        </button>
    );
}

export default ThemeToggle;
