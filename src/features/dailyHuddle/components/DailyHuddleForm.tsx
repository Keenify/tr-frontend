import React, { useEffect, useState } from "react";
import { fetchQuestions, submitResponse, fetchResponse, updateResponse } from "../services/huddleService";
import { hasSubmittedResponseToday } from "../services/huddleService";
import { getUserData } from "../../../services/useUser";
import { Question, ResponseData } from "../types/huddle.types";
import { Session } from "@supabase/supabase-js";
import { FORM_ID } from "../constants";
import { ClipLoader } from "react-spinners";

interface DailyHuddleFormProps {
  session: Session;
}

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

  /**
   * Initializes the form by fetching necessary data
   * - Retrieves user data
   * - Fetches questions
   * - Checks if user has already submitted today
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
          const submitted = await hasSubmittedResponseToday(userData.id);
          setHasSubmitted(submitted);

          if (submitted) {
            const today = new Date().toISOString().split('T')[0];
            const todayResponses = await fetchResponse(today, userData.id);
            
            if (todayResponses) {
              const typedResponse = todayResponses as ResponseData;
              setResponseId(typedResponse.response_id);
              const previousAnswers = typedResponse.questions.reduce((acc, response) => ({
                ...acc,
                [response.question_id]: response.answer_text,
              }), {});
              setAnswers(previousAnswers);
            }
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
   * 
   * @param {React.FormEvent} event - Form submission event
   */
  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!employeeId) {
      console.error("Employee ID is not available");
      return;
    }

    const responseData = {
      response_data: {
        employee_id: employeeId,
        questionnaire_id: FORM_ID,
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
      } else {
        // Use submitResponse for new submissions
        await submitResponse(responseData);
      }
      
      setHasSubmitted(true);
      setIsEditing(false); // Reset editing state after successful submission
    } catch (error) {
      console.error("Submission failed:", error);
    }
  };

  if (loading) {
    return (
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: "100vh",
        }}
      >
        <ClipLoader size={50} color={"#007BFF"} loading={loading} />
      </div>
    );
  }

  if (hasSubmitted && !isEditing) {
    return (
      <div style={{ textAlign: "center", padding: "20px" }}>
        <div>You have already submitted your response for today.</div>
        <button
          onClick={() => setIsEditing(true)}
          style={{
            marginTop: "10px",
            padding: "8px 16px",
            backgroundColor: "#007BFF",
            color: "#fff",
            border: "none",
            borderRadius: "4px",
            cursor: "pointer"
          }}
        >
          Edit Response
        </button>
      </div>
    );
  }

  return (
    <div
      style={{
        padding: "20px",
        maxWidth: "600px",
        margin: "0 auto",
        fontFamily: "Arial, sans-serif",
        backgroundColor: "#f9f9f9",
        borderRadius: "8px",
        boxShadow: "0 0 10px rgba(0, 0, 0, 0.1)",
      }}
    >
      <h1 style={{ textAlign: "center", color: "#333" }}>
        {isEditing ? "Edit Daily Huddle Response" : "Daily Huddle Questionnaire"}
      </h1>
      <form onSubmit={handleSubmit}>
        {questions.map((question) => (
          <div key={question.id} style={{ marginBottom: "20px" }}>
            <label
              style={{
                display: "block",
                marginBottom: "8px",
                fontWeight: "bold",
                color: "#555",
              }}
            >
              {question.question_text}
            </label>
            {question.question_text.includes("Today Goals and Targeted Results") ? (
              <div>
                {[1, 2, 3].map((num) => (
                  <input
                    key={`${question.id}-${num}`}
                    title={`${question.question_text} #${num}`}
                    type="text"
                    value={(answers[question.id] || "").split('\n')[num - 1] || ""}
                    onChange={(e) => {
                      const currentAnswers = (answers[question.id] || "").split('\n');
                      currentAnswers[num - 1] = e.target.value;
                      handleInputChange(question.id, currentAnswers.join('\n'));
                    }}
                    style={{
                      width: "100%",
                      padding: "10px",
                      borderRadius: "4px",
                      border: "1px solid #ddd",
                      boxSizing: "border-box",
                      marginBottom: "8px"
                    }}
                    placeholder={`Goal ${num}`}
                  />
                ))}
              </div>
            ) : (
              <input
                title={question.question_text}
                type="text"
                value={answers[question.id] || ""}
                onChange={(e) => handleInputChange(question.id, e.target.value)}
                style={{
                  width: "100%",
                  padding: "10px",
                  borderRadius: "4px",
                  border: "1px solid #ddd",
                  boxSizing: "border-box",
                }}
              />
            )}
          </div>
        ))}
        <button
          type="submit"
          style={{
            padding: "12px 24px",
            backgroundColor: "#007BFF",
            color: "#fff",
            border: "none",
            borderRadius: "4px",
            cursor: "pointer",
            display: "block",
            margin: "0 auto",
          }}
        >
          Submit
        </button>
      </form>
    </div>
  );
};

export default DailyHuddleForm;
