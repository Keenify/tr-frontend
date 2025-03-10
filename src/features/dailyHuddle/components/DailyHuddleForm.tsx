import React, { useEffect, useState, useCallback } from "react";
import { fetchQuestions, submitResponse, fetchResponse, updateResponse } from "../services/huddleService";
import { getUserData } from "../../../services/useUser";
import { Question, ResponseData } from "../types/huddle.types";
import { Session } from "@supabase/supabase-js";
import { FORM_ID, CUTOFF_HOUR, MAX_GOALS } from "../constants";
import { ClipLoader } from "react-spinners";
import wheelImage from '../assets/wheel.png';
import '../styles/DailyHuddleForm.css';

interface DailyHuddleFormProps {
  session: Session;
}

/**
 * Gets the effective date for submissions based on cutoff time
 * If current time is after cutoff, returns tomorrow's date
 * Otherwise returns today's date
 * 
 * @returns {string} Date string in YYYY-MM-DD format
 */
const getEffectiveDate = (): string => {
  const now = new Date();
  const currentHour = now.getHours();
  
  // If it's after 6 PM, use tomorrow's date
  if (currentHour >= CUTOFF_HOUR) {
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow.toISOString().split('T')[0];
  }
  
  // Otherwise use today's date
  return now.toISOString().split('T')[0];
};

/**
 * DailyHuddleForm Component
 * 
 * A form component that displays daily huddle questions for employees to answer.
 * It handles fetching questions, managing form state, and submitting responses.
 * 
 * @component
 * @param {DailyHuddleFormProps} props - Component props
 * @param {Session} props.session - User session object containing authentication details
 * @returns {JSX.Element} Rendered form component
 */
const DailyHuddleForm: React.FC<DailyHuddleFormProps> = ({ session }) => {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [hasSubmitted, setHasSubmitted] = useState<boolean>(false);
  const [answers, setAnswers] = useState<{ [key: string]: string }>({});
  const [employeeId, setEmployeeId] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [responseId, setResponseId] = useState<string | null>(null);
  const [wheelRotation, setWheelRotation] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [startAngle, setStartAngle] = useState(0);
  const [effectiveDate, setEffectiveDate] = useState<string>(getEffectiveDate());

  /**
   * Initializes the form by fetching necessary data
   * - Retrieves user data
   * - Fetches questions
   * - Checks if user has already submitted for the effective date
   */
  useEffect(() => {
    const initializeForm = async () => {
      setLoading(true);
      try {
        const userData = await getUserData(session.user.id);
        setEmployeeId(userData.id);

        const fetchedQuestions = await fetchQuestions();
        console.log('Fetched questions:', fetchedQuestions);
        setQuestions(fetchedQuestions);

        if (userData.id) {
          // Get the effective date (today or tomorrow based on cutoff time)
          const currentEffectiveDate = getEffectiveDate();
          setEffectiveDate(currentEffectiveDate);
          
          // Check if user has already submitted for the effective date
          const effectiveResponse = await fetchResponse(currentEffectiveDate, userData.id);
          setHasSubmitted(!!effectiveResponse);

          if (effectiveResponse) {
            const typedResponse = effectiveResponse as ResponseData;
            setResponseId(typedResponse.response_id);
            const previousAnswers = typedResponse.questions.reduce((acc, response) => ({
              ...acc,
              [response.question_id]: response.answer_text,
            }), {});
            setAnswers(previousAnswers);
          }
        }
      } catch (error) {
        console.error("Initialization failed:", error);
      } finally {
        setLoading(false);
      }
    };

    initializeForm();
  }, [session.user.id]);

  /**
   * Updates the answers state when user inputs change
   * 
   * @param {string} questionId - The ID of the question being answered
   * @param {string} answerText - The text input by the user
   */
  const handleInputChange = (questionId: string, answerText: string) => {
    setAnswers((prevAnswers) => ({
      ...prevAnswers,
      [questionId]: answerText,
    }));
  };

  /**
   * Handles form submission
   * Constructs response data and submits it to the server
   * Uses the effective date based on cutoff time
   * 
   * @param {React.FormEvent} event - Form submission event
   */
  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!employeeId) {
      console.error("Employee ID is not available");
      return;
    }

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

    // Use the effective date for the submission
    const responseData = {
      response_data: {
        employee_id: employeeId,
        questionnaire_id: FORM_ID,
        date: effectiveDate, // Use the effective date
      },
      answers_data: questions.map((question) => ({
        answer_text: answers[question.id] || "",
        question_id: question.id,
      })),
    };

    try {
      if (isEditing && responseId) {
        const updateData = questions.map((question) => ({
          answer_text: answers[question.id] || "",
          question_id: question.id
        }));
        await updateResponse(responseId, updateData);
        console.log("Successfully updated response");
      } else {
        // Use submitResponse for new submissions
        const result = await submitResponse(responseData);
        // Store the response ID for potential future edits
        if (result && result.response_id) {
          setResponseId(result.response_id);
        }
      }
      
      setHasSubmitted(true);
      setIsEditing(false); // Reset editing state after successful submission
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

  const handleMouseMove = useCallback((e: MouseEvent) => {
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
      "Main Priority": "Main Priority for Today",
      "Today Goals and Targeted Results": "Today Goals and Targeted Results?"
    };

    return replacements[text] || text;
  };

  if (loading) {
    return (
      <div className="loading-container">
        <ClipLoader size={50} color={"#007BFF"} loading={loading} />
      </div>
    );
  }

  if (hasSubmitted) {
    return (
      <div className="thank-you-container">
        <div className="thank-you-message">
          Thank you! Your daily huddle has been submitted for today.
        </div>
        <button
          onClick={() => {
            setIsEditing(true);
            setHasSubmitted(false);
          }}
          className="edit-button"
        >
          Edit Response
        </button>
      </div>
    );
  }

  return (
    <div className="daily-huddle-container">
      <div className="form-container">
        {/* Enhanced effective date display */}
        <div className="effective-date-container">
          <span className="effective-date-text">
            Submitting for: <span className="effective-date-value">
              {new Date(effectiveDate).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
            </span>
          </span>
        </div>
        
        <form onSubmit={handleSubmit} className="huddle-form">
          {questions.map((question, index) => (
            <div 
              key={question.id} 
              className={`question-container ${index === 0 ? 'first-question' : ''}`}
            >
              <label className="question-label">
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
                  className="text-input"
                />
              )}
            </div>
          ))}
          <button
            type="submit"
            className="submit-button"
          >
            {isEditing ? "Update" : "Submit"}
          </button>
        </form>
      </div>

      <div className="wheel-container">
        <div className="rotate-cursor">Rotate Me to Get Inspiration for One Word Opener ↺</div>
        <img
          id="emotion-wheel"
          src={wheelImage}
          alt="Emotion Wheel"
          className="emotion-wheel"
          style={{
            transform: `rotate(${wheelRotation}deg)`,
            transition: isDragging ? 'none' : 'transform 0.1s ease-out'
          }}
          onMouseDown={handleMouseDown}
          draggable={false}
        />
      </div>
    </div>
  );
};

