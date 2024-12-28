/**
 * UserRouteWrapper.tsx
 * 
 * This checks if the :userId from the URL matches session.user.id.
 * - If mismatch, show NotFound
 * - If match, render Outlet
 */
import React from 'react';
import { useParams, Outlet } from 'react-router-dom';
import NotFound from '../shared/components/NotFound';

interface UserRouteWrapperProps {
  session: any; // adjust the typing to your session type if possible
}

const UserRouteWrapper: React.FC<UserRouteWrapperProps> = ({ session }) => {
  const { userId } = useParams<{ userId: string }>();

  // If there's no session or the URL's userId doesn't match the session userId, show NotFound
  if (!session || userId !== session.user.id) {
    return <NotFound />;
  }

  // Otherwise, let child routes render
  return <Outlet />;
};

export default UserRouteWrapper;