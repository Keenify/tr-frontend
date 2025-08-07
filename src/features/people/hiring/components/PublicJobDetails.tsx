import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import {
  Box,
  Container,
  Typography,
  Chip,
  Stack,
  Divider,
  Button,
  Paper,
  Skeleton,
  Alert,
  AlertTitle
} from '@mui/material';
import { Email, LocationOn, Work } from '@mui/icons-material';
import { supabase } from '../../../../lib/supabase';
import JobApplicationForm from './JobApplicationForm';

interface JobDetails {
  id: string;
  role: string;
  department: string;
  locations: string[];
  remote_status: string;
  company_info: string | null;
  mission: string | null;
  skills: string | null;
  perks: string | null;
  application_process: string | null;
  created_at: string;
  company: {
    name: string;
  };
}

const PublicJobDetails: React.FC = () => {
  const { jobId } = useParams<{ jobId: string }>();
  const [job, setJob] = useState<JobDetails | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showApplicationForm, setShowApplicationForm] = useState(false);

  useEffect(() => {
    fetchJobDetails();
  }, [jobId]);

  const fetchJobDetails = async () => {
    try {
      const { data, error } = await supabase
        .from('jobs_opening')
        .select(`
          *,
          company:companies(name)
        `)
        .eq('id', jobId)
        .single();

      if (error) throw error;

      if (data) {
        // Ensure company object exists even if join failed
        const jobData = {
          ...data,
          company: data.company || { name: 'Company' }
        };
        setJob(jobData as JobDetails);
      }
    } catch (error) {
      console.error('Error fetching job details:', error);
      setError('Job not found or no longer available');
    } finally {
      setIsLoading(false);
    }
  };

  const handleApply = () => {
    setShowApplicationForm(true);
  };

  if (isLoading) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Stack spacing={3}>
          <Skeleton variant="text" sx={{ fontSize: '3rem', width: '70%' }} />
          <Skeleton variant="text" sx={{ fontSize: '1.5rem', width: '50%' }} />
          <Box sx={{ display: 'flex', gap: 2 }}>
            <Skeleton variant="rectangular" width={100} height={32} />
            <Skeleton variant="rectangular" width={100} height={32} />
          </Box>
          <Divider />
          <Skeleton variant="text" sx={{ fontSize: '1rem' }} />
          <Skeleton variant="text" sx={{ fontSize: '1rem' }} />
          <Skeleton variant="text" sx={{ fontSize: '1rem' }} />
          <Skeleton variant="text" sx={{ fontSize: '1rem' }} />
        </Stack>
      </Container>
    );
  }

  if (error || !job) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Alert severity="error">
          <AlertTitle>Error</AlertTitle>
          {error || 'Job not found'}
        </Alert>
      </Container>
    );
  }

  const getRemoteStatusLabel = (status: string) => {
    switch (status) {
      case 'onsite': return 'On-site';
      case 'remote': return 'Remote';
      case 'hybrid': return 'Hybrid';
      default: return status;
    }
  };

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'background.default', py: 4 }}>
      <Container maxWidth="lg">
        <Paper elevation={0} sx={{ p: { xs: 3, md: 6 } }}>
          <Stack spacing={4}>
            {/* Header */}
            <Box>
              <Typography variant="h3" component="h1" gutterBottom fontWeight="bold">
                {job.role}
              </Typography>
              <Typography variant="h5" color="text.secondary" gutterBottom>
                {job.company?.name || 'Company'} • {job.department}
              </Typography>
              
              <Stack direction="row" spacing={2} alignItems="center" sx={{ mt: 3, mb: 2 }}>
                <Chip 
                  icon={<Work />}
                  label={getRemoteStatusLabel(job.remote_status)} 
                  color="success" 
                  size="medium"
                />
                <Typography variant="body2" color="text.secondary">
                  Posted {new Date(job.created_at).toLocaleDateString()}
                </Typography>
              </Stack>
              
              <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                <LocationOn sx={{ color: 'text.secondary', mt: 0.5 }} />
                {job.locations.map((location, index) => (
                  <Chip 
                    key={index} 
                    label={location} 
                    variant="outlined" 
                    size="small"
                    sx={{ mb: 1 }}
                  />
                ))}
              </Stack>
            </Box>

            <Divider />

            {/* Company Info */}
            {job.company_info && (
              <Box>
                <Typography variant="h4" gutterBottom fontWeight="medium">
                  About {job.company?.name || 'the Company'}
                </Typography>
                <Typography 
                  variant="body1" 
                  paragraph 
                  sx={{ whiteSpace: 'pre-wrap', lineHeight: 1.8 }}
                >
                  {job.company_info}
                </Typography>
              </Box>
            )}

            {/* Mission */}
            {job.mission && (
              <Box>
                <Typography variant="h4" gutterBottom fontWeight="medium">
                  The Mission
                </Typography>
                <Typography 
                  variant="body1" 
                  paragraph 
                  sx={{ whiteSpace: 'pre-wrap', lineHeight: 1.8 }}
                >
                  {job.mission}
                </Typography>
              </Box>
            )}

            {/* Required Skills */}
            {job.skills && (
              <Box>
                <Typography variant="h4" gutterBottom fontWeight="medium">
                  What We're Looking For
                </Typography>
                <Typography 
                  variant="body1" 
                  paragraph 
                  sx={{ whiteSpace: 'pre-wrap', lineHeight: 1.8 }}
                >
                  {job.skills}
                </Typography>
              </Box>
            )}

            {/* Perks & Benefits */}
            {job.perks && (
              <Box>
                <Typography variant="h4" gutterBottom fontWeight="medium">
                  Perks & Benefits
                </Typography>
                <Typography 
                  variant="body1" 
                  paragraph 
                  sx={{ whiteSpace: 'pre-wrap', lineHeight: 1.8 }}
                >
                  {job.perks}
                </Typography>
              </Box>
            )}

            {/* Application Process */}
            {job.application_process && (
              <Box>
                <Typography variant="h4" gutterBottom fontWeight="medium">
                  Application Process
                </Typography>
                <Typography 
                  variant="body1" 
                  paragraph 
                  sx={{ whiteSpace: 'pre-wrap', lineHeight: 1.8 }}
                >
                  {job.application_process}
                </Typography>
              </Box>
            )}

            <Divider sx={{ my: 4 }} />

            {/* Apply Section */}
            <Box sx={{ textAlign: 'center', py: 4 }}>
              <Stack spacing={3} alignItems="center">
                <Button
                  variant="contained"
                  size="large"
                  startIcon={<Email />}
                  onClick={handleApply}
                  sx={{ 
                    px: 6, 
                    py: 2,
                    fontSize: '1.1rem',
                    textTransform: 'none'
                  }}
                >
                  Apply for this Position
                </Button>
                <Typography variant="body2" color="text.secondary">
                  By applying, you agree to share your information with {job.company?.name || 'the company'}
                </Typography>
              </Stack>
            </Box>
          </Stack>
        </Paper>
      </Container>
      
      {/* Job Application Form */}
      {job && (
        <JobApplicationForm
          jobId={job.id}
          jobTitle={job.role}
          open={showApplicationForm}
          onClose={() => setShowApplicationForm(false)}
        />
      )}
    </Box>
  );
};

export default PublicJobDetails;