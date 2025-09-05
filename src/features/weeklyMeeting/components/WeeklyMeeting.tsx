import React, { useState, useEffect, useMemo } from 'react';
import { Session } from '@supabase/supabase-js';
import { Calendar, ChevronLeft, ChevronRight, Plus, Edit3, Save, X } from 'react-feather';
import { weeklyMeetingService } from '../services/weeklyMeetingService';
import {
  WeeklyMeetingQuestion,
  WeeklyMeetingResponse,
  WeeklyMeetingFormData,
  WeeklyMeetingFormResponse,
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
  const [questions, setQuestions] = useState<WeeklyMeetingQuestion[]>([]);
  const [formData, setFormData] = useState<WeeklyMeetingFormResponse | null>(null);
  const [responses, setResponses] = useState<Record<string, Record<string, any>>>({});
  const [loading, setLoading] = useState(false);
  const [showQuestionForm, setShowQuestionForm] = useState(false);
  const [newQuestion, setNewQuestion] = useState<CreateQuestionRequest>({
    company_id: '',
    question_text: '',
    question_type: 'text',
    position: 0,
    is_active: true
  });

  // Initialize company_id when companyInfo is available
  useEffect(() => {
    if (companyInfo?.id) {
      setNewQuestion(prev => ({ ...prev, company_id: companyInfo.id }));
      loadQuestions();
    }
  }, [companyInfo]);

  // Load questions for the company
  const loadQuestions = async () => {
    if (!companyInfo?.id) return;
    
    try {
      const companyQuestions = await weeklyMeetingService.getCompanyQuestions(companyInfo.id, true);
      setQuestions(companyQuestions.sort((a, b) => a.position - b.position));
    } catch (error) {
      console.error('Error loading questions:', error);
      toast.error('Failed to load questions');
    }
  };

  // Load form data for selected date
  const loadFormData = async (date: Date) => {
    if (!companyInfo?.id) return;
    
    setLoading(true);
    try {
      const dateStr = date.toISOString().split('T')[0];
      const data = await weeklyMeetingService.getMeetingFormData(companyInfo.id, dateStr);
      setFormData(data);
      
      // Initialize responses from existing data
      const responseMap: Record<string, Record<string, any>> = {};
      data.responses.forEach(response => {
        responseMap[response.question_id] = response.response_data;
      });
      setResponses(responseMap);
    } catch (error) {
      console.error('Error loading form data:', error);
      toast.error('Failed to load form data');
    } finally {
      setLoading(false);
    }
  };

  // Load form data when date changes
  useEffect(() => {
    loadFormData(viewMode.date);
  }, [viewMode.date, companyInfo]);

  // Create new question
  const handleCreateQuestion = async () => {
    if (!newQuestion.question_text.trim()) {
      toast.error('Question text is required');
      return;
    }

    try {
      const createdQuestion = await weeklyMeetingService.createQuestion(newQuestion);
      setQuestions(prev => [...prev, createdQuestion].sort((a, b) => a.position - b.position));
      setNewQuestion({
        company_id: companyInfo?.id || '',
        question_text: '',
        question_type: 'text',
        position: questions.length,
        is_active: true
      });
      setShowQuestionForm(false);
      toast.success('Question created successfully');
    } catch (error) {
      console.error('Error creating question:', error);
      toast.error('Failed to create question');
    }
  };

  // Update response for a question
  const updateResponse = (questionId: string, field: string, value: any) => {
    setResponses(prev => ({
      ...prev,
      [questionId]: {
        ...prev[questionId],
        [field]: value
      }
    }));
  };

  // Save all responses
  const saveResponses = async () => {
    if (!companyInfo?.id) return;

    try {
      const dateStr = viewMode.date.toISOString().split('T')[0];
      const formData: WeeklyMeetingFormData = {
        company_id: companyInfo.id,
        meeting_date: dateStr,
        last_edited_by: session.user.id,
        responses
      };

      await weeklyMeetingService.submitFormResponses(formData);
      toast.success('Responses saved successfully');
      loadFormData(viewMode.date); // Reload to get updated data
    } catch (error) {
      console.error('Error saving responses:', error);
      toast.error('Failed to save responses');
    }
  };

  // Navigation functions
  const navigateDate = (direction: 'prev' | 'next') => {
    const newDate = new Date(viewMode.date);
    
    switch (viewMode.type) {
      case 'week':
        newDate.setDate(newDate.getDate() + (direction === 'next' ? 7 : -7));
        break;
      case 'month':
        newDate.setMonth(newDate.getMonth() + (direction === 'next' ? 1 : -1));
        break;
      case 'year':
        newDate.setFullYear(newDate.getFullYear() + (direction === 'next' ? 1 : -1));
        break;
    }
    
    setViewMode(prev => ({ ...prev, date: newDate }));
  };

  // Get calendar dates based on view mode
  const getCalendarDates = () => {
    const dates: Date[] = [];
    const current = new Date(viewMode.date);
    
    switch (viewMode.type) {
      case 'week':
        // Get start of week (Monday)
        const startOfWeek = new Date(current);
        startOfWeek.setDate(current.getDate() - current.getDay() + 1);
        
        for (let i = 0; i < 7; i++) {
          const date = new Date(startOfWeek);
          date.setDate(startOfWeek.getDate() + i);
          dates.push(date);
        }
        break;
      case 'month':
        // Get all days in the month
        const year = current.getFullYear();
        const month = current.getMonth();
        const daysInMonth = new Date(year, month + 1, 0).getDate();
        
        for (let day = 1; day <= daysInMonth; day++) {
          dates.push(new Date(year, month, day));
        }
        break;
      case 'year':
        // Get all months in the year
        for (let month = 0; month < 12; month++) {
          dates.push(new Date(current.getFullYear(), month, 1));
        }
        break;
    }
    
    return dates;
  };

  // Check if a date has responses
  const hasResponses = (date: Date) => {
    if (!formData) return false;
    const dateStr = date.toISOString().split('T')[0];
    return formData.responses.some(response => response.meeting_date === dateStr);
  };

  // Format date for display
  const formatDate = (date: Date) => {
    switch (viewMode.type) {
      case 'week':
        return date.toLocaleDateString('en-US', { weekday: 'short', day: 'numeric' });
      case 'month':
        return date.getDate().toString();
      case 'year':
        return date.toLocaleDateString('en-US', { month: 'short' });
      default:
        return date.toLocaleDateString();
    }
  };

  // Render question input based on type
  const renderQuestionInput = (question: WeeklyMeetingQuestion) => {
    const questionResponse = responses[question.id] || {};
    
    switch (question.question_type) {
      case 'rating':
        return (
          <div className="space-y-2">
            <input
              type="number"
              min="1"
              max="10"
              value={questionResponse.rating || ''}
              onChange={(e) => updateResponse(question.id, 'rating', parseInt(e.target.value) || '')}
              className="w-20 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="1-10"
            />
            {questionResponse.rating && (
              <input
                type="text"
                value={questionResponse.comment || ''}
                onChange={(e) => updateResponse(question.id, 'comment', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Additional comments..."
              />
            )}
          </div>
        );
      case 'multiple_choice':
        return (
          <select
            value={questionResponse.choice || ''}
            onChange={(e) => updateResponse(question.id, 'choice', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Select an option</option>
            <option value="excellent">Excellent</option>
            <option value="good">Good</option>
            <option value="average">Average</option>
            <option value="poor">Poor</option>
          </select>
        );
      default: // text
        return (
          <textarea
            value={questionResponse.answer || ''}
            onChange={(e) => updateResponse(question.id, 'answer', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            rows={3}
            placeholder="Enter your response..."
          />
        );
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

      {/* View Mode Selector */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex space-x-2">
          {(['week', 'month', 'year'] as const).map((mode) => (
            <button
              key={mode}
              onClick={() => setViewMode(prev => ({ ...prev, type: mode }))}
              className={`px-4 py-2 rounded-md font-medium transition-colors ${
                viewMode.type === mode
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              {mode.charAt(0).toUpperCase() + mode.slice(1)}
            </button>
          ))}
        </div>

        {/* Date Navigation */}
        <div className="flex items-center space-x-4">
          <button
            onClick={() => navigateDate('prev')}
            className="p-2 hover:bg-gray-200 rounded-md transition-colors"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          
          <div className="text-lg font-semibold">
            {viewMode.date.toLocaleDateString('en-US', {
              year: 'numeric',
              month: 'long',
              day: viewMode.type === 'week' ? 'numeric' : undefined
            })}
          </div>
          
          <button
            onClick={() => navigateDate('next')}
            className="p-2 hover:bg-gray-200 rounded-md transition-colors"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Calendar */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-lg shadow-md p-4">
            <h3 className="text-lg font-semibold mb-4 flex items-center">
              <Calendar className="w-5 h-5 mr-2" />
              Calendar
            </h3>
            
            <div className="grid grid-cols-7 gap-1 mb-2">
              {viewMode.type === 'week' && ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(day => (
                <div key={day} className="text-center text-sm font-medium text-gray-500 p-2">
                  {day}
                </div>
              ))}
            </div>
            
            <div className={`grid gap-1 ${viewMode.type === 'week' ? 'grid-cols-7' : viewMode.type === 'month' ? 'grid-cols-7' : 'grid-cols-4'}`}>
              {getCalendarDates().map((date, index) => (
                <button
                  key={index}
                  onClick={() => setViewMode(prev => ({ ...prev, date }))}
                  className={`p-2 text-sm rounded-md transition-colors ${
                    date.toDateString() === viewMode.date.toDateString()
                      ? 'bg-blue-600 text-white'
                      : hasResponses(date)
                      ? 'bg-green-100 text-green-800 hover:bg-green-200'
                      : 'hover:bg-gray-100'
                  }`}
                >
                  {formatDate(date)}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Form */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold flex items-center">
                <Edit3 className="w-5 h-5 mr-2" />
                Weekly Meeting Form - {viewMode.date.toLocaleDateString()}
              </h3>
              <button
                onClick={saveResponses}
                disabled={loading}
                className="flex items-center px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors disabled:opacity-50"
              >
                <Save className="w-4 h-4 mr-2" />
                Save Responses
              </button>
            </div>

            {loading ? (
              <div className="flex items-center justify-center h-32">
                <div className="text-gray-500">Loading...</div>
              </div>
            ) : (
              <div className="space-y-6">
                {questions.map((question, index) => (
                  <div key={question.id} className="border-b border-gray-200 pb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {index + 1}. {question.question_text}
                    </label>
                    {renderQuestionInput(question)}
                  </div>
                ))}
                
                {questions.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    No questions available. Add some questions to get started.
                  </div>
                )}
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
                  onChange={(e) => setNewQuestion(prev => ({ ...prev, question_text: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows={3}
                  placeholder="Enter your question..."
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Question Type
                </label>
                <select
                  value={newQuestion.question_type}
                  onChange={(e) => setNewQuestion(prev => ({ ...prev, question_type: e.target.value as any }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="text">Text</option>
                  <option value="rating">Rating (1-10)</option>
                  <option value="multiple_choice">Multiple Choice</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Position
                </label>
                <input
                  type="number"
                  value={newQuestion.position}
                  onChange={(e) => setNewQuestion(prev => ({ ...prev, position: parseInt(e.target.value) || 0 }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  min="0"
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