/**
 * GoalsInput Component
 * A custom component for entering multiple goals with automatic numbering
 */
const GoalsInput: React.FC<{
  value: string;
  onChange: (goals: string[]) => void;
}> = ({ value, onChange }) => {
  // Create a local state to manage goals
  const [localGoals, setLocalGoals] = useState<string[]>(
    value ? value.split('\n') : ['']
  );
  
  // Handle changes to a specific goal
  const handleGoalChange = (index: number, text: string) => {
    const newGoals = [...localGoals];
    newGoals[index] = text;
    setLocalGoals(newGoals);
    onChange(newGoals);
  };
  
  // Add a new goal
  const addNewGoal = () => {
    if (localGoals.length >= MAX_GOALS) {
      // Show a message or tooltip that max goals reached
      alert(`Maximum of ${MAX_GOALS} goals allowed`);
      return;
    }
    
    console.log("Adding new goal");
    const newGoals = [...localGoals, ''];
    setLocalGoals(newGoals);
    onChange(newGoals);
  };
  
  // Remove a goal
  const removeGoal = (index: number) => {
    if (localGoals.length > 1) {
      const newGoals = [...localGoals];
      newGoals.splice(index, 1);
      setLocalGoals(newGoals);
      onChange(newGoals);
    }
  };
  
  // Only update local state when value prop changes significantly
  useEffect(() => {
    const propsGoals = value ? value.split('\n') : [''];
    // Only update if the arrays are different in length
    if (propsGoals.length !== localGoals.length) {
      setLocalGoals(propsGoals);
    }
  }, [value, localGoals.length]);
  
  return (
    <div className="goals-input-container">
      {localGoals.map((goal, index) => (
        <div key={`goal-${index}`} className="goal-row">
          <div className="goal-number">{index + 1}</div>
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
            placeholder={`Goal ${index + 1}`}
            className="goal-input"
          />
          {localGoals.length > 1 && (
            <button
              type="button"
              onClick={() => removeGoal(index)}
              title="Remove this goal"
              className="remove-goal-button"
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
          className="add-goal-button"
        >
          <span className="add-icon">+</span> 
          Add Another Goal <span className="goal-counter">({localGoals.length}/{MAX_GOALS})</span>
        </button>
      )}
      
      {localGoals.length >= MAX_GOALS && (
        <div className="max-goals-message">
          Maximum of {MAX_GOALS} goals reached
        </div>
      )}
    </div>
  );
};

export default DailyHuddleForm;
