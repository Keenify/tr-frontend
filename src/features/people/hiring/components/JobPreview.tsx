import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Box,
  Container,
  Typography,
  Chip,
  Stack,
  Button,
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
  EmojiEvents,
  TrendingUp,
  Handshake,
  Visibility
} from '@mui/icons-material';

const JobPreview: React.FC = () => {
  const [searchParams] = useSearchParams();
  const [jobData, setJobData] = useState<any>(null);
  const theme = useTheme();

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
                    {jobData.role}
                  </Typography>
                  
                  <Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 3 }}>
                    <Avatar sx={{ bgcolor: 'rgba(255,255,255,0.2)', color: 'white' }}>
                      <Business />
                    </Avatar>
                    <Box>
                      <Typography variant="h5" sx={{ fontWeight: 600 }}>
                        {jobData.companyName || 'Your Company'}
                      </Typography>
                      <Typography variant="subtitle1" sx={{ opacity: 0.9 }}>
                        {jobData.department} Department
                      </Typography>
                    </Box>
                  </Stack>
                  
                  <Stack direction="row" spacing={2} flexWrap="wrap" sx={{ mb: 4 }}>
                    <Chip 
                      icon={<Work />}
                      label={getRemoteStatusLabel(jobData.remote_status)} 
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
                      label="Posted Today (Preview)"
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
                    {jobData.locations.map((location: string, index: number) => (
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
                    disabled
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
                      '&.Mui-disabled': {
                        bgcolor: 'rgba(255,255,255,0.8)',
                        color: 'rgba(0,0,0,0.4)'
                      }
                    }}
                  >
                    Apply Now (Preview)
                  </Button>
                  <Typography 
                    variant="caption" 
                    display="block" 
                    sx={{ mt: 2, opacity: 0.8 }}
                  >
                    Button disabled in preview mode
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
        {/* Preview Mode Notice */}
        <Alert 
          severity="info" 
          icon={<Visibility />}
          sx={{ 
            mb: 4,
            backgroundColor: 'background.paper',
            border: '2px dashed',
            borderColor: 'info.main',
            '& .MuiAlert-icon': {
              color: 'info.main'
            }
          }}
        >
          <AlertTitle sx={{ fontWeight: 600 }}>
            Preview Mode
          </AlertTitle>
          <Typography variant="body2">
            This is how your job posting will appear to candidates. Please review all details carefully before publishing.
          </Typography>
        </Alert>

        <Grid container spacing={4}>
          {/* Left Column - Main Content */}
          <Grid item xs={12} md={8}>
            <Stack spacing={4}>
              {/* Company Info */}
              {jobData.company_info && (
                <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider' }}>
                  <CardContent sx={{ p: 4 }}>
                    <Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 3 }}>
                      <Avatar sx={{ bgcolor: 'primary.main', width: 48, height: 48 }}>
                        <Business />
                      </Avatar>
                      <Typography variant="h4" fontWeight="bold" color="primary.main">
                        About {jobData.companyName || 'the Company'}
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
                      {jobData.company_info}
                    </Typography>
                  </CardContent>
                </Card>
              )}

              {/* Mission */}
              {jobData.mission && (
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
                      {jobData.mission}
                    </Typography>
                  </CardContent>
                </Card>
              )}

              {/* Required Skills */}
              {jobData.skills && (
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
                      {jobData.skills}
                    </Typography>
                  </CardContent>
                </Card>
              )}

              {/* Application Process */}
              {jobData.application_process && (
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
                      {jobData.application_process}
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
              {jobData.perks && (
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
                      {jobData.perks}
                    </Typography>
                  </CardContent>
                </Card>
              )}
            </Stack>
          </Grid>
        </Grid>
      </Container>
    </Box>
  );
};

export default JobPreview;