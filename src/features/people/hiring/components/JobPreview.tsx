import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Box,
  Container,
  Typography,
  Chip,
  Stack,
  Divider,
  Button,
  Paper,
  Alert,
  AlertTitle
} from '@mui/material';
import { Email, LocationOn, Work } from '@mui/icons-material';

const JobPreview: React.FC = () => {
  const [searchParams] = useSearchParams();
  const [jobData, setJobData] = useState<any>(null);

  useEffect(() => {
    // Parse job data from URL parameters
    const data = searchParams.get('data');
    if (data) {
      try {
        const parsedData = JSON.parse(decodeURIComponent(data));
        setJobData(parsedData);
      } catch (error) {
        console.error('Error parsing job data:', error);
      }
    }
  }, [searchParams]);

  if (!jobData) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Alert severity="error">
          <AlertTitle>Error</AlertTitle>
          No preview data available
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
        <Alert severity="info" sx={{ mb: 3 }}>
          <AlertTitle>Preview Mode</AlertTitle>
          This is a preview of how your job posting will appear to candidates. The job has not been posted yet.
        </Alert>
        
        <Paper elevation={0} sx={{ p: { xs: 3, md: 6 } }}>
          <Stack spacing={4}>
            {/* Header */}
            <Box>
              <Typography variant="h3" component="h1" gutterBottom fontWeight="bold">
                {jobData.role}
              </Typography>
              <Typography variant="h5" color="text.secondary" gutterBottom>
                {jobData.companyName || 'Your Company'} • {jobData.department}
              </Typography>
              
              <Stack direction="row" spacing={2} alignItems="center" sx={{ mt: 3, mb: 2 }}>
                <Chip 
                  icon={<Work />}
                  label={getRemoteStatusLabel(jobData.remote_status)} 
                  color="success" 
                  size="medium"
                />
                <Typography variant="body2" color="text.secondary">
                  Posted Today (Preview)
                </Typography>
              </Stack>
              
              <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                <LocationOn sx={{ color: 'text.secondary', mt: 0.5 }} />
                {jobData.locations.map((location: string, index: number) => (
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
            {jobData.company_info && (
              <Box>
                <Typography variant="h4" gutterBottom fontWeight="medium">
                  About {jobData.companyName || 'the Company'}
                </Typography>
                <Typography 
                  variant="body1" 
                  paragraph 
                  sx={{ whiteSpace: 'pre-wrap', lineHeight: 1.8 }}
                >
                  {jobData.company_info}
                </Typography>
              </Box>
            )}

            {/* Mission */}
            {jobData.mission && (
              <Box>
                <Typography variant="h4" gutterBottom fontWeight="medium">
                  The Mission
                </Typography>
                <Typography 
                  variant="body1" 
                  paragraph 
                  sx={{ whiteSpace: 'pre-wrap', lineHeight: 1.8 }}
                >
                  {jobData.mission}
                </Typography>
              </Box>
            )}

            {/* Required Skills */}
            {jobData.skills && (
              <Box>
                <Typography variant="h4" gutterBottom fontWeight="medium">
                  What We're Looking For
                </Typography>
                <Typography 
                  variant="body1" 
                  paragraph 
                  sx={{ whiteSpace: 'pre-wrap', lineHeight: 1.8 }}
                >
                  {jobData.skills}
                </Typography>
              </Box>
            )}

            {/* Perks & Benefits */}
            {jobData.perks && (
              <Box>
                <Typography variant="h4" gutterBottom fontWeight="medium">
                  Perks & Benefits
                </Typography>
                <Typography 
                  variant="body1" 
                  paragraph 
                  sx={{ whiteSpace: 'pre-wrap', lineHeight: 1.8 }}
                >
                  {jobData.perks}
                </Typography>
              </Box>
            )}

            {/* Application Process */}
            {jobData.application_process && (
              <Box>
                <Typography variant="h4" gutterBottom fontWeight="medium">
                  Application Process
                </Typography>
                <Typography 
                  variant="body1" 
                  paragraph 
                  sx={{ whiteSpace: 'pre-wrap', lineHeight: 1.8 }}
                >
                  {jobData.application_process}
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
                  disabled
                  sx={{ 
                    px: 6, 
                    py: 2,
                    fontSize: '1.1rem',
                    textTransform: 'none'
                  }}
                >
                  Apply for this Position (Disabled in Preview)
                </Button>
                <Typography variant="body2" color="text.secondary">
                  This is a preview - the apply button will be active once the job is posted
                </Typography>
              </Stack>
            </Box>
          </Stack>
        </Paper>
      </Container>
    </Box>
  );
};

export default JobPreview;