import React, { useState, useEffect } from 'react';
import { Session } from '@supabase/supabase-js';
import { Plus, Edit3, Save, X } from 'react-feather';
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
  const [viewMode, setViewMode] = useState<ViewMode>({ type: 'week', date: new Date(new Date().getFullYear(), new Date().getMonth(), new Date().getDate()) });
  const [questions, setQuestions] = useState<WeeklyMeetingQuestion[]>([]);
  const [responses, setResponses] = useState<WeeklyMeetingResponse[]>([]);
  const [loading, setLoading] = useState(false);
  const [showQuestionForm, setShowQuestionForm] = useState(false);
  const [newQuestion, setNewQuestion] = useState<CreateQuestionRequest>({
    company_id: '',
    question_text: ''
  });

  // Load questions when companyInfo is available
  useEffect(() => {
    if (companyInfo?.id) {
      loadQuestions();
      loadResponses();
      setNewQuestion(prev => ({ ...prev, company_id: companyInfo.id }));
    }
  }, [companyInfo, viewMode.date]);

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
      const dateStr = viewMode.date.toISOString().split('T')[0];
      const companyResponses = await weeklyMeetingService.getCompanyResponsesForDate(companyInfo.id, dateStr);
      setResponses(companyResponses);
    } catch (error) {
      console.error('Error loading responses:', error);
      toast.error('Failed to load responses');
    }
  };

  // Create new question
  const handleCreateQuestion = async () => {
    if (!newQuestion.question_text?.trim()) {
      toast.error('Question text is required');
      return;
    }

    try {
      const createdQuestion = await weeklyMeetingService.createQuestion(newQuestion);
      setQuestions(prev => [...prev, createdQuestion].sort(
        (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
      ));
      
      setNewQuestion({
        company_id: companyInfo?.id || '',
        question_text: ''
      });
      setShowQuestionForm(false);
      toast.success('Question created successfully');
    } catch (error) {
      console.error('Error creating question:', error);
      toast.error('Failed to create question');
    }
  };

  // Save responses
  const saveResponses = async () => {
    if (!companyInfo?.id) return;

    setLoading(true);
    try {
      const dateStr = viewMode.date.toISOString().split('T')[0];
      const formData = {
        company_id: companyInfo.id,
        meeting_date: dateStr,
        last_edited_by: session.user.id,
        responses: {
          'main_response': {
            questions: questions.map(q => ({
              question_id: q.id,
              question_text: q.question_text || '',
              response: ''
            })),
            notes: '',
            mood: 'positive'
          }
        }
      };

      await weeklyMeetingService.submitFormResponses(formData);
      toast.success('Responses saved successfully');
      loadResponses();
    } catch (error) {
      console.error('Error saving responses:', error);
      toast.error('Failed to save responses');
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
          <p className="text-gray-600">Manage your weekly meeting questions and responses</p>
        </div>
        <button
          onClick={() => setShowQuestionForm(true)}
          className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Question
        </button>
      </div>

      {/* Date Selector */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-4">
          <label className="text-sm font-medium text-gray-700">Meeting Date:</label>
          <input
            type="date"
            value={viewMode.date.toISOString().split('T')[0]}
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
            <button
              onClick={() => setShowQuestionForm(true)}
              className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Question
            </button>
          </div>

          <div className="space-y-4">
            {questions.map((question, index) => (
              <div key={question.id} className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center">
                    <span className="inline-flex items-center justify-center w-6 h-6 bg-blue-100 text-blue-800 text-xs font-bold rounded-full mr-3">
                      {index + 1}
                    </span>
                    <span className="text-sm font-semibold text-gray-800">
                      {question.question_text || 'No question text'}
                    </span>
                  </div>
                </div>
              </div>
            ))}
            
            {questions.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                <div className="mb-4">
                  <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">No Questions Available</h3>
                <p className="text-gray-600 mb-4">Add some questions to get started with your weekly meetings.</p>
                <button
                  onClick={() => setShowQuestionForm(true)}
                  className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add Your First Question
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Response Section */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold flex items-center">
              <Edit3 className="w-5 h-5 mr-2" />
              Weekly Response - {viewMode.date.toLocaleDateString('en-US', { 
                weekday: 'long', 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
              })}
            </h3>
            <button
              onClick={saveResponses}
              disabled={loading}
              className="flex items-center px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors disabled:opacity-50"
            >
              <Save className="w-4 h-4 mr-2" />
              {loading ? 'Saving...' : 'Save Response'}
            </button>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Your Weekly Response
              </label>
              <textarea
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                rows={12}
                placeholder="Write your weekly response here... You can include:

• What you accomplished this week
• Challenges you faced
• Goals for next week
• Any other thoughts or reflections"
              />
            </div>
            
            {responses.length > 0 && (
              <div className="mt-4">
                <h4 className="text-sm font-medium text-gray-700 mb-2">Previous Responses:</h4>
                <div className="space-y-2">
                  {responses.map((response) => (
                    <div key={response.id} className="bg-gray-50 border border-gray-200 rounded-md p-3">
                      <div className="text-sm text-gray-600 mb-1">
                        {new Date(response.created_at).toLocaleDateString()}
                      </div>
                      <div className="text-sm text-gray-800">
                        {response.response_data?.notes || 'No response content'}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Add Question Modal */}
      {showQuestionForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Add New Question</h3>
              <button
                onClick={() => setShowQuestionForm(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Question Text
                </label>
                <textarea
                  value={newQuestion.question_text}
                  onChange={(e) => setNewQuestion(prev => ({ 
                    ...prev, 
                    question_text: e.target.value
                  }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows={3}
                  placeholder="Enter your question..."
                />
              </div>
            </div>
            
            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => setShowQuestionForm(false)}
                className="px-4 py-2 text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateQuestion}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
              >
                Create Question
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default WeeklyMeeting;
