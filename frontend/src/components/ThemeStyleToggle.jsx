/**
 * ThemeStyleToggle
 * A premium sliding toggle that switches between "Simple" and "Pro" themes.
 * Reads / updates ThemeContext's themeStyle.
 */

import { useContext } from "react";
import { ThemeContext } from "../context/ThemeContext";
import "./ThemeStyleToggle.css";

function ThemeStyleToggle() {
    const { themeStyle, toggleThemeStyle } = useContext(ThemeContext);
    const isPro = themeStyle === "pro";

    return (
        <button
            id="theme-style-toggle-btn"
            className={`style-toggle${isPro ? " style-toggle--pro" : ""}`}
            onClick={toggleThemeStyle}
            aria-label={isPro ? "Switch to Simple Theme" : "Switch to Pro Theme"}
            title={isPro ? "Switch to Simple Theme" : "Switch to Pro Theme"}
        >
            {/* Track */}
            <span className="style-toggle__track">
                {/* Simple label inside track */}
                <span className="style-toggle__track-label style-toggle__track-label--simple">
                    ✦
                </span>
                {/* Pro label inside track */}
                <span className="style-toggle__track-label style-toggle__track-label--pro">
                    ⚡
                </span>
                {/* Sliding thumb */}
                <span className="style-toggle__thumb" />
            </span>
            {/* External label */}
            <span className="style-toggle__label">
                {isPro ? "Pro Theme" : "Simple"}
            </span>
        </button>
    );
}

export default ThemeStyleToggle;
