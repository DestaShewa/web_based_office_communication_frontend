import React, { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import useAuthStore from '../store/authStore';

/**
 * A top-level redirector for memo notifications.
 * Memos are nested under role-based layouts (e.g., /admin/memos).
 * This component takes a flat /memos/:memoId and routes the user to the correct dashboard.
 */
export default function MemoRedirect() {
  const { memoId } = useParams();
  const { user } = useAuthStore();
  const navigate = useNavigate();

  useEffect(() => {
    if (user?.role) {
      // Redirect to the role-specific memo portal with the memoId in a query param
      // We'll update MemoPortal to look for this param and auto-open the detail view
      navigate(`/${user.role}/memos?id=${memoId}`, { replace: true });
    } else {
      // If not logged in, the ProtectedRoute in index.jsx will handle it, 
      // but as a fallback, go to login
      navigate('/login', { replace: true });
    }
  }, [user, memoId, navigate]);

  return (
    <div className="h-screen flex items-center justify-center bg-gray-50">
      <div className="w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin"></div>
    </div>
  );
}
