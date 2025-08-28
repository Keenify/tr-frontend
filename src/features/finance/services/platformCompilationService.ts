// Enhanced service for downloading consolidated platform data
// Supports combining multiple shop IDs per platform and multiple platforms into single file

export class PlatformCompilationService {
  private static readonly API_BASE_URL = `${import.meta.env.VITE_BACKEND_API_DOMAIN}/data-export`;

  /**
   * Download consolidated platform data with filtered fields and embedded graphs
   * 
   * Features:
   * - Combines all shop IDs from the same platform (e.g., all Shopee shops)
   * - Consolidates multiple platforms into a single file
   * - Filters to only include: date, ads_expense, revenue, total_orders, new_buyer_count, existing_buyer_count
   * - Embeds graphs directly in both CSV and PDF files (no separate folders)
   * - Excludes JSON files and separate graph directories
   * 
   * @param platforms Array of platform names to include
   * @param startDate Start date in YYYY-MM-DD format
   * @param endDate End date in YYYY-MM-DD format  
   * @param format Output format ('csv' or 'pdf')
   * @param companyName Optional company name for filtering
   * @param companyId Optional company ID for filtering
   * @returns Promise with blob data and metadata
   */
  static async downloadPlatformData(
    platforms: string[],
    startDate: string,
    endDate: string,
    format: 'csv' | 'pdf',
    companyName?: string,
    companyId?: string
  ): Promise<{ blob: Blob; contentType: string; filename?: string }> {
    // Validate input parameters
    if (!platforms || platforms.length === 0) {
      throw new Error('At least one platform must be selected');
    }
    
    if (!startDate || !endDate) {
      throw new Error('Start date and end date are required');
    }
    
    if (new Date(startDate) > new Date(endDate)) {
      throw new Error('Start date cannot be after end date');
    }
    
    if (!companyId) {
      throw new Error('Company ID is required for the new API endpoint. Please ensure you are logged in and have access to a company.');
    }

    // Validate that companyId is a valid UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(companyId)) {
      throw new Error(`Invalid Company ID format: ${companyId}. Expected UUID format.`);
    }

    // Build URL for the new endpoint structure
    const url = `${this.API_BASE_URL}/company/${companyId}/online-sales-report`;
    
    // Build query parameters for the new endpoint
    const params = new URLSearchParams();
    params.append('platforms', platforms.join(','));
    params.append('start_date', startDate);
    params.append('end_date', endDate);
    params.append('format_type', format);
    
    // Debug logging for the new endpoint
    console.log('Online Sales Report API Request:');
    console.log('URL:', url);
    console.log('Method: POST');
    console.log('Query Parameters:', params.toString());
    console.log('Platforms:', platforms);
    console.log('Date Range:', `${startDate} to ${endDate}`);
    console.log('Format:', format);

    let response = await fetch(`${url}?${params.toString()}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      // No body needed for this endpoint - all data is in query parameters
    });

    // Debug response
    console.log('Response Status:', response.status);
    console.log('Response Headers:');
    for (const [key, value] of response.headers.entries()) {
      console.log(`  ${key}: ${value}`);
    }
    
    // Log response body for debugging (only for non-binary responses)
    if (response.headers.get('content-type')?.includes('application/json')) {
      const responseText = await response.text();
      console.log('Response Body:', responseText);
      // Recreate response for blob processing
      const newResponse = new Response(responseText, {
        status: response.status,
        statusText: response.statusText,
        headers: response.headers
      });
      response = newResponse;
    }

    if (!response.ok) {
      let errorMessage = `HTTP ${response.status}: ${response.statusText}`;
      try {
        const errorData = await response.json();
        errorMessage = errorData.detail || errorData.message || errorMessage;
      } catch (e) {
        // If JSON parsing fails, use the status text
      }
      throw new Error(errorMessage);
    }

    const blob = await response.blob();
    const contentType = response.headers.get('content-type') || 'application/octet-stream';
    
    // Extract filename from Content-Disposition header if available
    const contentDisposition = response.headers.get('content-disposition');
    let filename: string | undefined;
    if (contentDisposition) {
      const filenameMatch = contentDisposition.match(/filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/);
      if (filenameMatch && filenameMatch[1]) {
        filename = filenameMatch[1].replace(/['"]/g, '');
      }
    }

    return { blob, contentType, filename };
  }

  /**
   * Download multi-platform data in a single file (CSV or PDF)
   * 
   * Features:
   * - Combines all platforms in one file with platform column
   * - Standardized columns across all platforms
   * - Direct file download (no ZIP files)
   * - Better for analysis and reporting
   * 
   * @param platforms Array of platform names to include
   * @param startDate Start date in YYYY-MM-DD format
   * @param endDate End date in YYYY-MM-DD format  
   * @param format Output format ('csv' or 'pdf')
   * @param companyId Company ID (required)
   * @returns Promise with blob data and metadata
   */
  static async downloadMultiPlatformData(
    platforms: string[],
    startDate: string,
    endDate: string,
    format: 'csv' | 'pdf',
    companyId: string
  ): Promise<{ blob: Blob; contentType: string; filename?: string }> {
    // Validate input parameters
    if (!platforms || platforms.length === 0) {
      throw new Error('At least one platform must be selected');
    }
    
    if (!startDate || !endDate) {
      throw new Error('Start date and end date are required');
    }
    
    if (new Date(startDate) > new Date(endDate)) {
      throw new Error('Start date cannot be after end date');
    }
    
    if (!companyId) {
      throw new Error('Company ID is required for multi-platform export.');
    }

    // Validate that companyId is a valid UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(companyId)) {
      throw new Error(`Invalid Company ID format: ${companyId}. Expected UUID format.`);
    }

    // Build URL for the multi-platform endpoint
    const url = `${this.API_BASE_URL}/company/${companyId}/multi-platform-export`;
    
    // Build query parameters
    const params = new URLSearchParams();
    params.append('platforms', platforms.join(','));
    params.append('start_date', startDate);
    params.append('end_date', endDate);
    params.append('format_type', format);
    
    // Debug logging
    console.log('Multi-Platform Export API Request:');
    console.log('URL:', url);
    console.log('Method: POST');
    console.log('Query Parameters:', params.toString());
    console.log('Platforms:', platforms);
    console.log('Date Range:', `${startDate} to ${endDate}`);
    console.log('Format:', format);

    const response = await fetch(`${url}?${params.toString()}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Debug response
    console.log('Response Status:', response.status);
    console.log('Response Headers:');
    for (const [key, value] of response.headers.entries()) {
      console.log(`  ${key}: ${value}`);
    }

    if (!response.ok) {
      let errorMessage = `HTTP ${response.status}: ${response.statusText}`;
      try {
        const errorData = await response.json();
        errorMessage = errorData.detail || errorData.message || errorMessage;
      } catch (e) {
        // If JSON parsing fails, use the status text
      }
      throw new Error(errorMessage);
    }

    const blob = await response.blob();
    const contentType = response.headers.get('content-type') || 'application/octet-stream';
    
    // Extract filename from Content-Disposition header if available
    const contentDisposition = response.headers.get('content-disposition');
    let filename: string | undefined;
    if (contentDisposition) {
      const filenameMatch = contentDisposition.match(/filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/);
      if (filenameMatch && filenameMatch[1]) {
        filename = filenameMatch[1].replace(/['"]/g, '');
      }
    }

    return { blob, contentType, filename };
  }


}
