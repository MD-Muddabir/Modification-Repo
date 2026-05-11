/**
 * MobileAppInit — Phase 7: Unified mobile initialization component.
 *
 * This is the SINGLE component that orchestrates ALL mobile-specific setup:
 *   • Phase 1 + 2 — CSS loading + programmatic splash control (useMobileInit)
 *   • Phase 5 + 6 — Push notification permission + deep linking (usePushNotifications)
 *
 * How to use — place it ONCE inside <AuthProvider> in App.jsx:
 *   <MobileAppInit />
 *
 * Renders null — purely functional, no DOM output.
 * Web builds: both hooks are no-ops on non-native platforms.
 */

import { useMobileInit } from "../hooks/useMobileInit";
import { usePushNotifications } from "../hooks/usePushNotifications";

function MobileAppInit() {
    useMobileInit();        // Phase 1 + 2
    usePushNotifications(); // Phase 5 + 6
    return null;
}

export default MobileAppInit;
