export interface IssueStatementData {
    id: string;
    question: string;
    description: string;
    is_active: boolean;
    company_id: string;
    employee_id: string;
    created_at: string;
    updated_at: string;
}

export interface IssueStatementAnswerData {
    id: string;
    answer: string;
    is_active: boolean;
    issue_statement_id: string;
    employee_id: string;
    created_at: string;
    updated_at: string;
}

export interface IssueStatementWithAnswers extends IssueStatementData {
    answers: IssueStatementAnswerData[];
}

export interface CreateIssueStatementPayload {
    question: string;
    description: string;
    is_active: boolean;
    company_id: string;
    employee_id: string;
}

export interface CreateIssueStatementAnswerPayload {
    answer: string;
    is_active: boolean;
    issue_statement_id: string;
    employee_id: string;
}

export interface UpdateIssueStatementPayload {
    question: string;
    is_active: boolean;
}

export interface PaginationParams {
    skip?: number;
    limit?: number;
} 