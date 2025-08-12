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
  AlertTitle,
  Grid,
  Card,
  CardContent,
  Avatar,
  Fade,
  useTheme
} from '@mui/material';
import { 
  Email, 
  LocationOn, 
  Work, 
  Business,
  Star,
  Schedule,
  Groups,
  EmojiEvents,
  TrendingUp,
  AccountBalance,
  Handshake,
  School,
  Flight,
  LocalHospital,
  SportsEsports,
  Restaurant
} from '@mui/icons-material';
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

  const theme = useTheme();

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'grey.50' }}>
      {/* Hero Section */}
      <Box 
        sx={{ 
          background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 100%)`,
          color: 'white',
          py: { xs: 6, md: 10 },
          position: 'relative',
          overflow: 'hidden'
        }}
      >
        <Container maxWidth="lg">
          <Fade in={true} timeout={1000}>
            <Grid container spacing={4} alignItems="center">
              <Grid item xs={12} md={8}>
                <Box>
                  <Typography 
                    variant="h2" 
                    component="h1" 
                    gutterBottom 
                    fontWeight="bold"
                    sx={{ 
                      fontSize: { xs: '2.5rem', md: '3.5rem' },
                      lineHeight: 1.2,
                      mb: 2
                    }}
                  >
                    {job.role}
                  </Typography>
                  
                  <Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 3 }}>
                    <Avatar sx={{ bgcolor: 'rgba(255,255,255,0.2)', color: 'white' }}>
                      <Business />
                    </Avatar>
                    <Box>
                      <Typography variant="h5" sx={{ fontWeight: 600 }}>
                        {job.company?.name || 'Company'}
                      </Typography>
                      <Typography variant="subtitle1" sx={{ opacity: 0.9 }}>
                        {job.department} Department
                      </Typography>
                    </Box>
                  </Stack>
                  
                  <Stack direction="row" spacing={2} flexWrap="wrap" sx={{ mb: 4 }}>
                    <Chip 
                      icon={<Work />}
                      label={getRemoteStatusLabel(job.remote_status)} 
                      sx={{ 
                        bgcolor: 'rgba(255,255,255,0.2)', 
                        color: 'white',
                        backdropFilter: 'blur(10px)',
                        '& .MuiChip-icon': { color: 'white' }
                      }}
                      size="medium"
                    />
                    <Chip 
                      icon={<Schedule />}
                      label={`Posted ${new Date(job.created_at).toLocaleDateString()}`}
                      sx={{ 
                        bgcolor: 'rgba(255,255,255,0.2)', 
                        color: 'white',
                        backdropFilter: 'blur(10px)',
                        '& .MuiChip-icon': { color: 'white' }
                      }}
                      size="medium"
                    />
                  </Stack>
                  
                  <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap">
                    <LocationOn sx={{ color: 'rgba(255,255,255,0.8)' }} />
                    {job.locations.map((location, index) => (
                      <Chip 
                        key={index} 
                        label={location} 
                        variant="outlined"
                        sx={{ 
                          borderColor: 'rgba(255,255,255,0.3)',
                          color: 'white',
                          mb: 1
                        }}
                        size="small"
                      />
                    ))}
                  </Stack>
                </Box>
              </Grid>
              
              <Grid item xs={12} md={4}>
                <Box sx={{ textAlign: 'center', position: 'relative', zIndex: 10 }}>
                  <Button
                    variant="contained"
                    size="large"
                    startIcon={<Email />}
                    onClick={handleApply}
                    sx={{ 
                      bgcolor: 'white',
                      color: 'primary.main',
                      px: 4,
                      py: 2,
                      fontSize: '1.2rem',
                      fontWeight: 'bold',
                      textTransform: 'none',
                      boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
                      position: 'relative',
                      zIndex: 10,
                      '&:hover': {
                        bgcolor: 'grey.100',
                        transform: 'translateY(-2px)',
                        boxShadow: '0 12px 40px rgba(0,0,0,0.15)'
                      },
                      transition: 'all 0.3s ease'
                    }}
                  >
                    Apply Now
                  </Button>
                  <Typography 
                    variant="caption" 
                    display="block" 
                    sx={{ mt: 2, opacity: 0.8 }}
                  >
                    Join our amazing team!
                  </Typography>
                </Box>
              </Grid>
            </Grid>
          </Fade>
        </Container>
        
        {/* Decorative Elements */}
        <Box
          sx={{
            position: 'absolute',
            top: '-50%',
            right: '-10%',
            width: '60%',
            height: '200%',
            background: 'rgba(255,255,255,0.05)',
            borderRadius: '50%',
            transform: 'rotate(15deg)',
            zIndex: 1,
            pointerEvents: 'none'
          }}
        />
      </Box>

      {/* Main Content */}
      <Container maxWidth="lg" sx={{ py: 6 }}>
        <Grid container spacing={4}>
          {/* Left Column - Main Content */}
          <Grid item xs={12} md={8}>
            <Stack spacing={4}>
              {/* Company Info */}
              {job.company_info && (
                <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider' }}>
                  <CardContent sx={{ p: 4 }}>
                    <Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 3 }}>
                      <Avatar sx={{ bgcolor: 'primary.main', width: 48, height: 48 }}>
                        <Business />
                      </Avatar>
                      <Typography variant="h4" fontWeight="bold" color="primary.main">
                        About {job.company?.name || 'the Company'}
                      </Typography>
                    </Stack>
                    <Typography 
                      variant="body1" 
                      sx={{ 
                        whiteSpace: 'pre-wrap', 
                        lineHeight: 1.8,
                        color: 'text.primary',
                        fontSize: '1.1rem'
                      }}
                    >
                      {job.company_info}
                    </Typography>
                  </CardContent>
                </Card>
              )}

              {/* Mission */}
              {job.mission && (
                <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider' }}>
                  <CardContent sx={{ p: 4 }}>
                    <Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 3 }}>
                      <Avatar sx={{ bgcolor: 'secondary.main', width: 48, height: 48 }}>
                        <Star />
                      </Avatar>
                      <Typography variant="h4" fontWeight="bold" color="secondary.main">
                        The Mission
                      </Typography>
                    </Stack>
                    <Typography 
                      variant="body1" 
                      sx={{ 
                        whiteSpace: 'pre-wrap', 
                        lineHeight: 1.8,
                        color: 'text.primary',
                        fontSize: '1.1rem'
                      }}
                    >
                      {job.mission}
                    </Typography>
                  </CardContent>
                </Card>
              )}

              {/* Required Skills */}
              {job.skills && (
                <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider' }}>
                  <CardContent sx={{ p: 4 }}>
                    <Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 3 }}>
                      <Avatar sx={{ bgcolor: 'success.main', width: 48, height: 48 }}>
                        <TrendingUp />
                      </Avatar>
                      <Typography variant="h4" fontWeight="bold" color="success.main">
                        What We're Looking For
                      </Typography>
                    </Stack>
                    <Typography 
                      variant="body1" 
                      sx={{ 
                        whiteSpace: 'pre-wrap', 
                        lineHeight: 1.8,
                        color: 'text.primary',
                        fontSize: '1.1rem'
                      }}
                    >
                      {job.skills}
                    </Typography>
                  </CardContent>
                </Card>
              )}

              {/* Application Process */}
              {job.application_process && (
                <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider' }}>
                  <CardContent sx={{ p: 4 }}>
                    <Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 3 }}>
                      <Avatar sx={{ bgcolor: 'info.main', width: 48, height: 48 }}>
                        <Handshake />
                      </Avatar>
                      <Typography variant="h4" fontWeight="bold" color="info.main">
                        Application Process
                      </Typography>
                    </Stack>
                    <Typography 
                      variant="body1" 
                      sx={{ 
                        whiteSpace: 'pre-wrap', 
                        lineHeight: 1.8,
                        color: 'text.primary',
                        fontSize: '1.1rem'
                      }}
                    >
                      {job.application_process}
                    </Typography>
                  </CardContent>
                </Card>
              )}
            </Stack>
          </Grid>

          {/* Right Column - Sidebar */}
          <Grid item xs={12} md={4}>
            <Stack spacing={3}>
              {/* Perks & Benefits */}
              {job.perks && (
                <Card 
                  elevation={2} 
                  sx={{ 
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    color: 'white'
                  }}
                >
                  <CardContent sx={{ p: 3 }}>
                    <Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 2 }}>
                      <EmojiEvents sx={{ fontSize: 32 }} />
                      <Typography variant="h5" fontWeight="bold">
                        Perks & Benefits
                      </Typography>
                    </Stack>
                    <Typography 
                      variant="body1" 
                      sx={{ 
                        whiteSpace: 'pre-wrap', 
                        lineHeight: 1.6,
                        opacity: 0.95
                      }}
                    >
                      {job.perks}
                    </Typography>
                  </CardContent>
                </Card>
              )}

              {/* Quick Apply Card */}
              <Card elevation={3} sx={{ textAlign: 'center' }}>
                <CardContent sx={{ p: 4 }}>
                  <Avatar 
                    sx={{ 
                      bgcolor: 'primary.main', 
                      width: 64, 
                      height: 64, 
                      mx: 'auto',
                      mb: 2
                    }}
                  >
                    <Groups sx={{ fontSize: 32 }} />
                  </Avatar>
                  <Typography variant="h6" gutterBottom fontWeight="bold">
                    Ready to Join Us?
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                    Take the next step in your career journey
                  </Typography>
                  <Button
                    variant="contained"
                    fullWidth
                    size="large"
                    startIcon={<Email />}
                    onClick={handleApply}
                    sx={{ 
                      py: 1.5,
                      fontSize: '1.1rem',
                      fontWeight: 'bold',
                      textTransform: 'none',
                      boxShadow: '0 4px 16px rgba(0,0,0,0.12)',
                      '&:hover': {
                        transform: 'translateY(-1px)',
                        boxShadow: '0 8px 24px rgba(0,0,0,0.15)'
                      },
                      transition: 'all 0.3s ease'
                    }}
                  >
                    Apply Now
                  </Button>
                  <Typography variant="caption" display="block" sx={{ mt: 2, opacity: 0.7 }}>
                    Quick & easy application process
                  </Typography>
                </CardContent>
              </Card>

            </Stack>
          </Grid>
        </Grid>
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