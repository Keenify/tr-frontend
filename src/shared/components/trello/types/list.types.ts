export interface UpdateListRequest {
  name?: string;
  position?: number;
}

export interface ListResponse {
  id: string;
  name: string;
  position: number;
  board_id: string;
  created_at: string;
} 