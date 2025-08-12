import React, { useState } from 'react';
import {
  Box,
  Button,
  TextField,
  FormControl,
  Select,
  MenuItem,
  Slider,
  Typography,
  Paper,
  Grid,
  FormControlLabel,
  Checkbox,
  FormGroup,
  RadioGroup,
  Radio,
  Chip,
  Stack,
  CircularProgress,
  Snackbar,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material';
import { Upload, CheckCircle } from '@mui/icons-material';
import { supabase } from '../../../../lib/supabase';

interface CustomQuestion {
  id: string;
  job_id: string;
  question_text: string;
  question_type: 'text' | 'dropdown' | 'checkbox' | 'scale' | 'yes_no';
  is_required: boolean;
  options?: string[];
  min_value?: number;
  max_value?: number;
  sort_order: number;
}

interface ApplicationFormData {
  job_id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  resume_url: string;
  custom_fields: Record<string, any>;
}

interface JobApplicationFormProps {
  jobId: string;
  jobTitle: string;
  onClose: () => void;
  open: boolean;
}


const JobApplicationForm: React.FC<JobApplicationFormProps> = ({
  jobId,
  jobTitle,
  onClose,
  open,
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [isFileUploading, setIsFileUploading] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [customQuestions, setCustomQuestions] = useState<CustomQuestion[]>([]);
  const [companyName, setCompanyName] = useState<string>('');
  const [departmentName, setDepartmentName] = useState<string>('');
  const [snackbar, setSnackbar] = useState({ 
    open: false, 
    message: '', 
    severity: 'success' as 'success' | 'error' 
  });
  
  const [formData, setFormData] = useState<ApplicationFormData>({
    job_id: jobId,
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    resume_url: '',
    custom_fields: {},
  });
  
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [customFieldErrors, setCustomFieldErrors] = useState<Record<string, string>>({});

  // Fetch custom questions and company info when the form opens
  React.useEffect(() => {
    if (open && jobId) {
      fetchCustomQuestions();
      fetchCompanyInfo();
    }
  }, [open, jobId]);

  const fetchCustomQuestions = async () => {
    try {
      const { data, error } = await supabase
        .from('job_custom_questions')
        .select('*')
        .eq('job_id', jobId)
        .order('sort_order', { ascending: true });

      if (error) throw error;
      setCustomQuestions(data || []);
      
      // Initialize custom fields with default values
      const initialCustomFields: Record<string, any> = {};
      data?.forEach(question => {
        if (question.question_type === 'checkbox') {
          initialCustomFields[question.id] = [];
        } else if (question.question_type === 'scale') {
          initialCustomFields[question.id] = question.min_value || 1;
        } else if (question.question_type === 'yes_no') {
          initialCustomFields[question.id] = null; // No pre-selection
        } else {
          initialCustomFields[question.id] = '';
        }
      });
      
      setFormData(prev => ({
        ...prev,
        custom_fields: initialCustomFields
      }));
    } catch (error: unknown) {
      console.error('Error fetching custom questions:', error);
    }
  };

  const fetchCompanyInfo = async () => {
    try {
      // Try to fetch job details with company name from companies table
      const { data, error } = await supabase
        .from('jobs_opening')
        .select(`
          department,
          companies (
            name
          )
        `)
        .eq('id', jobId)
        .single();

      if (error) {
        // Fallback: get job details only
        const { data: jobData, error: jobError } = await supabase
          .from('jobs_opening')
          .select('department')
          .eq('id', jobId)
          .single();

        if (!jobError && jobData) {
          setDepartmentName(jobData.department || '');
        }
        
        setCompanyName('Company');
      } else if (data) {
        // Success with join
        setDepartmentName(data.department || '');
        setCompanyName((data.companies as any)?.name || 'Company');
      }
    } catch (error: unknown) {
      console.error('Error fetching company info:', error);
      // Set fallback company name if fetch fails
      setCompanyName('Company');
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    const newCustomErrors: Record<string, string> = {};
    
    if (!formData.first_name.trim()) newErrors.first_name = 'First name is required';
    if (!formData.last_name.trim()) newErrors.last_name = 'Last name is required';
    if (!formData.email.trim()) newErrors.email = 'Email is required';
    
    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (formData.email && !emailRegex.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }
    
    // Validate custom questions
    customQuestions.forEach(question => {
      if (question.is_required) {
        const value = formData.custom_fields[question.id];
        if (question.question_type === 'checkbox' && (!value || value.length === 0)) {
          newCustomErrors[question.id] = 'This field is required';
        } else if (question.question_type === 'yes_no' && value === null) {
          newCustomErrors[question.id] = 'This field is required';
        } else if (question.question_type !== 'checkbox' && question.question_type !== 'yes_no' && !value && value !== 0) {
          newCustomErrors[question.id] = 'This field is required';
        }
      }
    });
    
    setErrors(newErrors);
    setCustomFieldErrors(newCustomErrors);
    return Object.keys(newErrors).length === 0 && Object.keys(newCustomErrors).length === 0;
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  const handleCustomFieldChange = (questionId: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      custom_fields: {
        ...prev.custom_fields,
        [questionId]: value
      }
    }));
    
    // Clear error when user changes custom field
    if (customFieldErrors[questionId]) {
      setCustomFieldErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[questionId];
        return newErrors;
      });
    }
  };

  const renderCustomField = (question: CustomQuestion) => {
    const value = formData.custom_fields[question.id];
    const error = customFieldErrors[question.id];

    switch (question.question_type) {
      case 'text':
        return (
          <Box>
            <Typography 
              variant="subtitle1" 
              sx={{ 
                fontWeight: 600, 
                mb: 1,
                color: 'text.primary',
                display: 'flex',
                alignItems: 'center',
                gap: 1
              }}
            >
              📝 {question.question_text} {question.is_required && <Chip label="Required" size="small" color="primary" />}
            </Typography>
            <TextField
              fullWidth
              placeholder="Enter your response..."
              value={value || ''}
              onChange={(e) => handleCustomFieldChange(question.id, e.target.value)}
              error={!!error}
              helperText={error}
              multiline
              rows={3}
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: 2,
                  '&:hover fieldset': {
                    borderColor: 'primary.main',
                  },
                },
              }}
            />
          </Box>
        );
      
      case 'dropdown':
        return (
          <Box>
            <Typography 
              variant="subtitle1" 
              sx={{ 
                fontWeight: 600, 
                mb: 2,
                color: 'text.primary',
                display: 'flex',
                alignItems: 'center',
                gap: 1
              }}
            >
              🔽 {question.question_text} {question.is_required && <Chip label="Required" size="small" color="primary" />}
            </Typography>
            <FormControl fullWidth error={!!error}>
              <Select
                value={value || ''}
                onChange={(e) => handleCustomFieldChange(question.id, e.target.value)}
                displayEmpty
                sx={{
                  borderRadius: 2,
                  '&:hover .MuiOutlinedInput-notchedOutline': {
                    borderColor: 'primary.main',
                  },
                }}
              >
                <MenuItem value="" disabled>
                  <em>Please select an option...</em>
                </MenuItem>
                {question.options?.map((option) => (
                  <MenuItem key={option} value={option}>
                    {option}
                  </MenuItem>
                ))}
              </Select>
              {error && (
                <Typography variant="caption" color="error" sx={{ mt: 0.5 }}>
                  {error}
                </Typography>
              )}
            </FormControl>
          </Box>
        );
      
      case 'checkbox':
        return (
          <Box>
            <Typography 
              variant="subtitle1" 
              sx={{ 
                fontWeight: 600, 
                mb: 2,
                color: 'text.primary',
                display: 'flex',
                alignItems: 'center',
                gap: 1
              }}
            >
              ☑️ {question.question_text} {question.is_required && <Chip label="Required" size="small" color="primary" />}
            </Typography>
            <FormControl error={!!error} sx={{ width: '100%' }}>
              <Box sx={{ pl: 1 }}>
                <FormGroup>
                  {question.options?.map((option) => (
                    <FormControlLabel
                      key={option}
                      sx={{ 
                        mb: 1,
                        '& .MuiFormControlLabel-label': {
                          fontSize: '1rem',
                          fontWeight: 500
                        }
                      }}
                      control={
                        <Checkbox
                          checked={value?.includes(option) || false}
                          onChange={(e) => {
                            const currentValues = value || [];
                            if (e.target.checked) {
                              handleCustomFieldChange(question.id, [...currentValues, option]);
                            } else {
                              handleCustomFieldChange(
                                question.id,
                                currentValues.filter((v: string) => v !== option)
                              );
                            }
                          }}
                          sx={{
                            '&.Mui-checked': {
                              color: 'primary.main',
                            },
                          }}
                        />
                      }
                      label={option}
                    />
                  ))}
                </FormGroup>
              </Box>
              {error && (
                <Typography variant="caption" color="error" sx={{ mt: 0.5 }}>
                  {error}
                </Typography>
              )}
            </FormControl>
          </Box>
        );
      
      case 'scale':
        const min = question.min_value || 1;
        const max = question.max_value || 10;
        return (
          <Box>
            <Typography 
              variant="subtitle1" 
              sx={{ 
                fontWeight: 600, 
                mb: 1,
                color: 'text.primary',
                display: 'flex',
                alignItems: 'center',
                gap: 1
              }}
            >
              📊 {question.question_text} {question.is_required && <Chip label="Required" size="small" color="primary" />}
            </Typography>
            
            {/* Current Value Display */}
            <Box sx={{ 
              textAlign: 'center', 
              mb: 2, 
              p: 2, 
              bgcolor: 'primary.50', 
              borderRadius: 2,
              border: '2px solid',
              borderColor: 'primary.200'
            }}>
              <Typography variant="h4" sx={{ fontWeight: 'bold', color: 'primary.main', mb: 0.5 }}>
                {value || min}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Current Selection ({min} - {max})
              </Typography>
            </Box>
            
            <Box sx={{ px: 2, py: 1 }}>
              <Slider
                value={value || min}
                onChange={(_e, newValue) => handleCustomFieldChange(question.id, newValue as number)}
                min={min}
                max={max}
                step={1}
                marks={[
                  { value: min, label: String(min) },
                  { value: Math.floor((min + max) / 2), label: String(Math.floor((min + max) / 2)) },
                  { value: max, label: String(max) }
                ]}
                valueLabelDisplay="auto"
                sx={{
                  height: 8,
                  '& .MuiSlider-thumb': {
                    height: 24,
                    width: 24,
                    backgroundColor: 'primary.main',
                    boxShadow: '0 4px 8px rgba(0,0,0,0.2)',
                    '&:hover': {
                      boxShadow: '0 6px 12px rgba(0,0,0,0.3)',
                    },
                  },
                  '& .MuiSlider-track': {
                    height: 8,
                    background: 'linear-gradient(90deg, #4CAF50, #FF9800, #F44336)',
                  },
                  '& .MuiSlider-rail': {
                    height: 8,
                    opacity: 0.3,
                  },
                  '& .MuiSlider-mark': {
                    height: 12,
                    width: 2,
                    backgroundColor: 'grey.400',
                  },
                  '& .MuiSlider-markLabel': {
                    fontSize: '0.875rem',
                    fontWeight: 600,
                    color: 'text.primary',
                  },
                  '& .MuiSlider-valueLabel': {
                    backgroundColor: 'primary.main',
                    color: 'white',
                    fontWeight: 'bold',
                    fontSize: '1rem',
                  },
                }}
              />
            </Box>
            
            {error && (
              <Typography variant="caption" color="error" sx={{ mt: 1 }}>
                {error}
              </Typography>
            )}
          </Box>
        );
      
      case 'yes_no':
        return (
          <Box>
            <Typography 
              variant="subtitle1" 
              sx={{ 
                fontWeight: 600, 
                mb: 2,
                color: 'text.primary',
                display: 'flex',
                alignItems: 'center',
                gap: 1
              }}
            >
              ❓ {question.question_text} {question.is_required && <Chip label="Required" size="small" color="primary" />}
            </Typography>
            <FormControl error={!!error} sx={{ width: '100%' }}>
              <Box sx={{ pl: 1 }}>
                <RadioGroup
                  value={value === true ? 'yes' : value === false ? 'no' : ''}
                  onChange={(e) => handleCustomFieldChange(question.id, e.target.value === 'yes')}
                  sx={{ flexDirection: 'row', gap: 3 }}
                >
                  <FormControlLabel 
                    value="yes" 
                    control={
                      <Radio 
                        sx={{
                          '&.Mui-checked': {
                            color: 'success.main',
                          },
                        }}
                      />
                    } 
                    label={
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Typography sx={{ fontSize: '1rem', fontWeight: 500 }}>
                          ✅ Yes
                        </Typography>
                      </Box>
                    }
                  />
                  <FormControlLabel 
                    value="no" 
                    control={
                      <Radio 
                        sx={{
                          '&.Mui-checked': {
                            color: 'error.main',
                          },
                        }}
                      />
                    } 
                    label={
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Typography sx={{ fontSize: '1rem', fontWeight: 500 }}>
                          ❌ No
                        </Typography>
                      </Box>
                    }
                  />
                </RadioGroup>
              </Box>
              {error && (
                <Typography variant="caption" color="error" sx={{ mt: 0.5 }}>
                  {error}
                </Typography>
              )}
            </FormControl>
          </Box>
        );
      
      default:
        return null;
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    const allowedTypes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ];
    
    if (!allowedTypes.includes(file.type)) {
      setSnackbar({
        open: true,
        message: 'Please upload a PDF or Word document',
        severity: 'error'
      });
      return;
    }

    // Validate file size (5MB limit)
    if (file.size > 5 * 1024 * 1024) {
      setSnackbar({
        open: true,
        message: 'File size must be less than 5MB',
        severity: 'error'
      });
      return;
    }

    setIsFileUploading(true);
    try {
      // Try Supabase Storage first
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}.${fileExt}`;
      const filePath = `resumes/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('job-applications')
        .upload(filePath, file);

      if (uploadError) {
        console.error('Upload error details:', uploadError);
        
        // Fallback: Convert to base64 and store filename
        const reader = new FileReader();
        reader.onload = () => {
          const base64 = reader.result as string;
          setFormData(prev => ({ 
            ...prev, 
            resume_url: `${file.name}|${base64}` 
          }));
          
          setSnackbar({
            open: true,
            message: 'Resume uploaded successfully (stored locally)',
            severity: 'success'
          });
        };
        reader.readAsDataURL(file);
        return;
      }

      const { data } = supabase.storage
        .from('job-applications')
        .getPublicUrl(filePath);

      setFormData(prev => ({ ...prev, resume_url: data.publicUrl }));
      
      setSnackbar({
        open: true,
        message: 'Resume uploaded successfully',
        severity: 'success'
      });
    } catch (error: unknown) {
      console.error('Error uploading file:', error);
      setSnackbar({
        open: true,
        message: 'Failed to upload resume. Please try again.',
        severity: 'error'
      });
    } finally {
      setIsFileUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      setSnackbar({
        open: true,
        message: 'Please fill in all required fields',
        severity: 'error'
      });
      return;
    }

    setIsLoading(true);
    try {
      // Prepare submission data with custom fields as JSONB
      const submissionData = {
        job_id: formData.job_id,
        first_name: formData.first_name,
        last_name: formData.last_name,
        email: formData.email,
        phone: formData.phone || null,
        resume_url: formData.resume_url || null,
        custom_fields: formData.custom_fields
      };
      
      console.log('Submitting application data:', submissionData);
      
      const { data, error } = await supabase
        .from('job_opening_applications')
        .insert(submissionData)
        .select();

      console.log('Supabase response:', { data, error });

      if (error) {
        console.error('Supabase error details:', error);
        throw error;
      }

      setShowSuccessModal(true);
    } catch (error: unknown) {
      console.error('Error submitting application:', error);
      const errorMessage = error instanceof Error ? error.message : 'Please try again.';
      setSnackbar({
        open: true,
        message: `Failed to submit application: ${errorMessage}`,
        severity: 'error'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSuccessClose = () => {
    setShowSuccessModal(false);
    onClose();
  };

  return (
    <>
      <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
        <DialogTitle>
          Apply for {jobTitle} at {companyName || 'Loading...'}
        </DialogTitle>
        <DialogContent>
          <Box component="form" onSubmit={handleSubmit} sx={{ mt: 2 }}>
            <Grid container spacing={3}>
              {/* Custom Questions - Show First with Enhanced Styling */}
              {customQuestions.length > 0 && (
                <>
                  <Grid item xs={12}>
                    <Paper 
                      elevation={2} 
                      sx={{ 
                        p: 3, 
                        mb: 2, 
                        bgcolor: 'primary.50', 
                        border: '2px solid', 
                        borderColor: 'primary.200',
                        borderRadius: 2
                      }}
                    >
                      <Stack spacing={3}>
                        <Box>
                          <Typography 
                            variant="h5" 
                            gutterBottom 
                            sx={{ 
                              color: 'primary.main',
                              fontWeight: 'bold',
                              display: 'flex',
                              alignItems: 'center',
                              gap: 1
                            }}
                          >
                            📋 Job-Specific Questions
                          </Typography>
                          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                            Please answer these questions specific to the "{jobTitle}" position
                            {departmentName && ` in the ${departmentName} department`}
                            {companyName && ` at ${companyName}`}:
                          </Typography>
                        </Box>
                        
                        <Stack spacing={3}>
                          {customQuestions.map((question) => (
                            <Box 
                              key={question.id}
                              sx={{ 
                                p: 2, 
                                bgcolor: 'white', 
                                borderRadius: 1,
                                border: '1px solid',
                                borderColor: 'divider'
                              }}
                            >
                              {renderCustomField(question)}
                            </Box>
                          ))}
                        </Stack>
                      </Stack>
                    </Paper>
                  </Grid>
                </>
              )}

              {/* Personal Information */}
              <Grid item xs={12}>
                <Paper elevation={1} sx={{ p: 3, bgcolor: 'grey.50' }}>
                  <Typography 
                    variant="h6" 
                    gutterBottom 
                    sx={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      gap: 1,
                      mb: 3
                    }}
                  >
                    👤 Personal Information
                  </Typography>
                  
                  <Grid container spacing={3}>
              
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  required
                  label="First Name"
                  name="first_name"
                  value={formData.first_name}
                  onChange={handleInputChange}
                  error={!!errors.first_name}
                  helperText={errors.first_name}
                />
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  required
                  label="Last Name"
                  name="last_name"
                  value={formData.last_name}
                  onChange={handleInputChange}
                  error={!!errors.last_name}
                  helperText={errors.last_name}
                />
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  required
                  type="email"
                  label="Email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  error={!!errors.email}
                  helperText={errors.email}
                />
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Phone"
                  name="phone"
                  value={formData.phone}
                  onChange={handleInputChange}
                  error={!!errors.phone}
                  helperText={errors.phone}
                />
                  </Grid>
                  </Grid>
                </Paper>
              </Grid>

              {/* Resume Upload */}
              <Grid item xs={12}>
                <Paper elevation={1} sx={{ p: 3, bgcolor: 'grey.50' }}>
                  <Typography 
                    variant="h6" 
                    gutterBottom 
                    sx={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      gap: 1,
                      mb: 3
                    }}
                  >
                    📄 Resume
                  </Typography>
                <Box sx={{ border: '2px dashed #ccc', borderRadius: 2, p: 3, textAlign: 'center' }}>
                  {formData.resume_url ? (
                    <Box>
                      <CheckCircle color="success" sx={{ fontSize: 48, mb: 1 }} />
                      <Typography variant="body1" color="success.main">
                        Resume uploaded successfully
                      </Typography>
                      <Button
                        variant="outlined"
                        size="small"
                        sx={{ mt: 1 }}
                        onClick={() => setFormData(prev => ({ ...prev, resume_url: '' }))}
                      >
                        Upload Different File
                      </Button>
                    </Box>
                  ) : (
                    <Box>
                      <Upload sx={{ fontSize: 48, mb: 1, color: 'text.secondary' }} />
                      <Typography variant="body1" gutterBottom>
                        Upload your resume (PDF or Word document)
                      </Typography>
                      <input
                        accept=".pdf,.doc,.docx"
                        style={{ display: 'none' }}
                        id="resume-upload"
                        type="file"
                        onChange={handleFileUpload}
                      />
                      <label htmlFor="resume-upload">
                        <Button
                          variant="contained"
                          component="span"
                          disabled={isFileUploading}
                          startIcon={isFileUploading ? <CircularProgress size={20} /> : <Upload />}
                        >
                          {isFileUploading ? 'Uploading...' : 'Choose File'}
                        </Button>
                      </label>
                      <Typography variant="caption" display="block" sx={{ mt: 1 }}>
                        Maximum file size: 5MB
                      </Typography>
                    </Box>
                  )}
                </Box>
                </Paper>
              </Grid>
            </Grid>
          </Box>
        </DialogContent>
        
        <DialogActions sx={{ p: 3 }}>
          <Button onClick={onClose} disabled={isLoading}>
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            variant="contained"
            disabled={isLoading}
            startIcon={isLoading ? <CircularProgress size={20} /> : null}
          >
            {isLoading ? 'Submitting...' : 'Submit Application'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Success Modal */}
      <Dialog open={showSuccessModal} onClose={handleSuccessClose}>
        <DialogTitle>Application Submitted Successfully! 🎉</DialogTitle>
        <DialogContent>
          <Typography>
            Thank you for your application to {companyName}! We have received your information and will review it shortly.
            You should receive a confirmation email within the next few minutes.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleSuccessClose} variant="contained">
            Close
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar */}
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
    </>
  );
};

export default JobApplicationForm;