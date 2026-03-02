/**
 * ThemeContext — Simplified & Reliable
 *
 * Manages dark/light + simple/pro theme preferences.
 * - On login:  reads persisted preference from user object (DB) or localStorage
 * - On change: immediately applies CSS classes + saves to localStorage + DB
 * - On logout: resets to default (light, simple)
 */

import { createContext, useState, useEffect, useContext, useCallback } from "react";
import { AuthContext } from "./AuthContext";
import api from "../services/api";

export const ThemeContext = createContext();

// Helper: stable LS key for a user
const darkKey = (u) => u ? `tc_dark_${u.role}_${u.id}` : null;
const styleKey = (u) => u ? `tc_style_${u.role}_${u.id}` : null;

// Helper: apply CSS classes to <html>
const applyClasses = (isDark, style) => {
    const root = document.documentElement;
    isDark ? root.classList.add("dark-mode") : root.classList.remove("dark-mode");
    if (style === "pro") {
        root.classList.add("theme-pro");
        root.classList.remove("theme-simple");
    } else {
        root.classList.add("theme-simple");
        root.classList.remove("theme-pro");
    }
};

export const ThemeProvider = ({ children }) => {
    const { user } = useContext(AuthContext);

    const [isDark, setIsDark] = useState(false);
    const [themeStyle, setThemeStyle] = useState("simple");

    const lsDarkKey = useCallback(() => darkKey(user), [user]);
    const lsStyleKey = useCallback(() => styleKey(user), [user]);

    /* ── Apply CSS classes whenever state changes ── */
    useEffect(() => {
        applyClasses(isDark, themeStyle);
    }, [isDark, themeStyle]);

    /* ── Load preferences when user logs in/out ── */
    useEffect(() => {
        if (!user) {
            // Logged out → reset
            setIsDark(false);
            setThemeStyle("simple");
            return;
        }

        // DB values supplied by the login response
        const dbDark = user.theme_dark ?? false;
        const dbStyle = user.theme_style ?? "simple";

        // Prefer localStorage cache (more recent than DB if user changed while offline)
        const dk = lsDarkKey();
        const sk = lsStyleKey();
        try {
            const lsDark = dk ? localStorage.getItem(dk) : null;
            const lsStyle = sk ? localStorage.getItem(sk) : null;
            const resolvedDark = lsDark !== null ? lsDark === "dark" : dbDark;
            const resolvedStyle = lsStyle !== null ? lsStyle : dbStyle;
            setIsDark(resolvedDark);
            setThemeStyle(resolvedStyle);
        } catch {
            setIsDark(dbDark);
            setThemeStyle(dbStyle);
        }
    }, [user, lsDarkKey, lsStyleKey]);

    /* ── Persist to localStorage + DB ── */
    const persist = async (darkVal, styleVal, currentUser) => {
        if (!currentUser) return;
        // localStorage (sync, instant)
        const dk = darkKey(currentUser);
        const sk = styleKey(currentUser);
        try {
            if (dk) localStorage.setItem(dk, darkVal ? "dark" : "light");
            if (sk) localStorage.setItem(sk, styleVal);
        } catch { /* storage unavailable */ }
        // Database (async, survives logout/login)
        try {
            await api.put("/auth/theme", {
                theme_dark: darkVal,
                theme_style: styleVal,
            });
        } catch (e) {
            console.warn("Theme DB save failed (non-critical):", e.message);
        }
    };

    /* ── Public API ── */

    // Toggle dark ↔ light
    const toggleTheme = () => {
        setIsDark(prev => {
            const next = !prev;
            persist(next, themeStyle, user);
            return next;
        });
    };

    // Toggle simple ↔ pro
    const toggleThemeStyle = () => {
        setThemeStyle(prev => {
            const next = prev === "simple" ? "pro" : "simple";
            persist(isDark, next, user);
            return next;
        });
    };

    // Set both at once (ThemeSelector primary API)
    const setTheme = (darkVal, styleVal) => {
        setIsDark(darkVal);
        setThemeStyle(styleVal);
        persist(darkVal, styleVal, user);
    };

    return (
        <ThemeContext.Provider value={{ isDark, themeStyle, toggleTheme, toggleThemeStyle, setTheme }}>
            {children}
        </ThemeContext.Provider>
    );
};
