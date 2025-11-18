import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { jdService } from '../services/jdService';
import { JDPage as JDPageType } from '../types/jd.types';

const PublicJDPage: React.FC = () => {
  const { companyId, slug } = useParams<{ companyId: string; slug: string }>();
  const [jdData, setJdData] = useState<JDPageType | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchPublicJD = async () => {
      if (!companyId) {
        setError('Company ID is required');
        setLoading(false);
        return;
      }

      if (!slug) {
        setError('Page slug is required');
        setLoading(false);
        return;
      }

      try {
        const data = await jdService.fetchPageBySlug(companyId, slug);

        if (data) {
          setJdData(data);
        } else {
          setError('Page not found');
        }
      } catch (err) {
        setError('Failed to load job description');
        console.error('Error fetching public JD:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchPublicJD();
  }, [companyId, slug]);

  if (loading) {
    return (
      <div style={{
        minHeight: '100vh',
        backgroundColor: '#f9f9f9',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '18px', color: '#666' }}>Loading job description...</div>
        </div>
      </div>
    );
  }

  if (error || !jdData) {
    return (
      <div style={{
        minHeight: '100vh',
        backgroundColor: '#f9f9f9',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <div style={{ textAlign: 'center', padding: '20px' }}>
          <div style={{ fontSize: '60px', marginBottom: '20px' }}>📝</div>
          <div style={{ fontSize: '24px', fontWeight: '600', color: '#333', marginBottom: '10px' }}>
            {error || 'Page not found'}
          </div>
          <div style={{ fontSize: '16px', color: '#666' }}>
            This page doesn't exist or hasn't been published yet.
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#f9f9f9',
      padding: '40px 20px'
    }}>
      <div style={{
        maxWidth: '900px',
        margin: '0 auto'
      }}>
        {/* Header */}
        <div style={{
          backgroundColor: 'white',
          borderRadius: '8px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
          padding: '30px',
          marginBottom: '20px',
          textAlign: 'center'
        }}>
          <h1 style={{
            fontSize: '32px',
            fontWeight: 'bold',
            color: '#333',
            marginBottom: '10px'
          }}>
            {jdData.title}
          </h1>
          <p style={{
            fontSize: '16px',
            color: '#666'
          }}>
            Job Description
          </p>
        </div>

        {/* Content */}
        <div style={{
          backgroundColor: 'white',
          borderRadius: '8px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
          padding: '40px'
        }}>
          {jdData.content ? (
            <div
              dangerouslySetInnerHTML={{
                __html: jdData.content
              }}
              style={{
                lineHeight: '1.8',
                fontSize: '16px',
                color: '#333'
              }}
            />
          ) : (
            <div style={{
              textAlign: 'center',
              padding: '60px 20px',
              color: '#999'
            }}>
              <div style={{ fontSize: '60px', marginBottom: '20px' }}>📝</div>
              <div style={{ fontSize: '20px', fontWeight: '600', color: '#666', marginBottom: '10px' }}>
                No content available
              </div>
              <div style={{ fontSize: '16px', color: '#999' }}>
                This page hasn't been filled with content yet.
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={{
          textAlign: 'center',
          marginTop: '30px',
          fontSize: '14px',
          color: '#999'
        }}>
          <p>Last updated: {new Date(jdData.updated_at).toLocaleDateString()}</p>
        </div>
      </div>
    </div>
  );
};

export default PublicJDPage;
