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
    name: string;
    position: number;
    board_id: string;
    id: string;
    created_at: string;
    cards: Card[];
}

export type BoardDetails = List[]; 