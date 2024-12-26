import React, { useEffect, useState } from "react";
import { useParams, useLocation } from "react-router-dom";
import NotFound from "../shared/components/NotFound";
import Editor from "../features/dashboard/components/side_menu/Content/components/Editor";
import { getDocument } from "../services/docService";

/**
 * Props for the EditorProtectedRoute component.
 *
 * @interface EditorProtectedRouteProps
 * @property {any} session - The current user session.
 */
interface EditorProtectedRouteProps {
  session: any;
}

/**
 * EditorProtectedRoute component.
 *
 * This component checks if the user session is valid and if the userId from the URL
 * matches the session's userId. If the session is invalid or the userId does not match,
 * it renders a NotFound component. Otherwise, it renders the Editor component.
 *
 * @param {EditorProtectedRouteProps} props - The component props.
 * @returns {JSX.Element} - The rendered component.
 */
const EditorProtectedRoute: React.FC<EditorProtectedRouteProps> = ({
  session,
}) => {
  const { userId, subjectId } = useParams<{
    userId: string;
    subjectId: string;
  }>();
  const location = useLocation();
  const [documentData, setDocumentData] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const validateDocument = async () => {
      if (session && userId === session.user.id && subjectId) {
        try {
          const document = await getDocument(subjectId);
          setDocumentData(document);
        } catch (error) {
          console.error("Error fetching document:", error);
          setDocumentData(null);
        } finally {
          setLoading(false);
        }
      } else {
        setLoading(false);
        setDocumentData(null);
      }
    };

    validateDocument();
  }, [session, userId, subjectId]);

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!session || userId !== session.user.id || !documentData) {
    return <NotFound />;
  }

  const { title, topic } = location.state || {};

  return <Editor title={title || "Untitled"} initialContent={topic || ""} />;
};

export default EditorProtectedRoute;
