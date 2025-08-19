// Simple service for downloading platform data directly

export class PlatformCompilationService {
  private static readonly API_BASE_URL = `${import.meta.env.VITE_BACKEND_API_DOMAIN}/platform-compilation`;

  static async downloadPlatformData(
    platforms: string[],
    startDate: string,
    endDate: string,
    format: 'csv' | 'pdf',
    companyName?: string
  ): Promise<Blob> {
    const params = new URLSearchParams();
    if (companyName) {
      params.append('company_name', companyName);
    }
    params.append('format', format);

    const response = await fetch(`${this.API_BASE_URL}/download?${params.toString()}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        platforms,
        start_date: startDate,
        end_date: endDate
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Failed to download platform data');
    }

    return response.blob();
  }


}
