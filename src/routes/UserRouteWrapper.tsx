/**
 * UserRouteWrapper component ensures that the user session is valid and the userId
 * from the URL matches the session's userId. If not, it renders a NotFound component.
 *
 * @param {Object} props - The component props
 * @param {Object} props.session - The current user session
 * @param {React.ReactNode} props.children - The child components to render if the session is valid
 * @returns {JSX.Element} - The rendered component
 */

import React from 'react';
import { useParams } from 'react-router-dom';
import NotFound from '../shared/components/NotFound';

interface UserRouteWrapperProps {
  session: any;
  children: React.ReactNode;
}

const UserRouteWrapper: React.FC<UserRouteWrapperProps> = ({ session, children }) => {
  const { userId } = useParams<{ userId: string }>();

  if (!session || userId !== session.user.id) {
    console.log('Session:', session);
    console.log('UserId:', userId);
    console.log('UserRouteWrapper: Session is invalid or userId does not match');
    return <NotFound />;
  }

  return <>{children}</>;
};

export default UserRouteWrapper;