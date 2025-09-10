import React, { useState, useEffect } from 'react';
import React, { useState, useEffect } from 'react';
import { Session } from '@supabase/supabase-js';
import { Edit3, Save, X, Trash2 } from 'react-feather';
import { weeklyMeetingService } from '../services/weeklyMeetingService';
import {
  WeeklyMeetingQuestion,
  WeeklyMeetingResponse,
  ViewMode,
  CreateQuestionRequest
} from '../types';
import { useUserAndCompanyData } from '../../../shared/hooks/useUserAndCompanyData';
import toast from 'react-hot-toast';

interface WeeklyMeetingProps {
  session: Session;
}

const WeeklyMeeting: React.FC<WeeklyMeetingProps> = ({ session }) => {
  const { companyInfo } = useUserAndCompanyData(session.user.id);
  const [viewMode, setViewMode] = useState<ViewMode>({ type: 'week', date: new Date() });

  // Helper function to get local date string in YYYY-MM-DD format
  const getLocalDateString = (date: Date): string => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };
  const [questions, setQuestions] = useState<WeeklyMeetingQuestion[]>([]);
  const [responses, setResponses] = useState<WeeklyMeetingResponse[]>([]);
  const [loading, setLoading] = useState(false);
  const [showQuestionForm, setShowQuestionForm] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState<WeeklyMeetingQuestion | null>(null);
  const [weeklyEntry, setWeeklyEntry] = useState<string>('');
  const [newQuestion, setNewQuestion] = useState<CreateQuestionRequest>({
    company_id: '',
    question_text: { text: '' }
  });

  // Load questions when companyInfo is available
  useEffect(() => {
    if (companyInfo?.id) {
      loadQuestions();
      loadResponses();
      setNewQuestion(prev => ({ ...prev, company_id: companyInfo.id }));
    }
  }, [companyInfo, viewMode.date]);

  // Load weekly entry when date changes
  useEffect(() => {
    loadWeeklyEntryForDate();
  }, [viewMode.date, responses]);

  // Load questions for the company
  const loadQuestions = async () => {
    if (!companyInfo?.id) return;
    
    try {
      const companyQuestions = await weeklyMeetingService.getCompanyQuestions(companyInfo.id);
      setQuestions(companyQuestions.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()));
    } catch (error) {
      console.error('Error loading questions:', error);
      toast.error('Failed to load questions');
    }
  };

  // Load responses for the selected date
  const loadResponses = async () => {
    if (!companyInfo?.id) return;
    
    try {
      const dateStr = getLocalDateString(viewMode.date);
      const companyResponses = await weeklyMeetingService.getCompanyResponsesForDate(companyInfo.id, dateStr);
      setResponses(companyResponses);
    } catch (error) {
      console.error('Error loading responses:', error);
      toast.error('Failed to load responses');
    }
  };

  // Load weekly entry for the selected date
  const loadWeeklyEntryForDate = () => {
    const dateStr = getLocalDateString(viewMode.date);
    const entryForDate = responses.find(r => r.meeting_date === dateStr);
    
    if (entryForDate) {
      setWeeklyEntry(entryForDate.response_data?.notes || '');
    } else {
      setWeeklyEntry('');
    }
  };

  // Create or update single question entry (upsert logic)
  const handleCreateQuestion = async () => {
    if (!newQuestion.question_text?.text?.trim()) {
      toast.error('Question text is required');
      return;
    }

    try {
      // Use the upsert endpoint for cleaner logic
      const upsertedQuestion = await weeklyMeetingService.upsertCompanyQuestion(companyInfo?.id || '', newQuestion);
      setQuestions([upsertedQuestion]);
      toast.success('Questions created successfully!');
      
      setNewQuestion({
        company_id: companyInfo?.id || '',
        question_text: { text: '' }
      });
      setShowQuestionForm(false);
      setEditingQuestion(null);
    } catch (error) {
      console.error('Error saving questions:', error);
      toast.error('Failed to save questions');
    }
  };

  // Update existing question
  const handleUpdateQuestion = async () => {
    if (!editingQuestion || !editingQuestion.question_text?.text?.trim()) {
      toast.error('Question text is required');
      return;
    }

    try {
      const updateData: CreateQuestionRequest = {
        company_id: companyInfo?.id || '',
        question_text: editingQuestion.question_text
      };
      
      const updatedQuestion = await weeklyMeetingService.upsertCompanyQuestion(companyInfo?.id || '', updateData);
      setQuestions([updatedQuestion]);
      
      setEditingQuestion(null);
      setShowQuestionForm(false);
      toast.success('Questions updated successfully!');
    } catch (error) {
      console.error('Error updating questions:', error);
      toast.error('Failed to update questions');
    }
  };

  // Delete question
  const handleDeleteQuestion = async (questionId: string) => {
    if (!window.confirm('Are you sure you want to delete your weekly meeting questions?')) {
      return;
    }

    try {
      await weeklyMeetingService.deleteQuestion(questionId);
      setQuestions([]);
      toast.success('Questions deleted successfully');
    } catch (error) {
      console.error('Error deleting questions:', error);
      toast.error('Failed to delete questions');
    }
  };


  // Start editing the single question entry
  const startEditingSingleQuestion = () => {
    if (questions.length > 0) {
      setEditingQuestion({ ...questions[0] });
    } else {
      setNewQuestion({
        company_id: companyInfo?.id || '',
        question_text: { text: '' }
      });
    }
    setShowQuestionForm(true);
  };

  // Cancel editing
  const cancelEditing = () => {
    setEditingQuestion(null);
    setShowQuestionForm(false);
  };

  // Save weekly entry (upsert logic)
  const saveWeeklyEntry = async () => {
    if (!companyInfo?.id) return;

    setLoading(true);
    try {
      const dateStr = getLocalDateString(viewMode.date);
      const existingEntry = responses.find(r => r.meeting_date === dateStr);
      
      const responseData = {
        questions: questions.map(q => ({
          question_text: q.question_text || '',
          response: ''
        })),
        notes: weeklyEntry,
        mood: 'positive'
      };

      if (existingEntry) {
        // Update existing entry
        await weeklyMeetingService.updateResponse(existingEntry.id, {
          response_data: responseData,
          last_edited_by: session.user.id
        });
        toast.success('Weekly entry updated successfully');
      } else {
        // Create new entry
        const formData = {
          company_id: companyInfo.id,
          meeting_date: dateStr,
          last_edited_by: session.user.id,
          responses: {
            'main_response': responseData
          }
        };
        await weeklyMeetingService.submitFormResponses(formData);
        toast.success('Weekly entry created successfully');
      }
      
      loadResponses();
    } catch (error) {
      console.error('Error saving weekly entry:', error);
      toast.error('Failed to save weekly entry');
    } finally {
      setLoading(false);
    }
  };

  // Delete weekly entry
  const deleteWeeklyEntry = async () => {
    if (!companyInfo?.id) return;
    
    const dateStr = getLocalDateString(viewMode.date);
    const existingEntry = responses.find(r => r.meeting_date === dateStr);
    
    if (!existingEntry) {
      toast.error('No entry found to delete');
      return;
    }

    if (!window.confirm('Are you sure you want to delete this weekly entry?')) {
      return;
    }

    setLoading(true);
    try {
      await weeklyMeetingService.deleteResponse(existingEntry.id);
      setWeeklyEntry('');
      toast.success('Weekly entry deleted successfully');
      loadResponses();
    } catch (error) {
      console.error('Error deleting weekly entry:', error);
      toast.error('Failed to delete weekly entry');
    } finally {
      setLoading(false);
    }
  };


  if (!companyInfo) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Loading company information...</div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Weekly Meeting</h1>
          <p className="text-gray-600">Manage your weekly meeting questions and entry</p>
        </div>
      </div>

      {/* Date Selector */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-4">
          <label className="text-sm font-medium text-gray-700">Meeting Date:</label>
          <input
            type="date"
            value={getLocalDateString(viewMode.date)}
            onChange={(e) => setViewMode(prev => ({ ...prev, date: new Date(e.target.value) }))}
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Questions Section */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold flex items-center">
              <Edit3 className="w-5 h-5 mr-2" />
              Questions
            </h3>
          </div>

          <div className="space-y-4">
            {/* Single Question Entry Interface */}
            <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center flex-1">
                  <span className="inline-flex items-center justify-center w-6 h-6 bg-blue-100 text-blue-800 text-xs font-bold rounded-full mr-3">
                    1
                  </span>
                  <span className="text-sm font-semibold text-gray-800 flex-1">
                    Weekly Meeting Questions
                  </span>
                </div>
                <div className="flex items-center space-x-2 ml-4">
                  <button
                    onClick={startEditingSingleQuestion}
                    className="p-1 text-blue-600 hover:text-blue-800 hover:bg-blue-100 rounded transition-colors"
                    title={questions.length > 0 ? "Edit questions" : "Create questions"}
                  >
                    <Edit3 className="w-4 h-4" />
                  </button>
                  {questions.length > 0 && (
                    <button
                      onClick={() => handleDeleteQuestion(questions[0].id)}
                      className="p-1 text-red-600 hover:text-red-800 hover:bg-red-100 rounded transition-colors"
                      title="Delete questions"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
              
              {questions.length > 0 ? (
                <div className="ml-9">
                  <div className="flex items-center mb-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                    <span className="text-sm text-green-600 font-medium">Question Created</span>
                  </div>
                  <div className="text-sm text-gray-700 whitespace-pre-line">
                    {questions[0].question_text?.text || 'No questions set'}
                  </div>
                </div>
              ) : (
                <div className="ml-9 text-sm text-gray-500 italic">
                  Click the edit button to create your weekly meeting questions
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Response Section */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold flex items-center">
              <Edit3 className="w-5 h-5 mr-2" />
              Weekly Entry - {viewMode.date.toLocaleDateString('en-US', { 
                weekday: 'long', 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
              })}
            </h3>
            <div className="flex space-x-2">
              <button
                onClick={saveWeeklyEntry}
                disabled={loading}
                className="flex items-center px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors disabled:opacity-50"
              >
                <Save className="w-4 h-4 mr-2" />
                {loading ? 'Saving...' : responses.find(r => r.meeting_date === getLocalDateString(viewMode.date)) ? 'Update Entry' : 'Save Entry'}
              </button>
              {responses.find(r => r.meeting_date === getLocalDateString(viewMode.date)) && (
                <button
                  onClick={deleteWeeklyEntry}
                  disabled={loading}
                  className="flex items-center px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors disabled:opacity-50"
                >
                  <X className="w-4 h-4 mr-2" />
                  Delete Entry
                </button>
              )}
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Your Weekly Entry
              </label>
              <textarea
                value={weeklyEntry}
                onChange={(e) => setWeeklyEntry(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                rows={12}
                placeholder="Write your weekly entry here... You can include:

• What you accomplished this week
• Challenges you faced
• Goals for next week
• Any other thoughts or reflections"
              />
            </div>
            
            {responses.filter(r => r.meeting_date !== getLocalDateString(viewMode.date)).length > 0 && (
              <div className="mt-4">
                <h4 className="text-sm font-medium text-gray-700 mb-2">Previous Entries:</h4>
                <div className="space-y-2">
                  {responses
                    .filter(r => r.meeting_date !== getLocalDateString(viewMode.date))
                    .map((response) => (
                    <div key={response.id} className="bg-gray-50 border border-gray-200 rounded-md p-3">
                      <div className="text-sm text-gray-600 mb-1">
                        {new Date(response.meeting_date).toLocaleDateString('en-US', { 
                          weekday: 'long', 
                          year: 'numeric', 
                          month: 'long', 
                          day: 'numeric' 
                        })}
                      </div>
                      <div className="text-sm text-gray-800">
                        {response.response_data?.notes || 'No entry content'}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Add/Edit Question Modal */}
      {(showQuestionForm || editingQuestion) && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">
                {editingQuestion ? 'Edit Questions' : 'Create Questions'}
              </h3>
              <button
                onClick={cancelEditing}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Weekly Meeting Questions
                </label>
                <textarea
                  value={editingQuestion ? editingQuestion.question_text?.text || '' : newQuestion.question_text?.text || ''}
                  onChange={(e) => {
                    if (editingQuestion) {
                      setEditingQuestion(prev => prev ? { ...prev, question_text: { ...prev.question_text, text: e.target.value } } : null);
                    } else {
                      setNewQuestion(prev => ({ 
                        ...prev, 
                        question_text: { ...prev.question_text, text: e.target.value }
                      }));
                    }
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows={8}
                  placeholder="Enter your weekly meeting questions (one per line):

• What did you accomplish this week?
• What challenges did you face?
• What are your goals for next week?
• Any other thoughts or reflections?"
                />
                <p className="text-xs text-gray-500 mt-1">
                  {editingQuestion 
                    ? "You can update your existing questions here. This is your single question entry for weekly meetings."
                    : "You can include multiple questions, one per line. This will be your single question entry for weekly meetings."
                  }
                </p>
              </div>
            </div>
            
            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={cancelEditing}
                className="px-4 py-2 text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={editingQuestion ? handleUpdateQuestion : handleCreateQuestion}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
              >
                {editingQuestion ? 'Update Questions' : 'Create Questions'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default WeeklyMeeting;
