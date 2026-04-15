/**
 * Protected Route Component
 * Handles authentication and role-based authorization
 * Redirects unauthorized users to appropriate pages
 */

import { Navigate } from "react-router-dom";
import { useContext } from "react";
import { AuthContext } from "../context/AuthContext";
import BlockedScreen from "../pages/admin/BlockedScreen";
import ExpiredPlanBanner from "../components/common/ExpiredPlanBanner";

/**
 * ProtectedRoute wrapper component
 * @param {Object} props - Component props
 * @param {React.ReactNode} props.children - Child components to render if authorized
 * @param {string[]} props.allowedRoles - Array of roles allowed to access this route
 * @returns {React.ReactElement} Protected content or redirect
 */
function ProtectedRoute({ children, allowedRoles = [] }) {
  const { user, isInitializing } = useContext(AuthContext);
  const token = sessionStorage.getItem("token");

  // Prevent premature redirect while verifying the session on component mount
  if (isInitializing) {
     return <div style={{ display: 'flex', height: '100vh', width: '100vw', alignItems: 'center', justifyContent: 'center' }}><div className="auth-spinner" style={{ width: '40px', height: '40px', borderTopColor: '#6366f1' }}/></div>;
  }

  // Check if user is authenticated
  if (!token || !user) {
    return <Navigate to="/login" replace />;
  }

  // Phase 7: Globally render the Blocked / Suspended screen for any blocked user
  if (user.status === 'blocked') {
    return <BlockedScreen />;
  }

  // Check if user has required role
  if (allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
    return <Navigate to="/unauthorized" replace />;
  }

  // User is authenticated and authorized
  return (
    <>
      {user.isPlanExpired && user.role !== 'super_admin' && <ExpiredPlanBanner />}
      {children}
    </>
  );
}

export default ProtectedRoute;
