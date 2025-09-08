import {
  WeeklyMeetingQuestion,
  WeeklyMeetingResponse,
  WeeklyMeetingFormData,
  CreateQuestionRequest,
  UpdateQuestionRequest,
  CreateResponseRequest,
  UpdateResponseRequest
} from '../types';

const API_BASE_URL = import.meta.env.VITE_BACKEND_API_DOMAIN || 'http://localhost:8000';

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

  async getCompanyQuestions(companyId: string): Promise<WeeklyMeetingQuestion[]> {
    return this.makeRequest<WeeklyMeetingQuestion[]>(
      `/weekly-meetings/companies/${companyId}/questions`
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

  async upsertCompanyQuestion(companyId: string, data: CreateQuestionRequest): Promise<WeeklyMeetingQuestion> {
    return this.makeRequest<WeeklyMeetingQuestion>(`/weekly-meetings/companies/${companyId}/questions/upsert`, {
      method: 'POST',
      body: JSON.stringify(data),
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

}

export const weeklyMeetingService = new WeeklyMeetingService();
