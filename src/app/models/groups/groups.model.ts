export interface GroupData {
    id: number;
    name: string;
    category: string;
    level: string;
    authorId: number;
    members: number[];
    ticketCount: number;
    createdAt?: string;
}

export interface CreateGroupDto {
    name: string;
    category: string;
    level: string;
    authorId: number;
}

export interface UpdateGroupDto {
    name?: string;
    category?: string;
    level?: string;
}

export interface AddMemberDto {
    email: string;
}

export interface GroupResponseDto {
    id: number;
    name: string;
    category: string;
    level: string;
    authorId: number;
    createdAt: string;
    members: number[];
    ticketCount: number;
}