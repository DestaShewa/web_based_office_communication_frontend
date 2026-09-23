import { Navigate, Outlet } from 'react-router-dom';
import useAuthStore from '../store/authStore';
import { Loader2 } from 'lucide-react';
import React, { Suspense } from 'react';

/**
 * Ensures user is authenticated and possesses the required role to access the nested routes.
 */
export default function ProtectedRoute({ allowedRoles }) {
  const { user, isAuthenticated } = useAuthStore();

  if (!isAuthenticated) {
    // Not logged in -> kick to login
    return <Navigate to="/login" replace />;
  }

  // If roles are defined, ensure the user belongs to at least one
  if (allowedRoles && Array.isArray(allowedRoles)) {
    if (!allowedRoles.includes(user?.role)) {
      // Authenticated but unauthorized -> route to their specific fallback or 403
      return <Navigate to={`/${user?.role || 'login'}`} replace />;
    }
  }

  // Authorized -> Render the child routes within a Suspense barrier for optional lazy loading
  return (
    <Suspense fallback={<div className="flex h-screen w-full items-center justify-center bg-background text-primary"><Loader2 className="animate-spin" size={32}/></div>}>
      <Outlet />
    </Suspense>
  );
}
