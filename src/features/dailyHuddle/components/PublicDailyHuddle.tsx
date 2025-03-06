import React, { useState, useEffect } from "react";
import { useLocation, useParams } from "react-router-dom";
import { fetchQuestions, submitResponse, fetchResponse, updateResponse } from "../services/huddleService";
import { getUserData } from "../../../services/useUser";
import { Question } from "../types/huddle.types";
import { FORM_ID } from "../constants";
import { ClipLoader } from "react-spinners";
import wheelImage from '../assets/wheel.png';
import '../styles/DailyHuddleForm.css';

/**
 * PublicDailyHuddle Component
 * 
 * A standalone public page for the Daily Huddle form that doesn't require login
 * but can accept a user ID via URL parameter
 * 
 * @component
 * @returns {JSX.Element} Rendered component
 */
const PublicDailyHuddle: React.FC = () => {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [hasSubmitted, setHasSubmitted] = useState<boolean>(false);
  const [answers, setAnswers] = useState<{ [key: string]: string }>({});
  const [wheelRotation, setWheelRotation] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [startAngle, setStartAngle] = useState(0);
  const [activeQuestion, setActiveQuestion] = useState<number>(0);
  const [employeeId, setEmployeeId] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [responseId, setResponseId] = useState<string | null>(null);
  const [userError, setUserError] = useState<string | null>(null);
  
  const location = useLocation();
  const params = useParams();

  useEffect(() => {
    const initializeForm = async () => {
      setLoading(true);
      try {
        // Extract user ID from URL params or query
        const userId = params.userid || new URLSearchParams(location.search).get('userid');
        
        // If we have a userId, get the employee ID
        if (userId) {
          try {
            const userData = await getUserData(userId);
            if (!userData || !userData.id) {
              setUserError("Invalid user ID. Unable to load user data.");
              setLoading(false);
              return;
            }
            
            setEmployeeId(userData.id);
            console.log('Employee ID set:', userData.id);
            
            // Check if the user has already submitted today
            if (userData.id) {
              const today = new Date().toISOString().split('T')[0];
              const todayResponse = await fetchResponse(today, userData.id);
              
              if (todayResponse) {
                setIsEditing(true);
                setResponseId(todayResponse.response_id);
                
                // Set the answers from the previous submission
                const previousAnswers = todayResponse.questions.reduce((acc, response) => ({
                  ...acc,
                  [response.question_id]: response.answer_text,
                }), {});
                
                setAnswers(previousAnswers);
                setHasSubmitted(false); // Allow editing
              }
            }
          } catch (error) {
            console.error("Failed to get employee data:", error);
            setUserError("Failed to retrieve user data. The user ID may be invalid.");
            setLoading(false);
            return;
          }
        }

        const fetchedQuestions = await fetchQuestions();
        setQuestions(fetchedQuestions);
      } catch (error) {
        console.error("Failed to fetch questions:", error);
        if (!userError) {
          setUserError("An error occurred while loading the form. Please try again later.");
        }
      } finally {
        setLoading(false);
      }
    };

    initializeForm();
  }, [location, params, userError]);

  useEffect(() => {
    const style = document.createElement('style');
    style.innerHTML = `
      @keyframes spin-slow {
        from { transform: rotate(0deg); }
        to { transform: rotate(360deg); }
      }
      .animate-spin-slow {
        animation: spin-slow 3s linear infinite;
      }
    `;
    document.head.appendChild(style);
    return () => {
      document.head.removeChild(style);
    };
  }, []);

  const handleInputChange = (questionId: string, answerText: string) => {
    setAnswers((prevAnswers) => ({
      ...prevAnswers,
      [questionId]: answerText,
    }));
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    // Check for empty goals in the "Today Goals and Targeted Results" question
    const goalsQuestion = questions.find(q => q.question_text.includes("Today Goals and Targeted Results"));
    if (goalsQuestion) {
      const goalsAnswer = answers[goalsQuestion.id];
      if (goalsAnswer) {
        const goals = goalsAnswer.split('\n');
        // Check if any goal is empty
        if (goals.some(goal => goal.trim() === '')) {
          alert("Please fill in all goals or remove empty ones before submitting.");
          return;
        }
      }
    }

    try {
      if (isEditing && responseId) {
        // Update existing response
        const updateData = questions.map((question) => ({
          answer_text: answers[question.id] || "",
          question_id: question.id
        }));
        
        await updateResponse(responseId, updateData);
      } else {
        // Submit new response
        const responseData = {
          response_data: {
            employee_id: employeeId || "public-user",
            questionnaire_id: FORM_ID,
          },
          answers_data: questions.map((question) => ({
            answer_text: answers[question.id] || "",
            question_id: question.id,
          })),
        };
        
        await submitResponse(responseData);
      }
      
      setHasSubmitted(true);
    } catch (error) {
      console.error("Submission failed:", error);
      alert("Failed to submit your response. Please try again.");
    }
  };

  const handleMouseDown = (e: React.MouseEvent<HTMLImageElement>) => {
    setIsDragging(true);
    const rect = e.currentTarget.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    const angle = Math.atan2(e.clientY - centerY, e.clientX - centerX);
    setStartAngle(angle - wheelRotation * Math.PI / 180);
  };

  const handleMouseMove = React.useCallback((e: MouseEvent) => {
    if (!isDragging) return;
    
    const rect = (document.getElementById('emotion-wheel') as HTMLElement).getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    const angle = Math.atan2(e.clientY - centerY, e.clientX - centerX);
    const newRotation = (angle - startAngle) * 180 / Math.PI;
    setWheelRotation(newRotation);
  }, [isDragging, startAngle]);

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  useEffect(() => {
    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    }
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, handleMouseMove]);

  const formatQuestionText = (text: string) => {
    const replacements: { [key: string]: string } = {
      "One-word opener": "One-Word Opener",
      "Wins(1 work + 1 personal)": "Wins (1 Work + 1 Personal)",
      "I need critical help on": "I Need Critical Help On",
      "Main Priority": "Main Priority for Today"
    };

    return replacements[text] || text;
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen bg-gradient-to-b from-blue-50 to-white">
        <div className="text-center">
          <ClipLoader size={60} color={"#4F46E5"} loading={loading} />
          <p className="mt-4 text-gray-600 animate-pulse">Loading your daily huddle...</p>
        </div>
      </div>
    );
  }

  if (userError) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto">
          <div className="bg-white shadow-xl rounded-2xl p-8 text-center">
            <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <h2 className="text-3xl font-bold text-gray-800 mb-2">Error</h2>
            <p className="text-gray-600 text-lg mb-8">{userError}</p>
            <a 
              href="/"
              className="px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors shadow-md hover:shadow-lg transform hover:-translate-y-1"
            >
              Return to Home
            </a>
          </div>
        </div>
      </div>
    );
  }

  if (hasSubmitted) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto">
          <div className="bg-white shadow-xl rounded-2xl p-8 text-center">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="text-3xl font-bold text-gray-800 mb-2">Thank You!</h2>
            <p className="text-gray-600 text-lg mb-8">Your daily huddle has been submitted successfully.</p>
            <button
              onClick={() => setHasSubmitted(false)}
              className="px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors shadow-md hover:shadow-lg transform hover:-translate-y-1"
            >
              Submit Another Response
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto">
        <div className="bg-white shadow-xl rounded-2xl overflow-hidden">
          <div className="p-6 sm:p-10 bg-indigo-600 text-white">
            <h1 className="text-3xl font-bold text-center">Daily Huddle Form</h1>
            <p className="text-center mt-2 text-indigo-100">
              {isEditing 
                ? "Edit your previous submission" 
                : employeeId 
                  ? "Submitting as registered user" 
                  : "Share your focus and goals for today"}
            </p>
          </div>
          
          <div className="p-6 sm:p-10">
            <div className="flex flex-col lg:flex-row gap-10">
              {/* Form Section */}
              <div className="w-full lg:w-1/2 order-2 lg:order-1">
                <form onSubmit={handleSubmit} className="space-y-8">
                  {questions.map((question, index) => (
                    <div 
                      key={question.id} 
                      className={`p-6 rounded-xl transition-all duration-300 ${
                        activeQuestion === index 
                          ? 'bg-indigo-50 shadow-md' 
                          : 'bg-white hover:bg-gray-50'
                      }`}
                      onClick={() => setActiveQuestion(index)}
                    >
                      <label className="block mb-3 font-bold text-gray-800 text-lg">
                        {formatQuestionText(question.question_text)}
                      </label>
                      {question.question_text.includes("Today Goals and Targeted Results") ? (
                        <GoalsInput
                          value={answers[question.id] || ""}
                          onChange={(goals) => handleInputChange(question.id, goals.join('\n'))}
                        />
                      ) : (
                        <input
                          title={question.question_text}
                          type="text"
                          value={answers[question.id] || ""}
                          onChange={(e) => handleInputChange(question.id, e.target.value)}
                          className="w-full p-3 border border-gray-300 rounded-lg text-center focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
                          placeholder={`Enter your ${question.question_text.toLowerCase()}`}
                        />
                      )}
                    </div>
                  ))}
                  <div className="mt-8 text-center">
                    <button
                      type="submit"
                      className="px-8 py-4 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-all shadow-md hover:shadow-lg transform hover:-translate-y-1 font-medium text-lg"
                    >
                      {isEditing ? "Update Daily Huddle" : "Submit Daily Huddle"}
                    </button>
                  </div>
                </form>
              </div>
              
              {/* Wheel Section */}
              <div className="w-full lg:w-1/2 order-1 lg:order-2 mb-8 lg:mb-0">
                <div className="bg-indigo-900 text-white p-4 rounded-xl mb-6 text-center shadow-lg transform -rotate-1">
                  <div className="flex items-center justify-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 animate-spin-slow" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                    <span className="font-medium">Rotate the wheel for inspiration!</span>
                  </div>
                </div>
                <div className="relative flex justify-center">
                  <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white rounded-full w-20 h-20 flex items-center justify-center shadow-lg z-10 border-4 border-indigo-100">
                    <span className="text-gray-800 font-bold text-sm">I Feel...</span>
                  </div>
                  <img
                    id="emotion-wheel"
                    src={wheelImage}
                    alt="Emotion Wheel"
                    className={`w-full max-w-md mx-auto ${isDragging ? 'cursor-grabbing' : 'cursor-grab'} select-none`}
                    style={{
                      transform: `rotate(${wheelRotation}deg)`,
                      transition: isDragging ? 'none' : 'transform 0.2s ease-out',
                    }}
                    onMouseDown={handleMouseDown}
                    onTouchStart={(e) => {
                      const touch = e.touches[0];
                      handleMouseDown({
                        clientX: touch.clientX,
                        clientY: touch.clientY,
                        currentTarget: e.currentTarget,
                      } as React.MouseEvent<HTMLImageElement>);
                    }}
                    draggable={false}
                  />
                </div>
                <div className="mt-6 bg-gray-50 p-4 rounded-lg border border-gray-200">
                  <h3 className="font-medium text-gray-700 mb-2">How to use the emotion wheel:</h3>
                  <ol className="text-sm text-gray-600 space-y-1 list-decimal list-inside">
                    <li>Click and drag to rotate the wheel</li>
                    <li>Find an emotion that resonates with you today</li>
                    <li>Use it as your "One-Word Opener" in the form</li>
                  </ol>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

