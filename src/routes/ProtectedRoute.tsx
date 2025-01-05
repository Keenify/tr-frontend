import React from 'react';
import { useParams } from 'react-router-dom';
import { Session } from '@supabase/supabase-js';
import NotFound from '../shared/components/NotFound';

interface ProtectedRouteProps {
  session: Session;
  element: React.ReactElement;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ session, element }) => {
  const { userId } = useParams<{ userId: string }>();

  if (userId !== session.user.id) {
    return <NotFound />;
  }

  return element;
};

export default ProtectedRoute;
