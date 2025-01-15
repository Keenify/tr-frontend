export interface Document {
    id: string;
    title: string;
    position: number;
    type?: string;
    isUploadedFile?: boolean;
    document_id?: string;
    file_path?: string;
    file_type?: string;
  }