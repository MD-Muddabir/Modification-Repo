import { useState, useEffect } from "react";
import "./NetworkStatus.css";

const NetworkStatus = () => {
    const [isOnline, setIsOnline] = useState(navigator.onLine);
    const [showBackOnline, setShowBackOnline] = useState(false);
    const [serverDown, setServerDown] = useState(false);

    useEffect(() => {
        let networkListener;

        const handleOnline = () => {
            setIsOnline(true);
            setShowBackOnline(true);
            setTimeout(() => setShowBackOnline(false), 4000); // Hide success toast after 4s
        };

        const handleOffline = () => {
            setIsOnline(false);
            setShowBackOnline(false);
        };

        const handleServerDown = () => {
            setServerDown(true);
        };

        const setupNetwork = async () => {
            const { Capacitor } = await import("@capacitor/core");
            if (Capacitor.isNativePlatform()) {
                const { Network } = await import("@capacitor/network");
                const status = await Network.getStatus();
                if (!status.connected) handleOffline();
                networkListener = await Network.addListener('networkStatusChange', status => {
                    if (status.connected) handleOnline();
                    else handleOffline();
                });
            } else {
                window.addEventListener("online", handleOnline);
                window.addEventListener("offline", handleOffline);
            }
            window.addEventListener("offline_api_error", handleServerDown);
        };

        setupNetwork();

        return () => {
            if (networkListener) {
                networkListener.remove();
            }
            window.removeEventListener("online", handleOnline);
            window.removeEventListener("offline", handleOffline);
            window.removeEventListener("offline_api_error", handleServerDown);
        };
    }, []);

    if (serverDown) {
        return (
            <div className="server-down-overlay">
                <div className="server-down-card">
                    <div className="server-down-icon-wrapper">
                        <div className="server-down-icon">🔌</div>
                        <div className="pulsing-ring"></div>
                    </div>
                    <h2 className="server-down-title">Platform Unreachable</h2>
                    <p className="server-down-desc">
                        We are currently unable to connect to the backend database servers. Our systems might be under maintenance or experiencing high traffic. Please try again in a few minutes.
                    </p>
                    <button className="server-retry-btn" onClick={() => window.location.reload()}>
                        Retry Connection 🔄
                    </button>
                    <div className="server-status-bar">
                        <span className="server-dot"></span>
                        System Network Status: <span style={{color: '#ff4d4f', fontWeight: 'bold', marginLeft: '4px'}}>Offline</span>
                    </div>
                </div>
            </div>
        );
    }

    if (isOnline && !showBackOnline) return null;

    return (
        <div className={`network-status-container ${!isOnline ? "offline" : "online"}`}>
            {!isOnline ? (
                <div className="network-toast offline-toast card">
                    <div className="network-icon">📡</div>
                    <div className="network-content">
                        <strong>No Internet Connection</strong>
                        <p>You're offline. Check your connection.</p>
                    </div>
                </div>
            ) : (
                <div className="network-toast online-toast card">
                    <div className="network-icon" style={{ filter: "hue-rotate(90deg)" }}>📡</div>
                    <div className="network-content">
                        <strong>Back Online</strong>
                        <p>Your connection has been restored.</p>
                    </div>
                </div>
            )}
        </div>
    );
};

export default NetworkStatus;

