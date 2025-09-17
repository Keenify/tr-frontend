import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { jdService } from '../services/jdService';

interface PublicJDData {
  id: string;
  content: string;
  created_at: string;
  updated_at: string;
  companies: {
    name: string;
  };
}

const PublicJDPage: React.FC = () => {
  const { companyId } = useParams<{ companyId: string }>();
  const [jdData, setJdData] = useState<PublicJDData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);


  useEffect(() => {
    const fetchPublicJD = async () => {
      if (!companyId) {
        setError('Company ID is required');
        setLoading(false);
        return;
      }

      try {
        // Use the service method to ensure consistency
        const data = await jdService.fetchJDPageByCompanyId(companyId);
        
        if (data) {
          setJdData(data);
        } else {
          setError('No job description found for this company');
        }
      } catch (err) {
        setError('Failed to load job description');
        console.error('Error fetching public JD:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchPublicJD();
  }, [companyId]);

  // Convert markdown to HTML for display
  const convertMarkdownToHtml = (markdown: string): string => {
    return markdown
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/__(.*?)__/g, '<u>$1</u>')
      .replace(/^# (.*$)/gm, '<h1>$1</h1>')
      .replace(/^## (.*$)/gm, '<h2>$1</h2>')
      .replace(/^• (.*$)/gm, '<ul><li>$1</li></ul>')
      .replace(/\n/g, '<br>');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-lg text-gray-600">Loading job description...</div>
        </div>
      </div>
    );
  }

  if (error || !jdData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">📝</div>
          <div className="text-xl font-medium text-gray-600 mb-2">
            {error || 'Job description not found'}
          </div>
          <div className="text-gray-500">
            This company hasn't published a job description yet.
          </div>
        </div>
      </div>
    );
  }

  const companyName = jdData.companies?.name || 'Company';
  const htmlContent = jdData.content ? convertMarkdownToHtml(jdData.content) : '';

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-6">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <div className="text-center">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              {companyName}
            </h1>
            <p className="text-lg text-gray-600">Job Description</p>
          </div>
        </div>

        {/* Content */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
          {htmlContent ? (
            <div 
              className="prose max-w-none prose-lg"
              dangerouslySetInnerHTML={{
                __html: htmlContent
              }}
            />
          ) : (
            <div className="text-center text-gray-500 py-20">
              <div className="text-6xl mb-4">📝</div>
              <div className="text-xl font-medium text-gray-600 mb-2">
                No content available
              </div>
              <div className="text-gray-500">
                This company hasn't added job description content yet.
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="text-center mt-8 text-sm text-gray-500">
          <p>Interested in this position? Contact {companyName} directly.</p>
          <p className="mt-2">
            Last updated: {new Date(jdData.updated_at).toLocaleDateString()} at {new Date(jdData.updated_at).toLocaleTimeString()}
          </p>
          <p className="mt-1 text-xs text-gray-400">
            Click refresh to get the latest content
          </p>
        </div>
      </div>
    </div>
  );
};

export default PublicJDPage;