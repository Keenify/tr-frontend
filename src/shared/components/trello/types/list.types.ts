export interface UpdateListRequest {
  name?: string;
  position?: number;
  country?: string;
}

export interface ListResponse {
  id: string;
  name: string;
  position: number;
  country: string;
  board_id: string;
  created_at: string;
} 