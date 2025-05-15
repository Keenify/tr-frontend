/**
 * Represents a scoreboard entry in the database
 */
export interface ScoreboardData {
  /** Unique identifier for the scoreboard entry */
  id: string | null;
  /** ID of the employee this score belongs to */
  employee_id: string;
  /** ID of the company this score belongs to */
  company_id: string;
  /** The employee's performance score (pop coins) */
  score: number;
  /** Timestamp when the scoreboard entry was created */
  created_at: string | null;
  /** Timestamp when the scoreboard entry was last updated */
  updated_at: string | null;
}

/**
 * Payload for creating a new scoreboard entry
 */
export interface CreateScoreboardPayload {
  /** ID of the employee this score belongs to */
  employee_id: string;
  /** The employee's performance score (pop coins) */
  score: number;
}

/**
 * Payload for updating an existing scoreboard entry
 */
export interface UpdateScoreboardPayload {
  /** The updated score value (pop coins) */
  score: number;
} 