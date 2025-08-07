import React, { useState, useEffect } from 'react';
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
} from '@mui/material';
import { ContentCopy, Visibility, Close, Delete, Settings} from '@mui/icons-material';
import { supabase } from '../../../../lib/supabase';
import { useUserAndCompanyData } from '../../../../shared/hooks/useUserAndCompanyData';
import { useSession } from '../../../../shared/hooks/useSession';
import CustomQuestionManager from './CustomQuestionManager';

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
  const [isLoading, setIsLoading] = useState(false);
  const [locationInput, setLocationInput] = useState('');
  const [postedJobId, setPostedJobId] = useState<string | null>(null);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' as 'success' | 'error' | 'warning' | 'info' });
  const [tabValue, setTabValue] = useState(0);
  const [previousJobs, setPreviousJobs] = useState<PreviousJob[]>([]);
  const [previousJobsLoading, setPreviousJobsLoading] = useState(false);
  const [pendingQuestions, setPendingQuestions] = useState<any[]>([]);
  const [showCustomQuestionsDialog, setShowCustomQuestionsDialog] = useState<string | null>(null);
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
  const [errors, setErrors] = useState<Partial<JobFormData>>({});

  useEffect(() => {
    if (userInfo?.company_id && tabValue === 1) {
      fetchPreviousJobs();
    }
  }, [userInfo?.company_id, tabValue]);

  const fetchPreviousJobs = async () => {
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
  };

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
    } catch (error: any) {
      console.error('Error deleting job:', error);
      setSnackbar({
        open: true,
        message: `Failed to delete job posting: ${error.message || 'Unknown error'}`,
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
    const newErrors: Partial<JobFormData> = {};
    if (!formData.role.trim()) newErrors.role = 'Role is required';
    if (!formData.department.trim()) newErrors.department = 'Department is required';
    if (formData.locations.length === 0) newErrors.locations = ['At least one location is required'] as any;
    
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

  const handleSelectChange = (e: any) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
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