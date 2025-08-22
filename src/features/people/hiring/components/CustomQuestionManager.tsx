import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  IconButton,
  Typography,
  Paper,
  Grid,
  Switch,
  FormControlLabel,
  Chip,
  Stack,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  Divider,
  Alert,
} from '@mui/material';
import {
  Add,
  Delete,
  Edit,
  DragIndicator,
  Save,
  Cancel,
} from '@mui/icons-material';
import { supabase } from '../../../../lib/supabase';

interface CustomQuestion {
  id?: string;
  job_id: string;
  question_text: string;
  question_type: 'text' | 'dropdown' | 'checkbox' | 'scale' | 'yes_no';
  is_required: boolean;
  options?: string[];
  min_value?: number;
  max_value?: number;
  sort_order: number;
}

interface CustomQuestionManagerProps {
  jobId: string;
  isNewJob?: boolean;
  onQuestionsChange?: (questions: any[]) => void;
}

const CustomQuestionManager: React.FC<CustomQuestionManagerProps> = ({
  jobId,
  isNewJob = false,
  onQuestionsChange,
}) => {
  const [questions, setQuestions] = useState<CustomQuestion[]>([]);
  const [editingQuestion, setEditingQuestion] = useState<CustomQuestion | null>(null);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [optionInput, setOptionInput] = useState('');
  const [currentOptions, setCurrentOptions] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);

  const defaultQuestion: CustomQuestion = {
    job_id: jobId,
    question_text: '',
    question_type: 'text',
    is_required: false,
    options: null,
    min_value: null,
    max_value: null,
    sort_order: questions.length,
  };

  useEffect(() => {
    if (!isNewJob && jobId) {
      fetchQuestions();
    }
  }, [jobId, isNewJob]);

  const fetchQuestions = async () => {
    try {
      const { data, error } = await supabase
        .from('job_custom_questions')
        .select('*')
        .eq('job_id', jobId)
        .order('sort_order', { ascending: true });

      if (error) throw error;
      setQuestions(data || []);
    } catch (error) {
      console.error('Error fetching custom questions:', error);
      setError('Failed to load custom questions');
    }
  };

  const handleAddQuestion = () => {
    setEditingQuestion({ ...defaultQuestion, sort_order: questions.length });
    setCurrentOptions([]);
    setShowAddDialog(true);
  };

  const handleEditQuestion = (question: CustomQuestion) => {
    setEditingQuestion(question);
    setCurrentOptions(question.options || []);
    setShowAddDialog(true);
  };

  const handleSaveQuestion = async () => {
    if (!editingQuestion) return;

    if (!editingQuestion.question_text.trim()) {
      setError('Question text is required');
      return;
    }

    if ((editingQuestion.question_type === 'dropdown' || editingQuestion.question_type === 'checkbox') 
        && currentOptions.length === 0) {
      setError('Please add at least one option for this question type');
      return;
    }

    const questionToSave: any = {
      job_id: jobId,
      question_text: editingQuestion.question_text,
      question_type: editingQuestion.question_type,
      is_required: editingQuestion.is_required,
      sort_order: editingQuestion.sort_order,
      options: (editingQuestion.question_type === 'dropdown' || editingQuestion.question_type === 'checkbox') 
        ? currentOptions 
        : null,
      min_value: editingQuestion.question_type === 'scale' ? editingQuestion.min_value : null,
      max_value: editingQuestion.question_type === 'scale' ? editingQuestion.max_value : null,
    };

    try {
      if (isNewJob) {
        // For new jobs, just update the local state
        if (editingQuestion.id) {
          // Editing existing question in local state
          setQuestions(prev => prev.map(q => 
            q.id === editingQuestion.id ? { ...questionToSave, id: editingQuestion.id } : q
          ));
        } else {
          // Adding new question to local state
          const newQuestion = {
            ...questionToSave,
            id: `temp_${Date.now()}`, // Temporary ID for new questions
          };
          setQuestions(prev => [...prev, newQuestion]);
        }
        
        if (onQuestionsChange) {
          const updatedQuestions = editingQuestion.id 
            ? questions.map(q => q.id === editingQuestion.id ? { ...questionToSave, id: editingQuestion.id } : q)
            : [...questions, { ...questionToSave, id: `temp_${Date.now()}` }];
          onQuestionsChange(updatedQuestions);
        }
      } else {
        // For existing jobs, save to database
        if (editingQuestion.id && !editingQuestion.id.startsWith('temp_')) {
          // Update existing question - include id in update
          const updateData = { ...questionToSave };
          delete updateData.job_id; // Don't update job_id
          
          const { error } = await supabase
            .from('job_custom_questions')
            .update(updateData)
            .eq('id', editingQuestion.id);

          if (error) {
            console.error('Update error:', error);
            throw error;
          }
        } else {
          // Insert new question
          console.log('Inserting question:', questionToSave);
          const { data, error } = await supabase
            .from('job_custom_questions')
            .insert(questionToSave)
            .select()
            .single();

          if (error) {
            console.error('Insert error:', error);
            throw error;
          }
          console.log('Question saved:', data);
        }
        
        await fetchQuestions();
      }

      setShowAddDialog(false);
      setEditingQuestion(null);
      setCurrentOptions([]);
      setError(null);
    } catch (error: any) {
      console.error('Error saving question:', error);
      setError(`Failed to save question: ${error.message || 'Unknown error'}`);
    }
  };

  const handleDeleteQuestion = async (questionId: string) => {
    if (!confirm('Are you sure you want to delete this question?')) return;

    try {
      if (isNewJob || questionId.startsWith('temp_')) {
        // Just remove from local state
        setQuestions(prev => prev.filter(q => q.id !== questionId));
        if (onQuestionsChange) {
          onQuestionsChange(questions.filter(q => q.id !== questionId));
        }
      } else {
        // Delete from database
        const { error } = await supabase
          .from('job_custom_questions')
          .delete()
          .eq('id', questionId);

        if (error) throw error;
        await fetchQuestions();
      }
    } catch (error) {
      console.error('Error deleting question:', error);
      setError('Failed to delete question');
    }
  };

  const handleAddOption = () => {
    if (optionInput.trim() && !currentOptions.includes(optionInput.trim())) {
      setCurrentOptions(prev => [...prev, optionInput.trim()]);
      setOptionInput('');
    }
  };

  const handleRemoveOption = (option: string) => {
    setCurrentOptions(prev => prev.filter(o => o !== option));
  };

  const getQuestionTypeLabel = (type: string) => {
    switch (type) {
      case 'text': return 'Text Answer';
      case 'dropdown': return 'Dropdown';
      case 'checkbox': return 'Multiple Choice';
      case 'scale': return 'Rating Scale';
      case 'yes_no': return 'Yes/No';
      default: return type;
    }
  };

  return (
    <Box>
      <Paper sx={{ p: 2, mb: 2 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h6">
            Custom Application Questions
          </Typography>
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={handleAddQuestion}
            size="small"
          >
            Add Question
          </Button>
        </Box>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
            {error}
          </Alert>
        )}

        {questions.length === 0 ? (
          <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 3 }}>
            No custom questions added yet. Click "Add Question" to create custom questions for applicants.
          </Typography>
        ) : (
          <List>
            {questions.map((question, index) => (
              <React.Fragment key={question.id || index}>
                <ListItem>
                  <ListItemText
                    primary={
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Typography variant="subtitle1">
                          {question.question_text}
                        </Typography>
                        {question.is_required && (
                          <Chip label="Required" size="small" color="error" />
                        )}
                      </Box>
                    }
                    secondary={
                      <Box sx={{ mt: 1 }}>
                        <Chip 
                          label={getQuestionTypeLabel(question.question_type)} 
                          size="small" 
                          variant="outlined"
                          sx={{ mr: 1 }}
                        />
                        {question.options && question.options.length > 0 && (
                          <Typography variant="caption" color="text.secondary">
                            Options: {question.options.join(', ')}
                          </Typography>
                        )}
                        {question.question_type === 'scale' && (
                          <Typography variant="caption" color="text.secondary">
                            Scale: {question.min_value} - {question.max_value}
                          </Typography>
                        )}
                      </Box>
                    }
                  />
                  <ListItemSecondaryAction>
                    <IconButton
                      edge="end"
                      aria-label="edit"
                      onClick={() => handleEditQuestion(question)}
                      sx={{ mr: 1 }}
                    >
                      <Edit />
                    </IconButton>
                    <IconButton
                      edge="end"
                      aria-label="delete"
                      onClick={() => handleDeleteQuestion(question.id!)}
                    >
                      <Delete />
                    </IconButton>
                  </ListItemSecondaryAction>
                </ListItem>
                {index < questions.length - 1 && <Divider />}
              </React.Fragment>
            ))}
          </List>
        )}
      </Paper>

      {/* Add/Edit Question Dialog */}
      <Dialog
        open={showAddDialog}
        onClose={() => {
          setShowAddDialog(false);
          setEditingQuestion(null);
          setCurrentOptions([]);
          setError(null);
        }}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          {editingQuestion?.id ? 'Edit Question' : 'Add New Question'}
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Question Text"
                value={editingQuestion?.question_text || ''}
                onChange={(e) => setEditingQuestion(prev => 
                  prev ? { ...prev, question_text: e.target.value } : null
                )}
                required
                multiline
                rows={2}
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Question Type</InputLabel>
                <Select
                  value={editingQuestion?.question_type || 'text'}
                  onChange={(e) => setEditingQuestion(prev => 
                    prev ? { ...prev, question_type: e.target.value as CustomQuestion['question_type'] } : null
                  )}
                  label="Question Type"
                >
                  <MenuItem value="text">Text Answer</MenuItem>
                  <MenuItem value="dropdown">Dropdown</MenuItem>
                  <MenuItem value="checkbox">Multiple Choice</MenuItem>
                  <MenuItem value="scale">Rating Scale</MenuItem>
                  <MenuItem value="yes_no">Yes/No</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} sm={6}>
              <FormControlLabel
                control={
                  <Switch
                    checked={editingQuestion?.is_required || false}
                    onChange={(e) => setEditingQuestion(prev => 
                      prev ? { ...prev, is_required: e.target.checked } : null
                    )}
                  />
                }
                label="Required"
              />
            </Grid>

            {/* Options for dropdown and checkbox */}
            {(editingQuestion?.question_type === 'dropdown' || editingQuestion?.question_type === 'checkbox') && (
              <>
                <Grid item xs={12}>
                  <Typography variant="subtitle2" gutterBottom>
                    Options
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
                    <TextField
                      fullWidth
                      size="small"
                      placeholder="Add option and press Enter"
                      value={optionInput}
                      onChange={(e) => setOptionInput(e.target.value)}
                      onKeyPress={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleAddOption();
                        }
                      }}
                    />
                    <Button
                      variant="outlined"
                      onClick={handleAddOption}
                      size="small"
                    >
                      Add
                    </Button>
                  </Box>
                  <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                    {currentOptions.map((option) => (
                      <Chip
                        key={option}
                        label={option}
                        onDelete={() => handleRemoveOption(option)}
                        color="primary"
                        variant="outlined"
                      />
                    ))}
                  </Stack>
                </Grid>
              </>
            )}

            {/* Scale range for scale type */}
            {editingQuestion?.question_type === 'scale' && (
              <>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    type="number"
                    label="Min Value"
                    value={editingQuestion?.min_value || 1}
                    onChange={(e) => setEditingQuestion(prev => 
                      prev ? { ...prev, min_value: parseInt(e.target.value) || 1 } : null
                    )}
                    inputProps={{ min: 0, max: 100 }}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    type="number"
                    label="Max Value"
                    value={editingQuestion?.max_value || 10}
                    onChange={(e) => setEditingQuestion(prev => 
                      prev ? { ...prev, max_value: parseInt(e.target.value) || 10 } : null
                    )}
                    inputProps={{ min: 1, max: 100 }}
                  />
                </Grid>
              </>
            )}
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => {
              setShowAddDialog(false);
              setEditingQuestion(null);
              setCurrentOptions([]);
              setError(null);
            }}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSaveQuestion}
            variant="contained"
            startIcon={<Save />}
          >
            Save Question
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default CustomQuestionManager;