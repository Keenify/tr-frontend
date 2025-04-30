import React, { useState, useEffect, useCallback } from 'react';
import { 
  Dialog, 
  DialogTitle, 
  DialogContent, 
  DialogActions,
  TextField,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormHelperText,
  Grid,
  Typography,
  Chip,
  Box,
  Stack,
  SelectChangeEvent
} from '@mui/material';
import { Paperclip, X, Upload } from 'react-feather';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { LocalizationProvider, DatePicker } from '@mui/x-date-pickers';
import { ApplicantFormData, ApplicationStage } from '../types/hiring.types';
import useJobApplications from '../services/useJobApplications';

const defaultFormData: ApplicantFormData = {
  full_name: '',
  email: '',
  phone: '',
  country: '',
  city: '',
  linkedin_profile: '',
  job_applied_for: '',
  expected_salary: null,
  available_start_date: null,
  employment_type: 'full-time',
  cv_file: null,
  notes: '',
  status: 'pre-hire'
};

interface ApplicantFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultStatus: ApplicationStage;
  applicationId?: string;
}

const ApplicantFormModal: React.FC<ApplicantFormModalProps> = ({
  isOpen,
  onClose,
  defaultStatus,
  applicationId
}) => {
  const { 
    loading, 
    createJobApplication, 
    updateJobApplication, 
    getJobApplicationById 
  } = useJobApplications();
  
  const [formData, setFormData] = useState<ApplicantFormData>({
    ...defaultFormData,
    status: defaultStatus
  });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [cvFile, setCvFile] = useState<File | null>(null);
  const [editMode, setEditMode] = useState(false);

  // Fetch existing application data - memoized with proper dependencies
  const fetchApplication = useCallback(async (id: string) => {
    try {
      const application = await getJobApplicationById(id);
      
      // Convert the data to form format
      setFormData({
        full_name: application.full_name,
        email: application.email,
        phone: application.phone,
        country: application.country,
        city: application.city,
        linkedin_profile: application.linkedin_profile || '',
        job_applied_for: application.job_applied_for,
        expected_salary: application.expected_salary,
        available_start_date: application.available_start_date,
        employment_type: application.employment_type,
        cv_file: null, // File cannot be fetched back
        notes: application.notes || '',
        status: application.status
      });
    } catch (err) {
      console.error('Failed to fetch application:', err);
    }
  }, [getJobApplicationById]);

  // Only reset form state when the modal opens or closes, or when applicationId changes
  useEffect(() => {
    if (isOpen) {
      if (!applicationId) {
        // Reset form for new application
        setFormData({
          ...defaultFormData,
          status: defaultStatus
        });
        setCvFile(null);
        setEditMode(false);
      } else {
        // Edit mode - fetch existing application
        setEditMode(true);
        fetchApplication(applicationId);
      }
      setFormErrors({});
    }
  }, [isOpen, applicationId, defaultStatus]); // Removed fetchApplication to prevent infinite loop

  // Handle text input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear error for this field if it exists
    if (formErrors[name]) {
      setFormErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  // Handle date change
  const handleDateChange = (date: Date | null) => {
    setFormData(prev => ({
      ...prev,
      available_start_date: date ? date.toISOString().split('T')[0] : null
    }));
  };

  // Handle CV file selection
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      setCvFile(file);
      setFormData(prev => ({
        ...prev,
        cv_file: file
      }));
      
      if (formErrors.cv_file) {
        setFormErrors(prev => ({ ...prev, cv_file: '' }));
      }
    }
  };

  // Clear selected CV file
  const handleClearFile = () => {
    setCvFile(null);
    setFormData(prev => ({
      ...prev,
      cv_file: null
    }));
  };

  // Handle select change
  const handleSelectChange = (e: SelectChangeEvent) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    if (formErrors[name]) {
      setFormErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  // Validate form before submission
  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};
    
    if (!formData.full_name.trim()) {
      errors.full_name = 'Full name is required';
    }
    
    if (!formData.email.trim()) {
      errors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      errors.email = 'Please enter a valid email address';
    }
    
    if (!formData.phone.trim()) {
      errors.phone = 'Phone number is required';
    }
    
    if (!formData.country.trim()) {
      errors.country = 'Country is required';
    }
    
    if (!formData.city.trim()) {
      errors.city = 'City is required';
    }
    
    if (!formData.job_applied_for.trim()) {
      errors.job_applied_for = 'Job title is required';
    }
    
    // Only require CV for new applications
    if (!editMode && !formData.cv_file) {
      errors.cv_file = 'CV file is required';
    }
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      if (editMode && applicationId) {
        await updateJobApplication(applicationId, formData);
      } else {
        await createJobApplication(formData);
      }
      
      onClose();
    } catch (err) {
      console.error('Error saving application:', err);
      // Show a general error
      setFormErrors(prev => ({
        ...prev,
        general: 'Failed to save application. Please try again.'
      }));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog
      open={isOpen}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      aria-labelledby="application-form-dialog-title"
    >
      <DialogTitle id="application-form-dialog-title">
        {editMode ? 'Edit Job Application' : 'New Job Application'}
      </DialogTitle>
      
      <form onSubmit={handleSubmit}>
        <DialogContent dividers>
          <Grid container spacing={3}>
            {/* Applicant Information */}
            <Grid item xs={12}>
              <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                Applicant Information
              </Typography>
            </Grid>
            
            <Grid item xs={12} md={6}>
              <TextField
                label="Full Name"
                name="full_name"
                value={formData.full_name}
                onChange={handleInputChange}
                fullWidth
                required
                error={!!formErrors.full_name}
                helperText={formErrors.full_name}
                inputProps={{ maxLength: 100 }}
              />
            </Grid>
            
            <Grid item xs={12} md={6}>
              <TextField
                label="Email Address"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleInputChange}
                fullWidth
                required
                error={!!formErrors.email}
                helperText={formErrors.email}
                inputProps={{ maxLength: 100 }}
              />
            </Grid>
            
            <Grid item xs={12} md={6}>
              <TextField
                label="Phone Number"
                name="phone"
                value={formData.phone}
                onChange={handleInputChange}
                fullWidth
                required
                error={!!formErrors.phone}
                helperText={formErrors.phone}
                inputProps={{ maxLength: 20 }}
              />
            </Grid>
            
            <Grid item xs={12} md={6}>
              <TextField
                label="LinkedIn Profile URL"
                name="linkedin_profile"
                value={formData.linkedin_profile || ''}
                onChange={handleInputChange}
                fullWidth
                placeholder="https://linkedin.com/in/profile"
                inputProps={{ maxLength: 255 }}
              />
            </Grid>
            
            <Grid item xs={12} md={6}>
              <TextField
                label="Country"
                name="country"
                value={formData.country}
                onChange={handleInputChange}
                fullWidth
                required
                error={!!formErrors.country}
                helperText={formErrors.country}
                inputProps={{ maxLength: 100 }}
              />
            </Grid>
            
            <Grid item xs={12} md={6}>
              <TextField
                label="City"
                name="city"
                value={formData.city}
                onChange={handleInputChange}
                fullWidth
                required
                error={!!formErrors.city}
                helperText={formErrors.city}
                inputProps={{ maxLength: 100 }}
              />
            </Grid>
            
            {/* Job Information */}
            <Grid item xs={12} sx={{ mt: 2 }}>
              <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                Job Information
              </Typography>
            </Grid>
            
            <Grid item xs={12} md={6}>
              <TextField
                label="Job Applied For"
                name="job_applied_for"
                value={formData.job_applied_for}
                onChange={handleInputChange}
                fullWidth
                required
                error={!!formErrors.job_applied_for}
                helperText={formErrors.job_applied_for}
                inputProps={{ maxLength: 100 }}
              />
            </Grid>
            
            <Grid item xs={12} md={6}>
              <TextField
                label="Expected Salary"
                name="expected_salary"
                type="text"
                value={formData.expected_salary || ''}
                onChange={handleInputChange}
                fullWidth
                placeholder="e.g., $80,000 or €5,000/month"
                inputProps={{ maxLength: 50 }}
              />
            </Grid>
            
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel id="employment-type-label">Employment Type</InputLabel>
                <Select
                  labelId="employment-type-label"
                  id="employment-type-select"
                  name="employment_type"
                  value={formData.employment_type}
                  label="Employment Type"
                  onChange={handleSelectChange}
                >
                  <MenuItem value="full-time">Full-time</MenuItem>
                  <MenuItem value="part-time">Part-time</MenuItem>
                  <MenuItem value="contract">Contract</MenuItem>
                  <MenuItem value="internship">Internship</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            
            <Grid item xs={12} md={6}>
              <LocalizationProvider dateAdapter={AdapterDateFns}>
                <DatePicker
                  label="Available Start Date"
                  value={formData.available_start_date ? new Date(formData.available_start_date) : null}
                  onChange={handleDateChange}
                  slotProps={{
                    textField: {
                      fullWidth: true,
                    },
                  }}
                />
              </LocalizationProvider>
            </Grid>
            
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel id="status-label">Application Status</InputLabel>
                <Select
                  labelId="status-label"
                  id="status-select"
                  name="status"
                  value={formData.status}
                  label="Application Status"
                  onChange={handleSelectChange}
                >
                  <MenuItem value="pre-hire">Pre-Hire</MenuItem>
                  <MenuItem value="interview">Interview</MenuItem>
                  <MenuItem value="post-hired">Post-Hired</MenuItem>
                  <MenuItem value="rejected">Rejected</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            
            {/* CV Upload */}
            <Grid item xs={12} sx={{ mt: 2 }}>
              <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                CV Upload
              </Typography>
            </Grid>
            
            <Grid item xs={12}>
              <Box 
                sx={{ 
                  border: '1px dashed',
                  borderColor: formErrors.cv_file ? 'error.main' : 'divider',
                  borderRadius: 1,
                  p: 2,
                  mb: 1
                }}
              >
                {cvFile ? (
                  <Stack 
                    direction="row" 
                    alignItems="center" 
                    justifyContent="space-between"
                  >
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <Paperclip size={18} />
                      <Typography variant="body2" sx={{ ml: 1 }}>
                        {cvFile.name} ({(cvFile.size / 1024).toFixed(2)} KB)
                      </Typography>
                    </Box>
                    <Chip 
                      label="Remove" 
                      size="small" 
                      onDelete={handleClearFile}
                      deleteIcon={<X size={16} />}
                    />
                  </Stack>
                ) : (
                  <Stack 
                    direction="column" 
                    alignItems="center"
                    sx={{ 
                      cursor: 'pointer',
                      py: 2 
                    }}
                    onClick={() => document.getElementById('cv-upload')?.click()}
                  >
                    <Upload size={24} color="#666" />
                    <Typography variant="body2" sx={{ mt: 1 }}>
                      Click to upload CV (PDF/DOC)
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Max file size: 5MB
                    </Typography>
                  </Stack>
                )}
                <input
                  title="CV Upload"
                  aria-label="Upload CV"
                  id="cv-upload"
                  type="file"
                  accept=".pdf,.doc,.docx"
                  onChange={handleFileChange}
                  style={{ display: 'none' }}
                />
              </Box>
              {formErrors.cv_file && (
                <FormHelperText error>{formErrors.cv_file}</FormHelperText>
              )}
            </Grid>
            
            {/* Notes */}
            <Grid item xs={12} sx={{ mt: 2 }}>
              <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                Additional Information
              </Typography>
            </Grid>
            
            <Grid item xs={12}>
              <TextField
                label="Notes (Internal)"
                name="notes"
                value={formData.notes || ''}
                onChange={handleInputChange}
                fullWidth
                multiline
                rows={4}
                placeholder="Add any internal comments or notes about this applicant..."
              />
            </Grid>
            
            {/* General Error Message */}
            {formErrors.general && (
              <Grid item xs={12}>
                <Typography color="error" variant="body2">
                  {formErrors.general}
                </Typography>
              </Grid>
            )}
          </Grid>
        </DialogContent>
        
        <DialogActions>
          <Button onClick={onClose} color="inherit">
            Cancel
          </Button>
          <Button 
            type="submit"
            variant="contained" 
            color="primary"
            disabled={isSubmitting || loading}
          >
            {isSubmitting ? 'Saving...' : (editMode ? 'Update' : 'Create')}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
};

export default ApplicantFormModal; 