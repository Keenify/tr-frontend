/**
 * Represents a company core value
 */
export interface CoreValueData {
    /** The name of the core value */
    name: string;
    
    /** The description of the core value */
    description: string;
    
    /** The unique identifier of the core value */
    id: string;
    
    /** The ID of the company this core value belongs to */
    company_id: string;
    
    /** The timestamp when this core value was created */
    created_at: string;
}

/**
 * Payload for creating a new core value
 */
export interface CreateCoreValuePayload {
    /** The name of the core value */
    name: string;
    
    /** The description of the core value */
    description: string;
    
    /** The ID of the company this core value belongs to */
    company_id: string;
}

/**
 * Payload for updating an existing core value
 * All fields are optional to allow partial updates
 */
export interface UpdateCoreValuePayload {
    /** The updated name of the core value (optional) */
    name?: string;
    
    /** The updated description of the core value (optional) */
    description?: string;
} 