import React from 'react';
import { useParams, Navigate } from 'react-router-dom';
import { Session } from '@supabase/supabase-js';
import NotFound from '../shared/components/NotFound';

interface ProtectedRouteProps {
  session: Session | null;
  element: React.ReactElement;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ session, element }) => {
  const { userId } = useParams<{ userId: string }>();
  const location = window.location.pathname;

  // Allow public access to b2b_order route
  const isB2BOrderRoute = location.includes('/b2b_order');

  // If accessing b2b_order route, allow without authentication
  if (isB2BOrderRoute) {
    return element;
  }

  // If no session (unauthenticated), redirect to login
  if (!session) {
    return <Navigate to="/login" replace />;
  }

  // If userId doesn't match authenticated user's ID, show 404
  if (userId !== session.user.id) {
    return <NotFound />;
  }

  return element;
};

export default ProtectedRoute;
