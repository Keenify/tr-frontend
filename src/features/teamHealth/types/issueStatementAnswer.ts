export interface IssueStatementAnswerData {
    id: string;
    answer: string;
    is_active: boolean;
    issue_statement_id: string;
    employee_id: string;
    created_at: string;
    updated_at: string;
}

export interface CreateIssueStatementAnswerPayload {
    answer: string;
    is_active: boolean;
    issue_statement_id: string;
    employee_id: string;
}

export interface UpdateIssueStatementAnswerPayload {
    answer: string;
    is_active: boolean;
}

export interface PaginationParams {
    skip?: number;
    limit?: number;
} 