/**
 * GoalsInput Component - Redesigned for better UX
 */
const GoalsInput: React.FC<{
  value: string;
  onChange: (goals: string[]) => void;
}> = ({ value, onChange }) => {
  const [localGoals, setLocalGoals] = useState<string[]>(
    value ? value.split('\n') : ['']
  );
  
  const MAX_GOALS = 6;
  
  const handleGoalChange = (index: number, text: string) => {
    const newGoals = [...localGoals];
    newGoals[index] = text;
    setLocalGoals(newGoals);
    onChange(newGoals);
  };
  
  const addNewGoal = () => {
    if (localGoals.length >= MAX_GOALS) {
      alert(`Maximum of ${MAX_GOALS} goals allowed`);
      return;
    }
    
    const newGoals = [...localGoals, ''];
    setLocalGoals(newGoals);
    onChange(newGoals);
  };
  
  const removeGoal = (index: number) => {
    if (localGoals.length > 1) {
      const newGoals = [...localGoals];
      newGoals.splice(index, 1);
      setLocalGoals(newGoals);
      onChange(newGoals);
    }
  };
  
  useEffect(() => {
    const propsGoals = value ? value.split('\n') : [''];
    if (propsGoals.length !== localGoals.length) {
      setLocalGoals(propsGoals);
    }
  }, [value, localGoals.length]);
  
  return (
    <div className="goals-input-container space-y-3">
      {localGoals.map((goal, index) => (
        <div key={`goal-${index}`} className="flex items-center space-x-2 group">
          <div className="flex-shrink-0 w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-800 font-medium">
            {index + 1}
          </div>
          <input
            type="text"
            value={goal}
            onChange={(e) => handleGoalChange(index, e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                addNewGoal();
              } else if (e.key === 'Backspace' && goal === '' && localGoals.length > 1) {
                e.preventDefault();
                removeGoal(index);
              }
            }}
            placeholder={`Enter goal ${index + 1}`}
            className="flex-grow p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
          />
          {localGoals.length > 1 && (
            <button
              type="button"
              onClick={() => removeGoal(index)}
              title="Remove this goal"
              className="flex-shrink-0 w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 hover:bg-red-100 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"
            >
              ×
            </button>
          )}
        </div>
      ))}
      
      {localGoals.length < MAX_GOALS && (
        <button 
          type="button" 
          onClick={addNewGoal}
          className="mt-3 flex items-center justify-center w-full p-3 border border-dashed border-indigo-300 rounded-lg text-indigo-600 hover:bg-indigo-50 transition-colors"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
          Add Another Goal <span className="ml-2 text-sm text-indigo-400">({localGoals.length}/{MAX_GOALS})</span>
        </button>
      )}
      
      {localGoals.length >= MAX_GOALS && (
        <div className="mt-3 text-center text-sm text-gray-500">
          Maximum of {MAX_GOALS} goals reached
        </div>
      )}
    </div>
  );
};

export default PublicDailyHuddle;