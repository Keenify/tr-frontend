import {
  WeeklyMeetingQuestion,
  WeeklyMeetingResponse,
  WeeklyMeetingFormData,
  WeeklyMeetingFormResponse,
  CreateQuestionRequest,
  UpdateQuestionRequest,
  CreateResponseRequest,
  UpdateResponseRequest,
  DateRangeFilter
} from '../types';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

class WeeklyMeetingService {
  private async makeRequest<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${API_BASE_URL}${endpoint}`;
    const response = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return response.json();
  }

  // Question Management
  async createQuestion(data: CreateQuestionRequest): Promise<WeeklyMeetingQuestion> {
    return this.makeRequest<WeeklyMeetingQuestion>('/weekly-meetings/questions/', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async getQuestion(questionId: string): Promise<WeeklyMeetingQuestion> {
    return this.makeRequest<WeeklyMeetingQuestion>(`/weekly-meetings/questions/${questionId}`);
  }

  async getCompanyQuestions(companyId: string, activeOnly: boolean = true): Promise<WeeklyMeetingQuestion[]> {
    const params = new URLSearchParams();
    if (activeOnly) {
      params.append('active_only', 'true');
    }
    return this.makeRequest<WeeklyMeetingQuestion[]>(
      `/weekly-meetings/companies/${companyId}/questions?${params.toString()}`
    );
  }

  async updateQuestion(questionId: string, data: UpdateQuestionRequest): Promise<WeeklyMeetingQuestion> {
    return this.makeRequest<WeeklyMeetingQuestion>(`/weekly-meetings/questions/${questionId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteQuestion(questionId: string): Promise<WeeklyMeetingQuestion> {
    return this.makeRequest<WeeklyMeetingQuestion>(`/weekly-meetings/questions/${questionId}`, {
      method: 'DELETE',
    });
  }

  // Response Management
  async createResponse(data: CreateResponseRequest): Promise<WeeklyMeetingResponse> {
    return this.makeRequest<WeeklyMeetingResponse>('/weekly-meetings/responses/', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async getResponse(responseId: string): Promise<WeeklyMeetingResponse> {
    return this.makeRequest<WeeklyMeetingResponse>(`/weekly-meetings/responses/${responseId}`);
  }

  async getCompanyResponsesForDate(companyId: string, meetingDate: string): Promise<WeeklyMeetingResponse[]> {
    return this.makeRequest<WeeklyMeetingResponse[]>(
      `/weekly-meetings/companies/${companyId}/responses/${meetingDate}`
    );
  }

  async getEmployeeResponses(employeeId: string): Promise<WeeklyMeetingResponse[]> {
    return this.makeRequest<WeeklyMeetingResponse[]>(
      `/weekly-meetings/employees/${employeeId}/responses`
    );
  }

  async getCompanyResponsesByDateRange(companyId: string, dateRange: DateRangeFilter): Promise<WeeklyMeetingResponse[]> {
    const params = new URLSearchParams({
      start_date: dateRange.start_date,
      end_date: dateRange.end_date,
    });
    return this.makeRequest<WeeklyMeetingResponse[]>(
      `/weekly-meetings/companies/${companyId}/responses/date-range?${params.toString()}`
    );
  }

  async updateResponse(responseId: string, data: UpdateResponseRequest): Promise<WeeklyMeetingResponse> {
    return this.makeRequest<WeeklyMeetingResponse>(`/weekly-meetings/responses/${responseId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteResponse(responseId: string): Promise<WeeklyMeetingResponse> {
    return this.makeRequest<WeeklyMeetingResponse>(`/weekly-meetings/responses/${responseId}`, {
      method: 'DELETE',
    });
  }

  // Form Management
  async submitFormResponses(data: WeeklyMeetingFormData): Promise<WeeklyMeetingResponse[]> {
    return this.makeRequest<WeeklyMeetingResponse[]>('/weekly-meetings/submit-form/', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async getMeetingFormData(companyId: string, meetingDate: string): Promise<WeeklyMeetingFormResponse> {
    return this.makeRequest<WeeklyMeetingFormResponse>(
      `/weekly-meetings/companies/${companyId}/meeting-form/${meetingDate}`
    );
  }
}

export const weeklyMeetingService = new WeeklyMeetingService();
