// Simple service for downloading platform data directly

export class PlatformCompilationService {
  private static readonly API_BASE_URL = `${import.meta.env.VITE_BACKEND_API_DOMAIN}/platform-compilation`;

  static async downloadPlatformData(
    platforms: string[],
    startDate: string,
    endDate: string,
    format: 'csv' | 'pdf',
    companyName?: string
  ): Promise<{ blob: Blob; contentType: string; filename?: string }> {
    const params = new URLSearchParams();
    if (companyName) {
      params.append('company_name', companyName);
    }
    params.append('format', format);

    const requestBody = {
      platforms,
      start_date: startDate,
      end_date: endDate
    };

    const url = `${this.API_BASE_URL}/download?${params.toString()}`;
    
    // Debug logging to verify request format
    console.log('API Request Details:');
    console.log('URL:', url);
    console.log('Method: POST');
    console.log('Headers:', { 'Content-Type': 'application/json' });
    console.log('Body:', JSON.stringify(requestBody, null, 2));

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });

    // Debug response
    console.log('Response Status:', response.status);
    console.log('Response Headers:');
    for (const [key, value] of response.headers.entries()) {
      console.log(`  ${key}: ${value}`);
    }

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Error response:', errorText);
      try {
        const error = JSON.parse(errorText);
        throw new Error(error.detail || 'Failed to download platform data');
      } catch {
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }
    }

    // Get content type and filename from response headers
    const contentType = response.headers.get('content-type') || '';
    const contentDisposition = response.headers.get('content-disposition') || '';
    
    console.log('Content-Type:', contentType);
    console.log('Content-Disposition:', contentDisposition);
    
    // Extract filename from content-disposition header if available
    let filename;
    const filenameMatch = contentDisposition.match(/filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/);
    if (filenameMatch) {
      filename = filenameMatch[1].replace(/['"]/g, '');
    }

    const blob = await response.blob();
    console.log('Blob size:', blob.size, 'bytes');
    console.log('Blob type:', blob.type);
    
    return { blob, contentType, filename };
  }


}
