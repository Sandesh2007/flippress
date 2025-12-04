export interface Publication {
    id: string;
    user_id: string;
    title: string;
    thumb_url: string | null;
    created_at: string;
    pdf_url: string;
}