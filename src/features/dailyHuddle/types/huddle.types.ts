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