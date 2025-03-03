// Define this at the top of your huddleService.tsx or in a separate types file
export interface Question {
    question_text: string;
    question_type: string;
    is_required: boolean;
    id: string;
    created_at: string;
    updated_at: string;
}

export interface AnswerData {
    answer_text: string;
    question_id: string;
}

export interface SubmitResponseData {
    response_data: {
        employee_id: string;
        questionnaire_id: string;
    };
    answers_data: AnswerData[];
}

export interface SubmitResponseResult {
    status: string;
    response_id: string;
}

export interface ResponseData {
    response_id: string;
    submitted_date: string;
    submitted_at: string;
    questions: Array<{
        question_id: string;
        question_text?: string;
        answer_text: string;
    }>;
}

export interface QuestionResponse {
  question_id: string;
  question_text: string;
  answer_text: string;
}

export interface UpdateAnswerData {
  answer_text: string;
  question_id: string;
}

export interface UpdateResponseResult {
  status: string;
  response_id: string;
}