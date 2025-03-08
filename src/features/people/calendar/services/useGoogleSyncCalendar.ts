const API_DOMAIN = import.meta.env.VITE_BACKEND_API_DOMAIN;

/**
 * Interface for Google Calendar sync record
 */
export interface GoogleCalendarSyncRecord {
    id: string;
    calendar_event_id: string;
    employee_id: string;
    google_event_id: string;
    google_calendar_id: string;
    last_synced_at: string;
    created_at: string;
    updated_at: string;
}

/**
 * Interface for sync status response
 */
export interface SyncStatusResponse {
    is_synced: boolean;
    sync_id?: string;
    google_event_id?: string;
    google_calendar_id?: string;
    last_synced_at?: string;
    message?: string;
}

/**
 * Interface for sync all events response
 */
export interface SyncAllEventsResponse {
    success: boolean;
    message: string;
    synced_events: number;
    failed_events: number;
}

/**
 * Interface for sync records response
 */
export interface SyncRecordsResponse {
    total: number;
    skip: number;
    limit: number;
    records: GoogleCalendarSyncRecord[];
}

/**
 * Syncs a single calendar event to Google Calendar
 * @param {string} eventId - The ID of the calendar event to sync
 * @param {string} employeeId - The ID of the employee
 * @param {string} companyId - The ID of the company
 * @returns {Promise<GoogleCalendarSyncRecord>} - A promise that resolves to the sync record
 */
export async function syncCalendarEvent(
    eventId: string,
    employeeId: string,
    companyId: string
): Promise<GoogleCalendarSyncRecord> {
    const endpoint = `${API_DOMAIN}/google-event-sync/events/${encodeURIComponent(eventId)}/sync?employee_id=${encodeURIComponent(employeeId)}&company_id=${encodeURIComponent(companyId)}`;

    const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
            'Accept': 'application/json',
        },
    });

    const data = await response.json();

    if (!response.ok) {
        console.error('❌ API request failed:', {
            status: response.status,
            statusText: response.statusText,
            data
        });
        throw new Error('Failed to sync calendar event to Google Calendar');
    }

    return data as GoogleCalendarSyncRecord;
}

/**
 * Updates a synced calendar event in Google Calendar
 * @param {string} eventId - The ID of the calendar event to update
 * @param {string} employeeId - The ID of the employee
 * @param {string} companyId - The ID of the company
 * @returns {Promise<GoogleCalendarSyncRecord>} - A promise that resolves to the updated sync record
 */
export async function updateSyncedCalendarEvent(
    eventId: string,
    employeeId: string,
    companyId: string
): Promise<GoogleCalendarSyncRecord> {
    const endpoint = `${API_DOMAIN}/google-event-sync/events/${encodeURIComponent(eventId)}/sync?employee_id=${encodeURIComponent(employeeId)}&company_id=${encodeURIComponent(companyId)}`;

    const response = await fetch(endpoint, {
        method: 'PUT',
        headers: {
            'Accept': 'application/json',
        },
    });

    const data = await response.json();

    if (!response.ok) {
        console.error('❌ API request failed:', {
            status: response.status,
            statusText: response.statusText,
            data
        });
        throw new Error('Failed to update synced calendar event in Google Calendar');
    }

    return data as GoogleCalendarSyncRecord;
}

/**
 * Deletes a synced calendar event from Google Calendar
 * @param {string} eventId - The ID of the calendar event to delete
 * @param {string} employeeId - The ID of the employee
 * @param {string} companyId - The ID of the company
 * @returns {Promise<{success: boolean}>} - A promise that resolves to a success indicator
 */
export async function deleteSyncedCalendarEvent(
    eventId: string,
    employeeId: string,
    companyId: string
): Promise<{success: boolean}> {
    const endpoint = `${API_DOMAIN}/google-event-sync/events/${encodeURIComponent(eventId)}/sync?employee_id=${encodeURIComponent(employeeId)}&company_id=${encodeURIComponent(companyId)}`;

    const response = await fetch(endpoint, {
        method: 'DELETE',
        headers: {
            'Accept': 'application/json',
        },
    });

    const data = await response.json();

    if (!response.ok) {
        console.error('❌ API request failed:', {
            status: response.status,
            statusText: response.statusText,
            data
        });
        throw new Error('Failed to delete synced calendar event from Google Calendar');
    }

    return data as {success: boolean};
}

/**
 * Checks if a calendar event is synced to Google Calendar
 * @param {string} eventId - The ID of the calendar event to check
 * @param {string} employeeId - The ID of the employee
 * @returns {Promise<SyncStatusResponse>} - A promise that resolves to the sync status
 */
export async function checkEventSyncStatus(
    eventId: string,
    employeeId: string
): Promise<SyncStatusResponse> {
    const endpoint = `${API_DOMAIN}/google-event-sync/sync/status?event_id=${encodeURIComponent(eventId)}&employee_id=${encodeURIComponent(employeeId)}`;

    const response = await fetch(endpoint, {
        method: 'GET',
        headers: {
            'Accept': 'application/json',
        },
    });

    const data = await response.json();

    if (!response.ok) {
        console.error('❌ API request failed:', {
            status: response.status,
            statusText: response.statusText,
            data
        });
        throw new Error('Failed to check event sync status');
    }

    return data as SyncStatusResponse;
}

/**
 * Syncs all calendar events to Google Calendar
 * @param {string} employeeId - The ID of the employee
 * @param {string} companyId - The ID of the company
 * @returns {Promise<SyncAllEventsResponse>} - A promise that resolves to the sync all response
 */
export async function syncAllCalendarEvents(
    employeeId: string,
    companyId: string
): Promise<SyncAllEventsResponse> {
    const endpoint = `${API_DOMAIN}/google-event-sync/sync/all?employee_id=${encodeURIComponent(employeeId)}&company_id=${encodeURIComponent(companyId)}`;

    const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
            'Accept': 'application/json',
        },
    });

    const data = await response.json();

    if (!response.ok) {
        console.error('❌ API request failed:', {
            status: response.status,
            statusText: response.statusText,
            data
        });
        throw new Error('Failed to sync all calendar events to Google Calendar');
    }

    return data as SyncAllEventsResponse;
}

/**
 * Gets all sync records for an employee
 * @param {string} employeeId - The ID of the employee
 * @param {number} skip - Number of records to skip (for pagination)
 * @param {number} limit - Maximum number of records to return
 * @returns {Promise<SyncRecordsResponse>} - A promise that resolves to the sync records response
 */
export async function getEmployeeSyncRecords(
    employeeId: string,
    skip: number = 0,
    limit: number = 100
): Promise<SyncRecordsResponse> {
    const endpoint = `${API_DOMAIN}/google-event-sync/sync/records?employee_id=${encodeURIComponent(employeeId)}&skip=${skip}&limit=${limit}`;

    const response = await fetch(endpoint, {
        method: 'GET',
        headers: {
            'Accept': 'application/json',
        },
    });

    const data = await response.json();

    if (!response.ok) {
        console.error('❌ API request failed:', {
            status: response.status,
            statusText: response.statusText,
            data
        });
        throw new Error('Failed to get employee sync records');
    }

    return data as SyncRecordsResponse;
}
