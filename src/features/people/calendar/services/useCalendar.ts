/**
 * Calendar Service Module
 * 
 * This module provides a comprehensive set of functions for managing calendar events
 * in a company context. It includes functionality for creating, reading, updating,
 * and deleting calendar events, as well as fetching events within specific date ranges.
 * 
 * @module CalendarService
 */

import { 
    CalendarEvent, 
    CreateCalendarEventPayload, 
    UpdateCalendarEventPayload, 
    Participant 
} from '../types/calendar';

const API_DOMAIN = import.meta.env.VITE_BACKEND_API_DOMAIN;

// Use CalendarEvent type from imported types
export type CalendarEventData = CalendarEvent;

// Re-export the imported types for convenience
export type { 
    CreateCalendarEventPayload, 
    UpdateCalendarEventPayload, 
    Participant 
};

/**
 * Creates a new calendar event
 * @param {string} companyId - The ID of the company
 * @param {string} createdBy - The ID of the user creating the event
 * @param {CreateCalendarEventPayload} payload - The calendar event data to create
 * @returns {Promise<CalendarEventData>} - A promise that resolves to the created calendar event data
 */
export async function createCalendarEvent(
    companyId: string,
    createdBy: string,
    payload: CreateCalendarEventPayload
): Promise<CalendarEventData> {
    const endpoint = `${API_DOMAIN}/calendar?company_id=${encodeURIComponent(companyId)}&created_by=${encodeURIComponent(createdBy)}`;

    const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
    });
    console.log('Response:', JSON.stringify(payload));
    const data = await response.json();

    if (!response.ok) {
        console.error('❌ API request failed:', {
            status: response.status,
            statusText: response.statusText,
            data
        });
        throw new Error('Failed to create calendar event');
    }

    return data as CalendarEventData;
}

/**
 * Fetches calendar events for a specific company within a date range
 * @param {string} companyId - The ID of the company
 * @param {string} [fromTime] - Start time filter (ISO string)
 * @param {string} [toTime] - End time filter (ISO string)
 * @returns {Promise<CalendarEventData[]>} - A promise that resolves to an array of calendar events
 * @throws {Error} If company ID is missing or API request fails
 */
export async function getCompanyCalendarEvents(
    companyId: string,
    fromTime?: string,
    toTime?: string
): Promise<CalendarEventData[]> {
    if (!companyId) {
        throw new Error('Company ID is required');
    }

    let endpoint = `${API_DOMAIN}/calendar/company/${encodeURIComponent(companyId)}`;
    
    // Ensure we're getting a full month/year range of data
    const params = new URLSearchParams();
    if (fromTime) {
        // Start from beginning of month
        const startDate = new Date(fromTime);
        startDate.setDate(1);
        startDate.setHours(0, 0, 0, 0);
        params.append('from_time', startDate.toISOString());
    }
    if (toTime) {
        // End at last day of month
        const endDate = new Date(toTime);
        endDate.setMonth(endDate.getMonth() + 1, 0);
        endDate.setHours(23, 59, 59, 999);
        params.append('to_time', endDate.toISOString());
    }
    
    const queryString = params.toString();
    if (queryString) {
        endpoint += `?${queryString}`;
    }

    console.log('Fetching events from:', endpoint);

    try {
        const response = await fetch(endpoint, {
            method: 'GET',
            headers: {
                'Accept': 'application/json',
            },
            credentials: 'include',
        });

        if (!response.ok) {
            const errorData = await response.json();
            console.error('❌ API request failed:', {
                status: response.status,
                statusText: response.statusText,
                errorData
            });
            throw new Error(errorData.message || 'Failed to fetch company calendar events');
        }

        const data = await response.json();
        return data as CalendarEventData[];
    } catch (error) {
        console.error('Calendar fetch error:', error);
        throw error;
    }
}

/**
 * Fetches a specific calendar event by ID
 * @param {string} eventId - The ID of the calendar event
 * @param {string} companyId - The ID of the company
 * @returns {Promise<CalendarEventData>} - A promise that resolves to the calendar event data
 */
export async function getCalendarEvent(
    eventId: string,
    companyId: string
): Promise<CalendarEventData> {
    const endpoint = `${API_DOMAIN}/calendar/${encodeURIComponent(eventId)}?company_id=${encodeURIComponent(companyId)}`;

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
        throw new Error('Failed to fetch calendar event');
    }

    return data as CalendarEventData;
}

/**
 * Updates an existing calendar event
 * @param {string} eventId - The ID of the calendar event to update
 * @param {string} companyId - The ID of the company
 * @param {UpdateCalendarEventPayload} payload - The calendar event data to update (all fields optional)
 * @returns {Promise<CalendarEventData>} - A promise that resolves to the updated calendar event data
 */
export async function updateCalendarEvent(
    eventId: string,
    companyId: string,
    payload: UpdateCalendarEventPayload
): Promise<CalendarEventData> {
    const endpoint = `${API_DOMAIN}/calendar/${encodeURIComponent(eventId)}?company_id=${encodeURIComponent(companyId)}`;

    const response = await fetch(endpoint, {
        method: 'PUT',
        headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
    });

    const data = await response.json();

    if (!response.ok) {
        console.error('❌ API request failed:', {
            status: response.status,
            statusText: response.statusText,
            data
        });
        throw new Error('Failed to update calendar event');
    }

    return data as CalendarEventData;
}

/**
 * Deletes a calendar event
 * @param {string} eventId - The ID of the calendar event to delete
 * @param {string} companyId - The ID of the company
 * @returns {Promise<{ message: string }>} - A promise that resolves to a success message
 * @throws {Error} - If the event is not found or deletion fails
 */
export async function deleteCalendarEvent(
    eventId: string,
    companyId: string
): Promise<{ message: string }> {
    const endpoint = `${API_DOMAIN}/calendar/${encodeURIComponent(eventId)}?company_id=${encodeURIComponent(companyId)}`;

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
        if (response.status === 404) {
            throw new Error('Calendar event not found');
        }
        throw new Error('Failed to delete calendar event');
    }

    return data as { message: string };
} 