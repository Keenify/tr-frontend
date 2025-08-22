import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  Stack,
  Typography,
  Paper,
  Grid,
  Dialog,
  DialogTitle,
  DialogContent,
  CircularProgress,
  Alert,
  Snackbar,
  IconButton,
  Card,
  CardContent,
  CardActions,
  Tabs,
  Tab,
  SelectChangeEvent,
} from '@mui/material';
import { 
  ContentCopy, 
  Visibility, 
  Close, 
  Delete, 
  Settings, 
  People,
  Email as EmailIcon,
  Description,
  Phone,
  LocationOn,
  WorkOutline,
  CalendarToday,
  QuestionAnswer,
  PersonOutline
} from '@mui/icons-material';
import { supabase } from '../../../../lib/supabase';
import { useUserAndCompanyData } from '../../../../shared/hooks/useUserAndCompanyData';
import { useSession } from '../../../../shared/hooks/useSession';
import CustomQuestionManager from './CustomQuestionManager';
import useJobOpeningApplications, { JobOpeningApplication } from '../services/useJobOpeningApplications';


interface JobFormData {
  role: string;
  department: string;
  locations: string[];
  remote_status: string;
  company_info: string;
  mission: string;
  skills: string;
  perks: string;
  application_process: string;
}

interface PreviousJob {
  id: string;
  role: string;
  department: string;
  locations: string[];
  remote_status: string;
  created_at: string;
}

