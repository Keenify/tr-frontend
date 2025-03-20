/**
 * Type definitions for Quarterly KPI module
 */

/**
 * Represents the payload required to create a new KPI
 */
export interface CreateKPIPayload {
    category: string;
    kpi_name: string;
    ideal_state: string;
    company_id: string;
    employee_id?: string; // Optional person in charge
}

/**
 * Represents a tracking record for a KPI
 */
export interface KPITrackingRecord {
    id: string;
    kpi_id: string;
    quarter: string;
    year: number;
    status: string;
    notes?: string;
    created_at?: string;
    updated_at?: string;
    employee_id?: string;
}

/**
 * Represents a KPI as stored in the system
 */
export interface KPIData {
    id: string;
    category: string;
    kpi_name: string;
    ideal_state: string;
    company_id: string;
    created_at: string;
    employee_id?: string; // Optional person in charge
    tracking_records?: KPITrackingRecord[]; // Optional tracking records that may be included in responses
}

/**
 * Represents the payload for updating an existing KPI
 * All fields are optional, allowing partial updates
 */
export interface UpdateKPIPayload {
    category?: string;
    kpi_name?: string;
    ideal_state?: string;
    employee_id?: string; // Optional person in charge
}

/**
 * Represents the payload required to create a new KPI tracking record
 */
export interface CreateKPITrackingPayload {
    quarter: string;
    year: number;
    notes?: string;
    kpi_id: string;
    status: string;
    employee_id?: string; // Optional employee ID
}

/**
 * Represents the payload for updating an existing KPI tracking record
 * All fields are optional, allowing partial updates
 */
export interface UpdateKPITrackingPayload {
    quarter?: string;
    year?: number;
    notes?: string;
    employee_id?: string;
} 