import { CoreValueData } from './coreValue';

/**
 * Interface for the employee core score data
 */
export interface CoreScoreData {
  /** Unique identifier for the core score */
  id: string;
  
  /** The score value (typically 0-5) */
  score: number;
  
  /** The ID of the employee */
  employee_id: string;
  
  /** The ID of the core value being scored */
  core_value_id: string;
  
  /** Timestamp when the score was last updated */
  last_updated: string;
}

/**
 * Interface for the employee core score with core value details
 */
export interface CoreScoreWithDetailsData extends CoreScoreData {
  /** Core value details */
  core_value: CoreValueData;
  
  /** Name of the core value (for convenience) */
  core_value_name: string;
}

/**
 * Payload for creating a new core score
 */
export interface CreateCoreScorePayload {
  /** The score value (typically 0-5) */
  score: number;
  
  /** The ID of the employee */
  employee_id: string;
  
  /** The ID of the core value being scored */
  core_value_id: string;
}

/**
 * Payload for updating an existing core score
 */
export interface UpdateCoreScorePayload {
  /** The new score value */
  score: number;
} 