const JobsOpening: React.FC = () => {
  const { session } = useSession();
  const { userInfo, companyInfo } = useUserAndCompanyData(session?.user?.id || '');
  const { getApplicationsByJobId } = useJobOpeningApplications();
  const [isLoading, setIsLoading] = useState(false);
  const [locationInput, setLocationInput] = useState('');
  const [postedJobId, setPostedJobId] = useState<string | null>(null);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' as 'success' | 'error' | 'warning' | 'info' });
  const [tabValue, setTabValue] = useState(0);
  const [previousJobs, setPreviousJobs] = useState<PreviousJob[]>([]);
  const [previousJobsLoading, setPreviousJobsLoading] = useState(false);
  const [pendingQuestions, setPendingQuestions] = useState<{
    id?: string;
    question_text: string;
    question_type: 'text' | 'textarea' | 'radio' | 'checkbox';
    options?: string[];
    is_required: boolean;
    min_value?: number | null;
    max_value?: number | null;
  }[]>([]);
  const [showCustomQuestionsDialog, setShowCustomQuestionsDialog] = useState<string | null>(null);
  const [showApplicantsDialog, setShowApplicantsDialog] = useState<{ 
    jobId: string; 
    jobRole: string;
    department: string;
    remote_status: string;
    created_at: string;
  } | null>(null);
  const [jobApplicants, setJobApplicants] = useState<JobOpeningApplication[]>([]);
  const [applicantsLoading, setApplicantsLoading] = useState(false);
  const [formData, setFormData] = useState<JobFormData>({
    role: '',
    department: '',
    locations: [],
    remote_status: 'onsite',
    company_info: '',
    mission: '',
    skills: '',
    perks: '',
    application_process: ''
  });
  const [errors, setErrors] = useState<Partial<Record<keyof JobFormData, string>>>({});

  const fetchPreviousJobs = useCallback(async () => {
    if (!userInfo?.company_id) return;
    
    setPreviousJobsLoading(true);
    try {
      const { data, error } = await supabase
        .from('jobs_opening')
        .select('id, role, department, locations, remote_status, created_at')
        .eq('company_id', userInfo.company_id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      setPreviousJobs(data || []);
    } catch (error) {
      console.error('Error fetching previous jobs:', error);
      setSnackbar({
        open: true,
        message: 'Failed to load previous job postings',
        severity: 'error'
      });
    } finally {
      setPreviousJobsLoading(false);
    }
  }, [userInfo?.company_id]);

  useEffect(() => {
    if (userInfo?.company_id && tabValue === 1) {
      fetchPreviousJobs();
    }
  }, [userInfo?.company_id, tabValue, fetchPreviousJobs]);

  const handleDeleteJob = async (jobId: string) => {
    if (!window.confirm('Are you sure you want to delete this job posting? This will also delete all associated custom questions and applications.')) {
      return;
    }

    try {
      console.log('Attempting to delete job:', jobId);
      
      const { data, error } = await supabase
        .from('jobs_opening')
        .delete()
        .eq('id', jobId)
        .select();

      if (error) {
        console.error('Delete error details:', error);
        throw error;
      }

      console.log('Delete response:', data);

      setPreviousJobs(prev => prev.filter(job => job.id !== jobId));
      setSnackbar({
        open: true,
        message: 'Job posting deleted successfully',
        severity: 'success'
      });
    } catch (error) {
      console.error('Error deleting job:', error);
      setSnackbar({
        open: true,
        message: `Failed to delete job posting: ${error instanceof Error ? error.message : 'Unknown error'}`,
        severity: 'error'
      });
    }
  };

  const handleViewJob = (jobId: string) => {
    const url = `${window.location.origin}/jobs/${jobId}`;
    window.open(url, '_blank');
  };

  const handleCopyJobLink = (jobId: string) => {
    const url = `${window.location.origin}/jobs/${jobId}`;
    navigator.clipboard.writeText(url);
    setSnackbar({
      open: true,
      message: 'Job link copied to clipboard',
      severity: 'success'
    });
  };

  const validateForm = () => {
    const newErrors: Partial<Record<keyof JobFormData, string>> = {};
    if (!formData.role.trim()) newErrors.role = 'Role is required';
    if (!formData.department.trim()) newErrors.department = 'Department is required';
    if (formData.locations.length === 0) newErrors.locations = 'At least one location is required';
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name as keyof JobFormData]) {
      setErrors(prev => ({ ...prev, [name]: undefined }));
    }
  };

  const handleSelectChange = (e: SelectChangeEvent) => {
    const { name, value } = e.target;
    if (name) {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleAddLocation = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && locationInput.trim()) {
      e.preventDefault();
      if (!formData.locations.includes(locationInput.trim())) {
        setFormData(prev => ({
          ...prev,
          locations: [...prev.locations, locationInput.trim()]
        }));
        setLocationInput('');
        if (errors.locations) {
          setErrors(prev => ({ ...prev, locations: undefined }));
        }
      }
    }
  };

  const handleRemoveLocation = (locationToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      locations: prev.locations.filter(loc => loc !== locationToRemove)
    }));
  };

  const handlePreview = () => {
    if (validateForm()) {
      // Create preview data including company name
      const previewData = {
        ...formData,
        companyName: companyInfo?.name || 'Your Company'
      };
      
      // Encode the form data and open in new tab
      const encodedData = encodeURIComponent(JSON.stringify(previewData));
      const previewUrl = `/job-preview?data=${encodedData}`;
      window.open(previewUrl, '_blank');
    }
  };

  const handleSubmit = async () => {
    const isFormValid = validateForm();
    
    if (!isFormValid) {
      setSnackbar({
        open: true,
        message: 'Please fill in all required fields',
        severity: 'error'
      });
      return;
    }
    
    if (!userInfo?.company_id) {
      setSnackbar({
        open: true,
        message: 'Company information not found. Please refresh and try again.',
        severity: 'error'
      });
      return;
    }

    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('jobs_opening')
        .insert({
          company_id: userInfo.company_id,
          ...formData
        })
        .select()
        .single();

      if (error) throw error;

      if (data) {
        // Save custom questions if any were added
        if (pendingQuestions.length > 0) {
          const questionsToSave = pendingQuestions.map((q, index) => ({
            job_id: data.id,
            question_text: q.question_text,
            question_type: q.question_type,
            is_required: q.is_required || false,
            options: q.options || null,
            min_value: q.min_value || null,
            max_value: q.max_value || null,
            sort_order: index
          }));

          console.log('Saving custom questions:', questionsToSave);
          
          const { data: savedQuestions, error: questionsError } = await supabase
            .from('job_custom_questions')
            .insert(questionsToSave)
            .select();

          if (questionsError) {
            console.error('Error saving custom questions:', questionsError);
            setSnackbar({
              open: true,
              message: `Job posted but custom questions failed to save: ${questionsError.message}`,
              severity: 'warning'
            });
          } else {
            console.log('Custom questions saved successfully:', savedQuestions);
          }
        }

        setPostedJobId(data.id);
        setShowSuccessModal(true);
        // Refresh previous jobs list if we're on that tab
        if (tabValue === 1) {
          fetchPreviousJobs();
        }
      }

      // Reset form
      setFormData({
        role: '',
        department: '',
        locations: [],
        remote_status: 'onsite',
        company_info: '',
        mission: '',
        skills: '',
        perks: '',
        application_process: ''
      });
      setPendingQuestions([]);
    } catch (error) {
      console.error('Error posting job:', error);
      setSnackbar({
        open: true,
        message: 'Failed to post job opening',
        severity: 'error'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(`${window.location.origin}/jobs/${postedJobId}`);
    setSnackbar({
      open: true,
      message: 'Link copied!',
      severity: 'success'
    });
  };

  const getRemoteStatusLabel = (status: string) => {
    switch (status) {
      case 'onsite': return 'On-site';
      case 'remote': return 'Remote';
      case 'hybrid': return 'Hybrid';
      default: return status;
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" component="h1" gutterBottom>
        Job Openings Management
      </Typography>
      
      <Paper sx={{ mt: 3 }}>
        <Tabs value={tabValue} onChange={(_, newValue) => setTabValue(newValue)}>
          <Tab label="Create New Job" />
          <Tab label="Previous Job Postings" />
        </Tabs>
        
        <Box sx={{ p: 3 }}>
          {tabValue === 0 && (
            <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              required
              label="Role"
              name="role"
              value={formData.role}
              onChange={handleInputChange}
              error={!!errors.role}
              helperText={errors.role}
              placeholder="e.g. Senior Software Engineer"
            />
          </Grid>

          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              required
              label="Department"
              name="department"
              value={formData.department}
              onChange={handleInputChange}
              error={!!errors.department}
              helperText={errors.department}
              placeholder="e.g. Engineering, Marketing, Sales"
            />
          </Grid>

          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Add Location"
              value={locationInput}
              onChange={(e) => setLocationInput(e.target.value)}
              onKeyDown={handleAddLocation}
              placeholder="Type location and press Enter"
              error={!!errors.locations}
              helperText={errors.locations || 'Press Enter to add location'}
            />
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mt: 1 }}>
              {formData.locations.map((location, index) => (
                <Chip
                  key={index}
                  label={location}
                  onDelete={() => handleRemoveLocation(location)}
                  color="primary"
                />
              ))}
            </Box>
          </Grid>

          <Grid item xs={12} md={6}>
            <FormControl fullWidth required>
              <InputLabel>Remote Status</InputLabel>
              <Select
                name="remote_status"
                value={formData.remote_status}
                onChange={handleSelectChange}
                label="Remote Status"
              >
                <MenuItem value="onsite">On-site</MenuItem>
                <MenuItem value="remote">Remote</MenuItem>
                <MenuItem value="hybrid">Hybrid</MenuItem>
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={12}>
            <TextField
              fullWidth
              multiline
              rows={4}
              label="Company Information"
              name="company_info"
              value={formData.company_info}
              onChange={handleInputChange}
              placeholder="Brief description about your company"
            />
          </Grid>

          <Grid item xs={12}>
            <TextField
              fullWidth
              multiline
              rows={4}
              label="Mission"
              name="mission"
              value={formData.mission}
              onChange={handleInputChange}
              placeholder="What's the mission of this role?"
            />
          </Grid>

          <Grid item xs={12}>
            <TextField
              fullWidth
              multiline
              rows={4}
              label="Required Skills"
              name="skills"
              value={formData.skills}
              onChange={handleInputChange}
              placeholder="List the required skills and qualifications"
            />
          </Grid>

          <Grid item xs={12}>
            <TextField
              fullWidth
              multiline
              rows={4}
              label="Perks & Benefits"
              name="perks"
              value={formData.perks}
              onChange={handleInputChange}
              placeholder="What perks and benefits do you offer?"
            />
          </Grid>

          <Grid item xs={12}>
            <TextField
              fullWidth
              multiline
              rows={4}
              label="Application Process"
              name="application_process"
              value={formData.application_process}
              onChange={handleInputChange}
              placeholder="Describe the application and interview process"
            />
          </Grid>

          <Grid item xs={12}>
            <CustomQuestionManager
              jobId="new"
              isNewJob={true}
              onQuestionsChange={setPendingQuestions}
            />
          </Grid>

          <Grid item xs={12}>
            <Box sx={{ display: 'flex', gap: 2, mt: 2 }}>
              <Button
                variant="outlined"
                color="primary"
                onClick={handlePreview}
                disabled={isLoading}
              >
                Preview
              </Button>
              <Button
                variant="contained"
                color="primary"
                onClick={handleSubmit}
                disabled={isLoading}
              >
                {isLoading ? <CircularProgress size={24} /> : 'Post Job'}
              </Button>
            </Box>
          </Grid>
            </Grid>
          )}
          
          {tabValue === 1 && (
            <Box>
              {previousJobsLoading ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
                  <CircularProgress />
                </Box>
              ) : previousJobs.length === 0 ? (
                <Box sx={{ textAlign: 'center', p: 4 }}>
                  <Typography variant="h6" color="text.secondary">
                    No job postings found
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                    Create your first job posting using the "Create New Job" tab
                  </Typography>
                </Box>
              ) : (
                <Grid container spacing={3}>
                  {previousJobs.map((job) => (
                    <Grid item xs={12} md={6} lg={4} key={job.id}>
                      <Card sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
                        <CardContent sx={{ flexGrow: 1 }}>
                          <Typography variant="h6" gutterBottom>
                            {job.role}
                          </Typography>
                          <Typography variant="body2" color="text.secondary" gutterBottom>
                            {job.department}
                          </Typography>
                          <Box sx={{ mb: 2 }}>
                            <Chip 
                              label={getRemoteStatusLabel(job.remote_status)} 
                              color="success" 
                              size="small"
                              sx={{ mr: 1, mb: 1 }}
                            />
                            {job.locations.map((location, index) => (
                              <Chip 
                                key={index}
                                label={location} 
                                variant="outlined" 
                                size="small"
                                sx={{ mr: 1, mb: 1 }}
                              />
                            ))}
                          </Box>
                          <Typography variant="caption" color="text.secondary">
                            Posted: {new Date(job.created_at).toLocaleDateString()}
                          </Typography>
                        </CardContent>
                        <CardActions sx={{ flexWrap: 'wrap', gap: 0.5, p: 1 }}>
                          <Button 
                            size="small" 
                            startIcon={<Visibility />}
                            onClick={() => handleViewJob(job.id)}
                            sx={{ m: 0.5 }}
                          >
                            View
                          </Button>
                          <Button 
                            size="small" 
                            startIcon={<ContentCopy />}
                            onClick={() => handleCopyJobLink(job.id)}
                            sx={{ m: 0.5 }}
                          >
                            Copy Link
                          </Button>
                          <Button 
                            size="small" 
                            startIcon={<People />}
                            onClick={async () => {
                              setShowApplicantsDialog({ 
                                jobId: job.id, 
                                jobRole: job.role,
                                department: job.department,
                                remote_status: job.remote_status,
                                created_at: job.created_at
                              });
                              setApplicantsLoading(true);
                              try {
                                console.log('=== JOB OPENING APPLICATIONS DEBUG ===');
                                console.log('Fetching applications for job ID:', job.id);
                                console.log('Job role:', job.role);
                                
                                // Use the correct service to get applications by job ID
                                const applications = await getApplicationsByJobId(job.id);
                                
                                console.log('Found applications:', applications.length);
                                console.log('Applications data:', applications);
                                console.log('=== END DEBUG ===');
                                
                                setJobApplicants(applications);
                              } catch (error) {
                                console.error('Failed to fetch applicants:', error);
                                setSnackbar({
                                  open: true,
                                  message: 'Failed to load applicants',
                                  severity: 'error'
                                });
                              } finally {
                                setApplicantsLoading(false);
                              }
                            }}
                            sx={{ m: 0.5 }}
                          >
                            Applicants
                          </Button>
                          <Button 
                            size="small" 
                            startIcon={<Settings />}
                            onClick={() => setShowCustomQuestionsDialog(job.id)}
                            sx={{ m: 0.5 }}
                          >
                            Questions
                          </Button>
                          <Button 
                            size="small" 
                            color="error"
                            startIcon={<Delete />}
                            onClick={() => handleDeleteJob(job.id)}
                            sx={{ m: 0.5 }}
                          >
                            Delete
                          </Button>
                        </CardActions>
                      </Card>
                    </Grid>
                  ))}
                </Grid>
              )}
            </Box>
          )}
        </Box>
      </Paper>

      {/* Success Dialog */}
      <Dialog open={showSuccessModal} onClose={() => setShowSuccessModal(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          Job Posted Successfully! 🎉
          <IconButton
            aria-label="close"
            onClick={() => setShowSuccessModal(false)}
            sx={{ position: 'absolute', right: 8, top: 8 }}
          >
            <Close />
          </IconButton>
        </DialogTitle>
        <DialogContent>
          <Stack spacing={3}>
            <Typography>
              Your job opening has been posted successfully. Share this link with potential candidates:
            </Typography>
            <Paper variant="outlined" sx={{ p: 2 }}>
              <Typography variant="body2" sx={{ wordBreak: 'break-all' }}>
                {window.location.origin}/jobs/{postedJobId}
              </Typography>
            </Paper>
            <Stack direction="row" spacing={2}>
              <Button
                variant="contained"
                startIcon={<ContentCopy />}
                onClick={handleCopyLink}
              >
                Copy Link
              </Button>
              <Button
                variant="outlined"
                startIcon={<Visibility />}
                onClick={() => window.open(`/jobs/${postedJobId}`, '_blank')}
              >
                View Job Posting
              </Button>
            </Stack>
          </Stack>
        </DialogContent>
      </Dialog>

      {/* Custom Questions Dialog for existing jobs */}
      <Dialog 
        open={!!showCustomQuestionsDialog} 
        onClose={() => setShowCustomQuestionsDialog(null)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          Manage Custom Questions
          <IconButton
            aria-label="close"
            onClick={() => setShowCustomQuestionsDialog(null)}
            sx={{ position: 'absolute', right: 8, top: 8 }}
          >
            <Close />
          </IconButton>
        </DialogTitle>
        <DialogContent>
          {showCustomQuestionsDialog && (
            <CustomQuestionManager
              jobId={showCustomQuestionsDialog}
              isNewJob={false}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Applicants Dialog */}
      <Dialog 
        open={!!showApplicantsDialog} 
        onClose={() => {
          setShowApplicantsDialog(null);
          setJobApplicants([]);
        }}
        maxWidth="lg"
        fullWidth
        PaperProps={{
          sx: {
            height: '80vh',
            display: 'flex',
            flexDirection: 'column'
          }
        }}
      >
        <DialogTitle sx={{ p: 0 }}>
          <Box
            sx={{
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              color: 'white',
              p: 3,
              position: 'relative'
            }}
          >
            <IconButton
              aria-label="close"
              onClick={() => {
                setShowApplicantsDialog(null);
                setJobApplicants([]);
              }}
              sx={{ 
                position: 'absolute', 
                right: 8, 
                top: 8,
                color: 'white',
                bgcolor: 'rgba(255,255,255,0.1)',
                '&:hover': {
                  bgcolor: 'rgba(255,255,255,0.2)'
                }
              }}
            >
              <Close />
            </IconButton>
            
            <Typography variant="h5" component="div" fontWeight="bold" gutterBottom>
              {showApplicantsDialog?.jobRole}
            </Typography>
            
            <Stack direction="row" spacing={3} sx={{ mt: 2, flexWrap: 'wrap' }}>
              <Stack direction="row" spacing={1} alignItems="center">
                <WorkOutline sx={{ fontSize: 20, opacity: 0.9 }} />
                <Typography variant="body2" sx={{ opacity: 0.9 }}>
                  {showApplicantsDialog?.department}
                </Typography>
              </Stack>
              <Stack direction="row" spacing={1} alignItems="center">
                <LocationOn sx={{ fontSize: 20, opacity: 0.9 }} />
                <Typography variant="body2" sx={{ opacity: 0.9 }}>
                  {showApplicantsDialog?.remote_status === 'onsite' ? 'On-site' : 
                   showApplicantsDialog?.remote_status === 'remote' ? 'Remote' : 
                   showApplicantsDialog?.remote_status === 'hybrid' ? 'Hybrid' : 
                   showApplicantsDialog?.remote_status}
                </Typography>
              </Stack>
              <Stack direction="row" spacing={1} alignItems="center">
                <People sx={{ fontSize: 20, opacity: 0.9 }} />
                <Typography variant="body2" sx={{ opacity: 0.9 }}>
                  {jobApplicants.length} {jobApplicants.length === 1 ? 'Applicant' : 'Applicants'}
                </Typography>
              </Stack>
              <Stack direction="row" spacing={1} alignItems="center">
                <CalendarToday sx={{ fontSize: 20, opacity: 0.9 }} />
                <Typography variant="body2" sx={{ opacity: 0.9 }}>
                  Posted {showApplicantsDialog?.created_at ? 
                    new Date(showApplicantsDialog.created_at).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric'
                    }) : 'Recently'}
                </Typography>
              </Stack>
            </Stack>
          </Box>
        </DialogTitle>
        <DialogContent sx={{ p: 3, overflow: 'auto', flex: 1 }}>
          {applicantsLoading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
              <CircularProgress />
            </Box>
          ) : jobApplicants.length === 0 ? (
            <Box sx={{ py: 6, textAlign: 'center' }}>
              <People sx={{ fontSize: 64, color: 'text.disabled', mb: 2 }} />
              <Typography variant="h6" color="text.secondary" gutterBottom>
                No applicants yet
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Share the job link to start receiving applications
              </Typography>
            </Box>
          ) : (
            <Grid container spacing={2}>
              {jobApplicants.map((applicant) => (
                <Grid item xs={12} key={applicant.id}>
                  <Card 
                    elevation={1}
                    sx={{ 
                      transition: 'all 0.3s',
                      '&:hover': {
                        elevation: 3,
                        transform: 'translateY(-2px)'
                      }
                    }}
                  >
                    <CardContent>
                      <Grid container spacing={2}>
                        <Grid item xs={12} md={8}>
                          <Box>
                            <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1 }}>
                              <PersonOutline sx={{ fontSize: 20, color: 'primary.main' }} />
                              <Typography variant="h6" fontWeight="medium">
                                {`${applicant.first_name} ${applicant.last_name}`}
                              </Typography>
                            </Stack>
                            
                            <Stack spacing={1}>
                              <Stack direction="row" spacing={2} alignItems="center">
                                <EmailIcon sx={{ fontSize: 18, color: 'text.secondary' }} />
                                <Typography variant="body2" color="text.primary">
                                  {applicant.email}
                                </Typography>
                              </Stack>
                              
                              {applicant.phone && (
                                <Stack direction="row" spacing={2} alignItems="center">
                                  <Phone sx={{ fontSize: 18, color: 'text.secondary' }} />
                                  <Typography variant="body2" color="text.primary">
                                    {applicant.phone}
                                  </Typography>
                                </Stack>
                              )}
                              
                              <Stack direction="row" spacing={2} alignItems="center">
                                <CalendarToday sx={{ fontSize: 18, color: 'text.secondary' }} />
                                <Typography variant="body2" color="text.secondary">
                                  Applied {new Date(applicant.created_at).toLocaleDateString('en-US', {
                                    month: 'short',
                                    day: 'numeric',
                                    year: 'numeric'
                                  })} at {new Date(applicant.created_at).toLocaleTimeString('en-US', {
                                    hour: 'numeric',
                                    minute: '2-digit',
                                    hour12: true
                                  })}
                                </Typography>
                              </Stack>
                            </Stack>
                          </Box>
                        </Grid>
                        
                        <Grid item xs={12} md={4}>
                          <Stack 
                            spacing={1} 
                            direction={{ xs: 'row', md: 'column' }}
                            justifyContent="center"
                            alignItems="center"
                            sx={{ height: '100%' }}
                          >
                            <Button
                              variant="outlined"
                              startIcon={<EmailIcon />}
                              size="small"
                              onClick={() => window.location.href = `mailto:${applicant.email}`}
                              fullWidth
                            >
                              Email
                            </Button>
                            {applicant.resume_url && (
                              <Button
                                variant="contained"
                                startIcon={<Description />}
                                size="small"
                                onClick={() => applicant.resume_url && window.open(applicant.resume_url, '_blank')}
                                fullWidth
                              >
                                View Resume
                              </Button>
                            )}
                          </Stack>
                        </Grid>
                      </Grid>
                      
                      {applicant.custom_fields && Object.keys(applicant.custom_fields).length > 0 && (
                        <Box sx={{ mt: 3, pt: 2, borderTop: '1px solid', borderColor: 'divider' }}>
                          <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 2 }}>
                            <QuestionAnswer sx={{ fontSize: 20, color: 'primary.main' }} />
                            <Typography variant="subtitle2" fontWeight="bold" color="primary.main">
                              Job-Specific Questions
                            </Typography>
                          </Stack>
                          
                          <Grid container spacing={2}>
                            {Object.entries(applicant.custom_fields).map(([question, answer]) => (
                              <Grid item xs={12} sm={6} key={question}>
                                <Box
                                  sx={{
                                    p: 2,
                                    borderRadius: 2,
                                    backgroundColor: 'grey.50',
                                    border: '1px solid',
                                    borderColor: 'grey.200'
                                  }}
                                >
                                  <Typography 
                                    variant="caption" 
                                    color="text.secondary" 
                                    sx={{ 
                                      fontWeight: 600,
                                      textTransform: 'uppercase',
                                      letterSpacing: 0.5
                                    }}
                                  >
                                    {question}
                                  </Typography>
                                  <Typography 
                                    variant="body2" 
                                    sx={{ 
                                      mt: 0.5,
                                      fontWeight: 500,
                                      color: 'text.primary'
                                    }}
                                  >
                                    {Array.isArray(answer) ? answer.join(', ') : String(answer)}
                                  </Typography>
                                </Box>
                              </Grid>
                            ))}
                          </Grid>
                        </Box>
                      )}
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          )}
        </DialogContent>
      </Dialog>

      {/* Snackbar for notifications */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
      >
        <Alert
          onClose={() => setSnackbar({ ...snackbar, open: false })}
          severity={snackbar.severity}
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default JobsOpening;