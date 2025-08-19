import { supabase } from '../../../../lib/supabase';

export interface PlatformCompilationRequest {
  platforms: string[];
  start_date?: string;
  end_date?: string;
}

export interface PlatformCompilationResponse {
  request_id: string;
  status: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED';
  message: string;
  estimated_completion_time: number;
}

export interface PlatformCompilationStatus {
  request_id: string;
  status: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED';
  platforms: string[];
  start_date: string;
  end_date: string;
  file_path?: string;
  error_message?: string;
  created_at: string;
  updated_at: string;
}

export class PlatformCompilationService {
  private static readonly API_BASE_URL = `${import.meta.env.VITE_BACKEND_API_DOMAIN}/platform-compilation`;

  static async createCompilationRequest(
    request: PlatformCompilationRequest,
    companyName?: string
  ): Promise<PlatformCompilationResponse> {
    const params = new URLSearchParams();
    if (companyName) {
      params.append('company_name', companyName);
    }

    const response = await fetch(`${this.API_BASE_URL}/compile?${params.toString()}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Failed to create compilation request');
    }

    return response.json();
  }

  static async getCompilationStatus(requestId: string): Promise<PlatformCompilationStatus> {
    const response = await fetch(`${this.API_BASE_URL}/compile/${requestId}/status`);

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Failed to get compilation status');
    }

    return response.json();
  }

  static async downloadCompilation(requestId: string): Promise<Blob> {
    const response = await fetch(`${this.API_BASE_URL}/compile/${requestId}/download`);

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Failed to download compilation');
    }

    return response.blob();
  }

  static async getAvailablePlatforms(): Promise<string[]> {
    const response = await fetch(`${this.API_BASE_URL}/platforms/available`);

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Failed to get available platforms');
    }

    return response.json();
  }

  static async getPlatformsWithData(companyName?: string): Promise<{
    company_name: string;
    company_id: string;
    platforms_with_data: string[];
    platforms_without_data: string[];
    platform_details: Record<string, boolean>;
  }> {
    const params = new URLSearchParams();
    if (companyName) {
      params.append('company_name', companyName);
    }

    const response = await fetch(`${this.API_BASE_URL}/platforms/with-data?${params.toString()}`);

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Failed to get platforms with data');
    }

    return response.json();
  }

  static async getPlatformDateRange(
    platform: string,
    companyName?: string
  ): Promise<{
    platform: string;
    earliest_date: string | null;
    latest_date: string | null;
  }> {
    const params = new URLSearchParams();
    if (companyName) {
      params.append('company_name', companyName);
    }

    const response = await fetch(
      `${this.API_BASE_URL}/platforms/${platform}/date-range?${params.toString()}`
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Failed to get platform date range');
    }

    return response.json();
  }

  static async listCompilationRequests(companyName?: string): Promise<PlatformCompilationStatus[]> {
    const params = new URLSearchParams();
    if (companyName) {
      params.append('company_name', companyName);
    }

    const response = await fetch(`${this.API_BASE_URL}/compile?${params.toString()}`);

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Failed to list compilation requests');
    }

    return response.json();
  }

  static async cancelCompilation(requestId: string): Promise<{ message: string }> {
    const response = await fetch(`${this.API_BASE_URL}/compile/${requestId}`, {
      method: 'DELETE',
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Failed to cancel compilation');
    }

    return response.json();
  }

  static async listCompanies(): Promise<Array<{
    id: string;
    name: string;
    created_at: string | null;
    completed_sign_up_sequence: boolean;
  }>> {
    const response = await fetch(`${this.API_BASE_URL}/companies`);

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Failed to list companies');
    }

    return response.json();
  }
}
