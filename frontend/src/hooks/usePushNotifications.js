/**
 * usePushNotifications — Phase 5 & 6: Safe push notification setup.
 *
 * ► Requests permission (iOS prompts user; Android grants silently).
 * ► Sets up listeners: registration token, notification received, action performed.
 * ► Stores FCM token in Preferences + localStorage for backend registration.
 * ► Deep-linking on notification tap (Phase 6): reads data.route from payload.
 *
 * IMPORTANT — CRASH PREVENTION:
 *   PushNotifications.register() is intentionally NOT called here.
 *   Calling register() without a valid google-services.json / Firebase setup
 *   WILL crash the Android runtime. Uncomment the register() block ONLY after
 *   placing google-services.json in android/app/ and rebuilding.
 *
 * Safe on web: returns early if not a native platform.
 */

import { useEffect } from "react";
import { Capacitor } from "@capacitor/core";

const IS_NATIVE = Capacitor.isNativePlatform();
const FCM_TOKEN_KEY = "fcm_device_token";

export function usePushNotifications() {
    useEffect(() => {
        if (!IS_NATIVE) return;

        let cleanupFn = null;

        const setup = async () => {
            let PushNotifications, Preferences;

            /* ── Dynamic import — avoids web-bundle bloat ────────────────── */
            try {
                ({ PushNotifications } = await import("@capacitor/push-notifications"));
                ({ Preferences } = await import("@capacitor/preferences"));
            } catch {
                // Plugin not bundled — non-fatal
                return;
            }

            /* ── Phase 5: Check & request permission ─────────────────────── */
            let perm;
            try {
                perm = await PushNotifications.checkPermissions();
            } catch {
                return; // Plugin not available on this device / emulator
            }

            if (perm.receive !== "granted") {
                try {
                    perm = await PushNotifications.requestPermissions();
                } catch {
                    return;
                }
            }

            if (perm.receive !== "granted") {
                console.warn("[Push] Permission denied by user — skipping setup.");
                return;
            }

            /* ── Phase 5: Listener — registration token ──────────────────── */
            await PushNotifications.addListener("registration", async (token) => {
                const value = token?.value;
                if (!value) return;

                try { await Preferences.set({ key: FCM_TOKEN_KEY, value }); } catch { }
                try { localStorage.setItem(FCM_TOKEN_KEY, value); } catch { }

                console.info("[Push] FCM token captured and stored.");

                // Dispatch event so auth/profile services can register with backend
                window.dispatchEvent(
                    new CustomEvent("push_token_ready", { detail: { token: value } })
                );
            }).catch(() => {});

            /* ── Phase 5: Listener — registration error ──────────────────── */
            await PushNotifications.addListener("registrationError", (err) => {
                console.warn("[Push] Registration error:", JSON.stringify(err));
            }).catch(() => {});

            /* ── Phase 5: Listener — notification received while app open ── */
            await PushNotifications.addListener("pushNotificationReceived", (notification) => {
                console.info("[Push] Notification received:", notification?.title);

                // Dispatch for any component that wants to react (e.g. show in-app banner)
                window.dispatchEvent(
                    new CustomEvent("push_notification_received", { detail: notification })
                );
            }).catch(() => {});

            /* ── Phase 6: Listener — notification tapped (deep linking) ───── */
            await PushNotifications.addListener("pushNotificationActionPerformed", (action) => {
                const data = action?.notification?.data;
                if (!data) return;

                // Deep link: payload should include { route: '/some/path' }
                const route = data.route || data.url;
                if (route && typeof route === "string") {
                    try {
                        const path = route.startsWith("http")
                            ? new URL(route).pathname
                            : route;
                        window.history.pushState({}, "", path);
                        window.dispatchEvent(new PopStateEvent("popstate"));
                    } catch {
                        // Malformed route — ignore
                    }
                }
            }).catch(() => {});

            /* ── Phase 5/6: Register with FCM / APNs ────────────────────────
             *
             *   ⚠ UNCOMMENT ONLY after placing google-services.json in
             *     frontend/android/app/ and rebuilding the project.
             *
             *   Without Firebase configuration this WILL crash the native runtime.
             *
             * try {
             *     await PushNotifications.register();
             * } catch (err) {
             *     console.warn("[Push] register() failed — Firebase not configured:", err?.message);
             * }
             */

            /* ── Cleanup reference for useEffect teardown ─────────────────── */
            cleanupFn = async () => {
                try {
                    await PushNotifications.removeAllListeners();
                } catch { }
            };
        };

        setup().catch((err) => {
            console.warn("[Push] Setup error:", err?.message);
        });

        return () => {
            cleanupFn?.();
        };
    }, []); // eslint-disable-line react-hooks/exhaustive-deps
}

/** Utility: read the stored FCM token synchronously (from localStorage). */
export function getStoredPushToken() {
    try {
        return localStorage.getItem(FCM_TOKEN_KEY) ?? null;
    } catch {
        return null;
    }
}
