/**
 * useScanSound — Web Audio API hook for QR attendance scan feedback.
 *
 * Uses the browser's built-in AudioContext so zero audio files are needed.
 * All sounds are programmatically synthesized for instant, zero-latency playback.
 *
 * Sounds:
 *   playSuccess()  — bright double-chime (attendance marked ✅)
 *   playWarning()  — soft single beep  (already marked ⚠️)
 *   playError()    — harsh descending buzz (error ❌)
 */

import { useRef, useCallback } from "react";

const getAudioContext = (() => {
    let ctx = null;
    return () => {
        if (!ctx || ctx.state === "closed") {
            ctx = new (window.AudioContext || window.webkitAudioContext)();
        }
        // Resume suspended context (required after user-gesture policy)
        if (ctx.state === "suspended") {
            ctx.resume();
        }
        return ctx;
    };
})();

/**
 * Schedule a single tone on the shared AudioContext.
 * @param {AudioContext} ctx
 * @param {number} frequency  - Hz
 * @param {number} startTime  - ctx.currentTime offset in seconds
 * @param {number} duration   - seconds
 * @param {number} gain       - 0 – 1
 * @param {"sine"|"square"|"sawtooth"|"triangle"} type
 */
function scheduleTone(ctx, frequency, startTime, duration, gain = 0.4, type = "sine") {
    const osc = ctx.createOscillator();
    const gainNode = ctx.createGain();

    osc.connect(gainNode);
    gainNode.connect(ctx.destination);

    osc.type = type;
    osc.frequency.setValueAtTime(frequency, startTime);

    // Smooth attack + release envelope to avoid clicks
    gainNode.gain.setValueAtTime(0, startTime);
    gainNode.gain.linearRampToValueAtTime(gain, startTime + 0.02);
    gainNode.gain.setValueAtTime(gain, startTime + duration - 0.05);
    gainNode.gain.linearRampToValueAtTime(0, startTime + duration);

    osc.start(startTime);
    osc.stop(startTime + duration + 0.01);
}

export function useScanSound() {
    const isUnlocked = useRef(false);

    /**
     * Must be called once inside a user-gesture handler (click/tap)
     * to unlock the AudioContext on mobile browsers.
     */
    const unlockAudio = useCallback(() => {
        if (isUnlocked.current) return;
        try {
            const ctx = getAudioContext();
            // Play a silent buffer to unlock
            const buf = ctx.createBuffer(1, 1, 22050);
            const src = ctx.createBufferSource();
            src.buffer = buf;
            src.connect(ctx.destination);
            src.start(0);
            isUnlocked.current = true;
        } catch (_) { /* ignore */ }
    }, []);

    /**
     * ✅ Success — bright double ascending chime (C5 → E5)
     * Inspired by professional POS / hospital check-in beepers.
     */
    const playSuccess = useCallback(() => {
        try {
            const ctx = getAudioContext();
            const t = ctx.currentTime;

            // First chime: C5 (523 Hz)
            scheduleTone(ctx, 523.25, t,        0.18, 0.35, "sine");
            // Second chime: E5 (659 Hz) — slightly louder, longer
            scheduleTone(ctx, 659.25, t + 0.20, 0.28, 0.38, "sine");
            // Subtle harmonic shimmer on G5 (784 Hz)
            scheduleTone(ctx, 783.99, t + 0.40, 0.20, 0.18, "sine");
        } catch (e) {
            console.warn("[useScanSound] playSuccess failed:", e);
        }
    }, []);

    /**
     * ⚠️ Warning — soft single mid-tone beep (A4)
     * Used when attendance is already marked.
     */
    const playWarning = useCallback(() => {
        try {
            const ctx = getAudioContext();
            const t = ctx.currentTime;

            scheduleTone(ctx, 440, t,       0.15, 0.30, "sine");
            scheduleTone(ctx, 440, t + 0.20, 0.10, 0.15, "sine");
        } catch (e) {
            console.warn("[useScanSound] playWarning failed:", e);
        }
    }, []);

    /**
     * ❌ Error — descending harsh buzz (G4 → D4)
     * Used when QR is invalid or attendance marking fails.
     */
    const playError = useCallback(() => {
        try {
            const ctx = getAudioContext();
            const t = ctx.currentTime;

            const osc = ctx.createOscillator();
            const gainNode = ctx.createGain();
            osc.connect(gainNode);
            gainNode.connect(ctx.destination);

            osc.type = "sawtooth";
            osc.frequency.setValueAtTime(392, t);          // G4
            osc.frequency.linearRampToValueAtTime(293, t + 0.35); // D4

            gainNode.gain.setValueAtTime(0, t);
            gainNode.gain.linearRampToValueAtTime(0.28, t + 0.03);
            gainNode.gain.setValueAtTime(0.28, t + 0.28);
            gainNode.gain.linearRampToValueAtTime(0, t + 0.40);

            osc.start(t);
            osc.stop(t + 0.42);
        } catch (e) {
            console.warn("[useScanSound] playError failed:", e);
        }
    }, []);

    return { unlockAudio, playSuccess, playWarning, playError };
}
