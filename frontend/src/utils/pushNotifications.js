/**
 * pushNotifications.js — Phase 5 & 6: Safe push notification helpers.
 *
 * This module exports standalone utility functions.
 * For React integration, use the `usePushNotifications` hook instead.
 *
 * CRASH NOTE: PushNotifications.register() is NOT called here.
 * Without google-services.json it will crash the Android runtime.
 * See usePushNotifications.js for the full crash-safe implementation.
 */

import { Capacitor } from '@capacitor/core';

const FCM_TOKEN_KEY = 'fcm_device_token';

/**
 * Request push notification permission.
 * Returns true if granted, false otherwise.
 * Safe on web — returns false immediately.
 */
export const requestPushPermission = async () => {
    if (!Capacitor.isNativePlatform()) return false;

    try {
        const { PushNotifications } = await import('@capacitor/push-notifications');
        let perm = await PushNotifications.checkPermissions();
        if (perm.receive !== 'granted') {
            perm = await PushNotifications.requestPermissions();
        }
        return perm.receive === 'granted';
    } catch (err) {
        console.warn('[Push] requestPushPermission error:', err?.message);
        return false;
    }
};

/**
 * Add a listener for incoming push notifications (while app is open).
 * Returns a cleanup function.
 */
export const onPushReceived = (callback) => {
    if (!Capacitor.isNativePlatform()) return () => {};

    let handle = null;

    import('@capacitor/push-notifications').then(({ PushNotifications }) => {
        PushNotifications.addListener('pushNotificationReceived', callback)
            .then((h) => { handle = h; })
            .catch(() => {});
    }).catch(() => {});

    return () => {
        handle?.remove?.();
    };
};

/**
 * Retrieve the stored FCM token (sync, from localStorage).
 * Returns null if not available.
 */
export const getStoredFcmToken = () => {
    try {
        return localStorage.getItem(FCM_TOKEN_KEY) ?? null;
    } catch {
        return null;
    }
};
