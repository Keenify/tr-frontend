import React, { useEffect, useState } from "react";
import { fetchQuestions, submitResponse } from "../services/huddleService";
import { hasSubmittedResponseToday } from "../services/huddleService";
import { getUserData } from "../../../services/userService";
import { Question } from "../types/huddle.types";
import { Session } from "@supabase/supabase-js";
import { FORM_ID } from "../constants";
import { ClipLoader } from "react-spinners";

interface DailyHuddleFormProps {
  session: Session;
}

const DailyHuddleForm: React.FC<DailyHuddleFormProps> = ({ session }) => {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [hasSubmitted, setHasSubmitted] = useState<boolean>(false);
  const [answers, setAnswers] = useState<{ [key: string]: string }>({});
  const [employeeId, setEmployeeId] = useState<string | null>(null);

  useEffect(() => {
    const initializeForm = async () => {
      setLoading(true);
      try {
        const userData = await getUserData(session.user.id);
        setEmployeeId(userData.id);

        const fetchedQuestions = await fetchQuestions();
        setQuestions(fetchedQuestions);

        if (userData.id) {
          const submitted = await hasSubmittedResponseToday(userData.id);
          setHasSubmitted(submitted);
        }
      } catch (error) {
        console.error("Initialization failed:", error);
      } finally {
        setLoading(false);
      }
    };

    initializeForm();
  }, [session.user.id]);

  const handleInputChange = (questionId: string, answerText: string) => {
    setAnswers((prevAnswers) => ({
      ...prevAnswers,
      [questionId]: answerText,
    }));
  };

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
      await submitResponse(responseData);
      setHasSubmitted(true);
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

  if (hasSubmitted) {
    return <div>You have already submitted your response for today.</div>;
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
        Daily Huddle Questionnaire
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
