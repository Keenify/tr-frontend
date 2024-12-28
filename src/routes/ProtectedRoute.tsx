/**
 * ProtectedRoute.tsx
 * 
 * This checks if the user is authenticated. 
 * - If not, redirects to /login
 * - If yes, renders the children (Outlet).
 */
import { Session } from '@supabase/supabase-js';
import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';

interface ProtectedRouteProps {
  session: Session | null;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ session }) => {
  // If no session, redirect to login
  if (!session) {
    return <Navigate to="/login" replace />;
  }

  // Otherwise, render any child routes
  return <Outlet />;
};

export default ProtectedRoute;