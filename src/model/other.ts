import { Publication } from "./publication";

export interface UserProfile {
    id: string;
    username: string;
    avatar_url: string | null;
    publications: Publication[];
}

export interface DatabaseUserProfile {
    id: string;
    username: string;
    avatar_url: string | null;
}

export interface OtherUsersPublicationsProps {
    title?: string;
    description?: string;
    maxUsers?: number;
    maxPublicationsPerUser?: number;
    showUserInfo?: boolean;
    className?: string;
}