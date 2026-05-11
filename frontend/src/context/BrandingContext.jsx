/**
 * BrandingContext — Global multi-tenant branding state.
 *
 * Provides branding (logo, name, color) to Login, SplashOverlay, and any
 * other component that needs institute identity.
 *
 * Mount OUTSIDE AuthProvider in App.jsx so branding outlives auth state.
 */

import { createContext, useContext } from "react";
import { useBranding, DEFAULT_BRANDING } from "../hooks/useBranding";

export const BrandingContext = createContext({
    ...DEFAULT_BRANDING,
    setBranding:   () => {},
    clearBranding: () => {},
});

export function BrandingProvider({ children }) {
    const branding = useBranding();
    return (
        <BrandingContext.Provider value={branding}>
            {children}
        </BrandingContext.Provider>
    );
}

/** Convenience hook */
export function useBrandingContext() {
    return useContext(BrandingContext);
}
