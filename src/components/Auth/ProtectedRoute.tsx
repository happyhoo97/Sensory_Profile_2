import React from 'react';
import { Navigate } from 'react-router-dom';
import type { Session } from '@supabase/supabase-js';

interface ProtectedRouteProps {
  session: Session | null;
  children: React.ReactNode;
  adminOnly?: boolean; // New optional prop
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ session, children, adminOnly = false }) => {
  // 1. If the user is not logged in, redirect to login page
  if (!session) {
    return <Navigate to="/login" replace />;
  }

  // 2. If the route is admin-only, check the user's role
  if (adminOnly) {
    const isAdmin = session.user?.app_metadata?.role === 'admin';
    if (!isAdmin) {
      // If not an admin, redirect to the dashboard
      return <Navigate to="/dashboard" replace />;
    }
  }

  // 3. If all checks pass, render the requested component
  return <>{children}</>;
};

export default ProtectedRoute;
