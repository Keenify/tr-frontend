export interface Card {
    id: string;
    title: string;
    list_id: string;
    color_code: string;
    description: string;
    position: number;
    due_date: string | null;
    created_at: string;
    thumbnail_url?: string;
}

export interface List {
    id: string;
    name: string;
    title: string;
    position: number;
    board_id: string;
    cards: Card[];
    created_at?: string;
}

export type BoardDetails = List[]; 