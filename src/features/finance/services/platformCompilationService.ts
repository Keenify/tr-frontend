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
      const errorText = await response.text();
      console.error('Error response:', errorText);
      try {
        const error = JSON.parse(errorText);
        throw new Error(error.detail || error.message || 'Failed to download platform data');
      } catch {
        throw new Error(`HTTP ${response.status}: ${errorText || response.statusText}`);
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
    
    // Validate that we actually received data
    if (blob.size === 0) {
      throw new Error('Received empty file. No data available for the selected date range and platforms.');
    }
    
    // Additional validation for content type
    const expectedContentTypes = {
      csv: ['text/csv', 'application/csv', 'text/plain'],
      pdf: ['application/pdf']
    };
    
    const isValidContentType = expectedContentTypes[format].some(type => 
      contentType.toLowerCase().includes(type.toLowerCase())
    );
    
    if (!isValidContentType) {
      console.warn(`Unexpected content type: ${contentType} for format: ${format}`);
      // Don't throw error, just log warning as some servers might return different content types
    }
    
    return { blob, contentType, filename };
  }


}
