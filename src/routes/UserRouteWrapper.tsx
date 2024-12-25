/**
 * UserRouteWrapper component ensures that the user session is valid and the userId
 * from the URL matches the session's userId. If not, it renders a NotFound component.
 *
 * @component
 * @param {UserRouteWrapperProps} props - The component props.
 * @param {Object} props.session - The current user session.
 * @param {React.ReactNode} props.children - The child components to render if the session is valid.
 * @returns {JSX.Element} - The rendered component.
 */

import React from 'react';
import { useParams } from 'react-router-dom';
import NotFound from '../shared/components/NotFound';

/**
 * Props for the UserRouteWrapper component.
 * 
 * @interface UserRouteWrapperProps
 * @property {any} session - The current user session.
 * @property {React.ReactNode} children - The child components to render if the session is valid.
 */
interface UserRouteWrapperProps {
  session: any;
  children: React.ReactNode;
}

/**
 * UserRouteWrapper component.
 * 
 * This component checks if the user session is valid and if the userId from the URL
 * matches the session's userId. If the session is invalid or the userId does not match,
 * it renders a NotFound component. Otherwise, it renders the child components.
 * 
 * @param {UserRouteWrapperProps} props - The component props.
 * @returns {JSX.Element} - The rendered component.
 */
const UserRouteWrapper: React.FC<UserRouteWrapperProps> = ({ session, children }: UserRouteWrapperProps): JSX.Element => {
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