import React, { useEffect, useState, useCallback, useRef } from "react";
import { fetchQuestions, submitResponse, fetchResponse, updateResponse } from "../services/huddleService";
import { getUserData } from "../../../services/useUser";
import { Question, ResponseData } from "../types/huddle.types";
import { Session } from "@supabase/supabase-js";
import { FORM_ID, CUTOFF_HOUR, MAX_GOALS } from "../constants";
import { ClipLoader } from "react-spinners";
import wheelImage from '../assets/wheel.png';
import '../styles/DailyHuddleForm.css';
import { useTooltipGuidance } from '../hooks/useTooltipGuidance';
import { TooltipProvider } from '../contexts/TooltipProvider';

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
  // Get current date in Singapore timezone
  const now = new Date();
  
  // Convert to Singapore timezone (UTC+8)
  const sgDate = new Date(now.toLocaleString('en-US', { timeZone: 'Asia/Singapore' }));
  const currentHour = sgDate.getHours();
  
  // If it's after cutoff hour (6 PM), use tomorrow's date
  if (currentHour >= CUTOFF_HOUR) {
    const tomorrow = new Date(sgDate);
    tomorrow.setDate(tomorrow.getDate() + 1);
    // Format date as YYYY-MM-DD in Singapore timezone
    return tomorrow.toLocaleDateString('en-CA', { timeZone: 'Asia/Singapore' });
  }
  
  // Otherwise use today's date in Singapore timezone
  return sgDate.toLocaleDateString('en-CA', { timeZone: 'Asia/Singapore' });
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
const DailyHuddleFormContent: React.FC<DailyHuddleFormProps> = ({ session }) => {
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
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState<boolean>(false);
  const [initialAnswers, setInitialAnswers] = useState<{ [key: string]: string }>({});
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  
  // Refs for tooltip guidance
  const tooltipRef = useRef<HTMLDivElement | null>(null);
  const guidanceTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Determine initial position based on question type
  const getInitialPosition = (questionText: string): 'left' | 'right' => {
    return questionText.includes("One-word opener") ? 'left' : 'right';
  };

  const {
    showGuidance,
    activeId: activeQuestionId,
    tooltipPosition: guidancePosition,
    position: tooltipPosition,
    handleInputFocus: handleTooltipFocus,
    handleInputBlur,
    closeGuidance,
    isDragging: tooltipIsDragging,
    handleDragStart
  } = useTooltipGuidance<string>({
    tooltipRef,
    guidanceTimeoutRef,
    tooltipId: 'main-form-guidance',
    initialPosition: 'right' // Default to right, will be updated on focus
  });

  // Update the handleInputFocus to use the new hook
  const handleInputFocus = useCallback((e: React.FocusEvent<HTMLInputElement>, questionId: string) => {
    // Determine the initial position based on the question type
    const questionText = e.currentTarget.title || "";
    const initialPosition = getInitialPosition(questionText);
    
    handleTooltipFocus(e.currentTarget, questionId, initialPosition);
  }, [handleTooltipFocus]);

  // Guidance tips for different question types
  const guidanceTips: { [key: string]: string[] } = {
    "One-word opener": [
      "Choose a word that captures your current energy or mindset",
      "Consider words like: Focused, Determined, Excited, Challenged",
      "Be authentic about how you're feeling today",
      "This sets the tone for your day and helps your team understand your state of mind"
    ],
    "Wins(1 work + 1 personal)": [
      "Share one professional accomplishment from yesterday or recently",
      "Include one personal achievement or positive moment",
      "Be specific about what you accomplished",
      "Celebrate progress, no matter how small"
    ],
    "I need critical help on": [
      "Identify your biggest blocker or challenge",
      "Be specific about what assistance you need",
      "Consider who might be able to help you",
      "Don't hesitate to ask for support - that's what teams are for"
    ],
    "Main Priority": [
      "Focus on your single most important task for today",
      "This should align with your team or company objectives",
      "Be specific about what success looks like",
      "Consider what will move the needle most for your work"
    ],
    "Today Goals and Targeted Results": [] // This will use the existing GoalsInput component
  };

  // Example answers for different question types
  const exampleAnswers: { [key: string]: string } = {
    "One-word opener": "Energized",
    "Wins(1 work + 1 personal)": "Completed the quarterly report ahead of schedule; Started my morning workout routine",
    "I need critical help on": "Troubleshooting the payment gateway integration before tomorrow's demo",
    "Main Priority": "Finalizing the product roadmap for Q3",
  };

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
          let foundResponse = await fetchResponse(currentEffectiveDate, userData.id);

          // Fallback: if no response for the effective date and it's after cutoff (effectiveDate = tomorrow),
          // check today's date so users who submitted earlier today still see their response
          if (!foundResponse) {
            const todayDate = new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Singapore' });
            if (currentEffectiveDate !== todayDate) {
              foundResponse = await fetchResponse(todayDate, userData.id);
              if (foundResponse) {
                // Found today's response — load it but keep effectiveDate as tomorrow
                // so a fresh tomorrow submission can still be made
                setEffectiveDate(currentEffectiveDate);
              }
            }
          }

          setHasSubmitted(!!foundResponse);

          if (foundResponse) {
            const typedResponse = foundResponse as ResponseData;
            setResponseId(typedResponse.response_id);
            const previousAnswers = typedResponse.questions.reduce((acc, response) => ({
              ...acc,
              [response.question_id]: response.answer_text,
            }), {});
            setAnswers(previousAnswers);
            setInitialAnswers(previousAnswers);
            setHasUnsavedChanges(false);
          } else {
            // Initialize with empty answers for change detection
            const emptyAnswers: { [key: string]: string } = {};
            setInitialAnswers(emptyAnswers);
            setHasUnsavedChanges(false);
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

  // Add beforeunload warning for unsaved changes
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasUnsavedChanges) {
        e.preventDefault();
        e.returnValue = 'You have unsaved changes. Are you sure you want to leave?';
        return 'You have unsaved changes. Are you sure you want to leave?';
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [hasUnsavedChanges]);

  /**
   * Check if the current answers differ from initial answers
   */
  const checkForUnsavedChanges = (currentAnswers: { [key: string]: string }) => {
    // Compare current answers with initial answers
    for (const questionId in currentAnswers) {
      if (currentAnswers[questionId] !== (initialAnswers[questionId] || '')) {
        return true;
      }
    }
    // Also check if initial answers have keys that current doesn't
    for (const questionId in initialAnswers) {
      if ((initialAnswers[questionId] || '') !== (currentAnswers[questionId] || '')) {
        return true;
      }
    }
    return false;
  };

  /**
   * Updates the answers state when user inputs change
   * 
   * @param {string} questionId - The ID of the question being answered
   * @param {string} answerText - The text input by the user
   */
  const handleInputChange = (questionId: string, answerText: string) => {
    const newAnswers = {
      ...answers,
      [questionId]: answerText,
    };
    
    setAnswers(newAnswers);
    
    // Check for unsaved changes
    const hasChanges = checkForUnsavedChanges(newAnswers);
    setHasUnsavedChanges(hasChanges);
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
    if (isSubmitting) return;
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
        date: effectiveDate,
      },
      answers_data: questions.map((question) => ({
        answer_text: answers[question.id] || "",
        question_id: question.id,
      })),
    };

    setIsSubmitting(true);
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
      setHasUnsavedChanges(false); // Clear unsaved changes after successful submission
      setInitialAnswers(answers); // Update initial state to current answers
    } catch (error) {
      console.error("Submission failed:", error);
      alert("Failed to submit your response. Please try again.");
    } finally {
      setIsSubmitting(false);
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
      "OKR": "OKR",
      "Today Goals and Targeted Results": "Important Tasks Today",
      "Thank You To": "Thank You To... (Optional)"
    };

    return replacements[text] || text;
  };

  // Debounced scroll and resize handling to reduce excessive re-renders
  useEffect(() => {
    let timeoutId: NodeJS.Timeout | null = null;
    
    const handleScrollOrResize = () => {
      // Clear previous timeout to debounce
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
      
      // Only reposition if actively showing guidance
      if (showGuidance && activeQuestionId !== null && tooltipRef.current && document.activeElement) {
        timeoutId = setTimeout(() => {
          const questionElement = document.querySelector(`input[title="${questions.find(q => q.id === activeQuestionId)?.question_text}"]`);
          
          if (questionElement && document.activeElement === questionElement) {
            handleTooltipFocus(questionElement as HTMLElement, activeQuestionId);
          }
        }, 150); // Debounced timeout
      }
    };

    // Use passive listeners to improve performance
    window.addEventListener('scroll', handleScrollOrResize, { passive: true });
    window.addEventListener('resize', handleScrollOrResize, { passive: true });
    
    return () => {
      window.removeEventListener('scroll', handleScrollOrResize);
      window.removeEventListener('resize', handleScrollOrResize);
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
  }, [showGuidance, activeQuestionId, questions, handleTooltipFocus]);

  // Get guidance tips for a specific question
  const getGuidanceForQuestion = (questionText: string): string[] => {
    // Find the matching guidance tips
    for (const key in guidanceTips) {
      if (questionText.includes(key)) {
        return guidanceTips[key];
      }
    }
    // Default guidance if no specific tips found
    return [
      "Be specific and clear in your response",
      "Consider how this information helps your team",
      "Reflect on how this connects to your goals",
      "Be honest and authentic in your answer"
    ];
  };

  // Get example answer for a specific question
  const getExampleForQuestion = (questionText: string): string => {
    // Find the matching example
    for (const key in exampleAnswers) {
      if (questionText.includes(key)) {
        return exampleAnswers[key];
      }
    }
    // Default example if no specific one found
    return "Your thoughtful response here";
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
            setHasUnsavedChanges(false); // Don't treat existing data as unsaved changes
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
            {hasUnsavedChanges && (
              <span className="unsaved-changes-indicator" style={{ 
                marginLeft: '10px', 
                color: '#ff6b35', 
                fontSize: '12px',
                fontWeight: 'bold'
              }}>
                • Unsaved changes
              </span>
            )}
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
                <div className="input-wrapper">
                  <input
                    title={question.question_text}
                    type="text"
                    autoComplete="off"
                    value={answers[question.id] || ""}
                    onChange={(e) => handleInputChange(question.id, e.target.value)}
                    onFocus={(e) => handleInputFocus(e, question.id)}
                    onBlur={handleInputBlur}
                    className="text-input"
                  />
                </div>
              )}
            </div>
          ))}

          {/* Floating Guidance Window for regular inputs */}
          {showGuidance && activeQuestionId !== null && (
            <div 
              ref={tooltipRef}
              className={`goal-guidance-tooltip ${tooltipPosition === 'above' ? 'tooltip-above' : ''} ${tooltipIsDragging ? 'dragging' : ''}`}
              style={{
                position: 'fixed',
                top: `${guidancePosition.top}px`,
                left: `${guidancePosition.left}px`,
              }}
              onMouseDown={(e) => {
                // Only start dragging if clicking on the tooltip itself or the header, not on buttons or links
                if (e.target === tooltipRef.current || 
                    (e.target as HTMLElement).classList.contains('tooltip-header') ||
                    (e.target as HTMLElement).tagName === 'H4') {
                  handleDragStart(e);
                }
              }}
            >
              <div className="tooltip-header">
                <h4>
                  Guidance:
                </h4>
                <button 
                  className="tooltip-close-btn"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    closeGuidance();
                  }}
                  title="Close guidance"
                >
                  ×
                </button>
              </div>
              <ul>
                {getGuidanceForQuestion(
                  questions.find(q => q.id === activeQuestionId)?.question_text || ""
                ).map((tip, i) => (
                  <li key={i}>{tip}</li>
                ))}
              </ul>
              <div className="example">
                Example: "{getExampleForQuestion(
                  questions.find(q => q.id === activeQuestionId)?.question_text || ""
                )}"
              </div>
            </div>
          )}
          
          <button
            type="submit"
            className="submit-button"
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <>
                <ClipLoader size={16} color={"#fff"} loading={true} />
                <span>{isEditing ? "Updating..." : "Submitting..."}</span>
              </>
            ) : (
              isEditing ? "Update" : "Submit"
            )}
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
  
  // Create refs for input fields
  const inputRefs = React.useRef<(HTMLInputElement | null)[]>([]);
  
  // Refs for tooltip guidance
  const tooltipRef = useRef<HTMLDivElement | null>(null);
  const guidanceTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const {
    showGuidance,
    activeId: activeInputIndex,
    tooltipPosition: guidancePosition,
    position: tooltipPosition,
    handleInputFocus: handleTooltipFocus,
    handleInputBlur,
    closeGuidance,
    isDragging: tooltipIsDragging,
    handleDragStart
  } = useTooltipGuidance<number>({
    tooltipRef,
    guidanceTimeoutRef,
    tooltipId: 'goals-guidance',
    initialPosition: 'right'
  });

  // Guidance tips for goals - organized by goal number (0-indexed)
  const guidanceTips = [
    [ // First goal (index 0)
      "Make your first goal your highest priority task",
      "Be specific about what you want to accomplish",
      "Include a clear deadline or timeframe",
      "Focus on what will make the biggest impact today"
    ],
    [ // Second goal (index 1)
      "This should be your second most important task",
      "Consider what dependencies this goal has",
      "Make it measurable so you know when it's done",
      "Align this with your team or company objectives"
    ],
    [ // Third goal (index 2)
      "This goal should support your main priorities",
      "Consider what you can realistically finish today",
      "Be specific about the outcome you want",
      "Think about who this goal will benefit"
    ],
    [ // Fourth goal (index 3)
      "Use this for important but not urgent tasks",
      "Consider what will move your projects forward",
      "Be clear about what 'done' looks like",
      "Think about how this connects to longer-term goals"
    ],
    [ // Fifth goal (index 4)
      "Use this for stretch goals if time permits",
      "Consider what would be a bonus to accomplish",
      "Keep it realistic but ambitious",
      "Think about what would make today exceptional"
    ]
  ];
  
  // Example goals for each position
  const exampleGoals = [
    "Complete client proposal draft by 2pm",
    "Review team's progress reports and provide feedback",
    "Prepare slides for tomorrow's presentation",
    "Follow up with marketing team on campaign metrics",
    "Brainstorm solutions for the inventory tracking issue"
  ];
  
  // Get the appropriate tips based on goal index
  const getGuidanceForGoal = (index: number) => {
    // If we have specific tips for this index, use them
    if (index < guidanceTips.length) {
      return guidanceTips[index];
    }
    // Otherwise use default tips
    return [
      "Make your goal specific and measurable",
      "Include a deadline or timeframe",
      "Focus on what you can accomplish today",
      "Use action verbs to start your goal"
    ];
  };
  
  // Get example for the current goal
  const getExampleForGoal = (index: number) => {
    return index < exampleGoals.length 
      ? exampleGoals[index] 
      : "Complete [specific task] by [specific time]";
  };
  
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
    
    // Focus on the new input field after state update and trigger guidance
    setTimeout(() => {
      const newIndex = newGoals.length - 1;
      if (inputRefs.current[newIndex]) {
        inputRefs.current[newIndex]?.focus();
        // Explicitly trigger the guidance tooltip for the new input
        handleInputFocus(newIndex);
      }
    }, 0);
  };
  
  // Remove a goal
  const removeGoal = (index: number) => {
    if (localGoals.length > 1) {
      const newGoals = [...localGoals];
      newGoals.splice(index, 1);
      setLocalGoals(newGoals);
      onChange(newGoals);
      
      // Focus on the previous input or the next available one and trigger guidance
      setTimeout(() => {
        const focusIndex = Math.min(index, newGoals.length - 1);
        if (inputRefs.current[focusIndex]) {
          inputRefs.current[focusIndex]?.focus();
          // Explicitly trigger the guidance tooltip for the focused input
          handleInputFocus(focusIndex);
        }
      }, 0);
    }
  };

  // Update the handleInputFocus to use the new hook
  const handleInputFocus = (index: number) => {
    const inputElement = inputRefs.current[index];
    if (inputElement) {
      handleTooltipFocus(inputElement, index, 'right'); // Always position goals tooltips on the right
    }
  };

  // Update the useEffect for scroll handling
  useEffect(() => {
    const handleScrollOrResize = () => {
      if (showGuidance && activeInputIndex !== null && tooltipRef.current && document.activeElement) {
        const inputElement = inputRefs.current[activeInputIndex];
        
        if (inputElement && document.activeElement === inputElement) {
          // Use a small timeout to ensure DOM is updated
          setTimeout(() => {
            handleTooltipFocus(inputElement, activeInputIndex);
          }, 10);
        }
      }
    };

    window.addEventListener('scroll', handleScrollOrResize);
    window.addEventListener('resize', handleScrollOrResize);
    
    // Call immediately to position correctly
    handleScrollOrResize();
    
    return () => {
      window.removeEventListener('scroll', handleScrollOrResize);
      window.removeEventListener('resize', handleScrollOrResize);
    };
  }, [showGuidance, activeInputIndex, handleTooltipFocus]);
  
  // Only update local state when value prop changes significantly
  useEffect(() => {
    const propsGoals = value ? value.split('\n') : [''];
    // Only update if the arrays are different in length
    if (propsGoals.length !== localGoals.length) {
      setLocalGoals(propsGoals);
    }
  }, [value, localGoals.length]);
  
  // Update refs array when goals change
  useEffect(() => {
    inputRefs.current = inputRefs.current.slice(0, localGoals.length);
  }, [localGoals.length]);
  
  return (
    <div className="goals-input-container">
      {localGoals.map((goal, index) => (
        <div key={`goal-${index}`} className="goal-row">
          <div className="goal-number">{index + 1}</div>
          <input
            type="text"
            autoComplete="off"
            value={goal}
            ref={el => inputRefs.current[index] = el}
            onChange={(e) => handleGoalChange(index, e.target.value)}
            onFocus={() => handleInputFocus(index)}
            onBlur={handleInputBlur}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                addNewGoal();
              } else if (e.key === 'Backspace' && goal === '' && localGoals.length > 1) {
                e.preventDefault();
                removeGoal(index);
              } else if (e.key === 'Tab') {
                // When tabbing between inputs, ensure guidance appears for the next input
                // The browser will handle the actual focus change
                setTimeout(() => {
                  const activeIndex = inputRefs.current.findIndex(ref => ref === document.activeElement);
                  if (activeIndex >= 0) {
                    handleInputFocus(activeIndex);
                  }
                }, 0);
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
      
      {/* Floating Guidance Window */}
      {showGuidance && activeInputIndex !== null && (
        <div 
          ref={tooltipRef}
          className={`goal-guidance-tooltip ${tooltipPosition === 'above' ? 'tooltip-above' : ''} ${tooltipIsDragging ? 'dragging' : ''}`}
          style={{
            position: 'fixed',
            top: `${guidancePosition.top}px`,
            left: `${guidancePosition.left}px`,
          }}
          onMouseDown={(e) => {
            // Only start dragging if clicking on the tooltip itself or the header, not on buttons or links
            if (e.target === tooltipRef.current || 
                (e.target as HTMLElement).classList.contains('tooltip-header') ||
                (e.target as HTMLElement).tagName === 'H4') {
              handleDragStart(e);
            }
          }}
        >
          <div className="tooltip-header">
            <h4>
              Goal {activeInputIndex + 1} Guidance:
            </h4>
            <button 
              className="tooltip-close-btn"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                closeGuidance();
              }}
              title="Close guidance"
            >
              ×
            </button>
          </div>
          <ul>
            {getGuidanceForGoal(activeInputIndex).map((tip, i) => (
              <li key={i}>{tip}</li>
            ))}
          </ul>
          <div className="example">
            Example: "{getExampleForGoal(activeInputIndex)}"
          </div>
        </div>
      )}
      
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

const DailyHuddleForm: React.FC<DailyHuddleFormProps> = (props) => {
  return (
    <TooltipProvider>
      <DailyHuddleFormContent {...props} />
    </TooltipProvider>
  );
};

export default DailyHuddleForm;
