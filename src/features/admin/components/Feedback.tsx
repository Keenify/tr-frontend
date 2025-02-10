import React, { useEffect, useState } from 'react';
import { ClipLoader } from 'react-spinners';
import { format } from 'date-fns';
import { getCompanyFeedbacks } from '../services/useCompanyFeedback';
import { FeedbackResponse } from '../../feedback/types/feedback';

interface FeedbackProps {
  companyId?: string;
}

const Feedback: React.FC<FeedbackProps> = ({ companyId }) => {
  const [feedbacks, setFeedbacks] = useState<FeedbackResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchFeedbacks = async () => {
      if (!companyId) return;
      
      try {
        setLoading(true);
        const data = await getCompanyFeedbacks(companyId);
        setFeedbacks(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch feedbacks');
      } finally {
        setLoading(false);
      }
    };

    fetchFeedbacks();
  }, [companyId]);

  if (loading) {
    return (
      <div className="flex justify-center items-center py-8">
        <ClipLoader size={50} color={"#007BFF"} />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 text-red-600 text-center bg-red-100 rounded-lg">
        <p>{error}</p>
      </div>
    );
  }

  if (feedbacks.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        No feedback entries found.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold text-gray-900">Company Feedback</h2>
      <div className="bg-white shadow overflow-hidden sm:rounded-md">
        <ul className="divide-y divide-gray-200">
          {feedbacks.map((feedback) => (
            <li key={feedback.id} className="p-6 hover:bg-gray-50">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    {feedback.employee.profile_pic_url && (
                      <img
                        src={feedback.employee.profile_pic_url}
                        alt=""
                        className="h-10 w-10 rounded-full"
                      />
                    )}
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        {feedback.employee.first_name} {feedback.employee.last_name}
                      </p>
                      <p className="text-sm text-gray-500">
                        {feedback.employee.role}
                      </p>
                    </div>
                  </div>
                  <time className="text-sm text-gray-500">
                    {format(new Date(feedback.createdAt), 'MMM d, yyyy h:mm a')}
                  </time>
                </div>
                <div className="text-sm text-gray-700 whitespace-pre-wrap">
                  {feedback.feedback}
                </div>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default Feedback;
