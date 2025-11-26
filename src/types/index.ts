export interface Training {
    id: number;
    date: string;
    duration: string;
    technique: string;
    notes: string;
    academy?: string;
    type?: string;
}

export interface CheckIn {
    date: string;
    timestamp: number;
}

export interface Template {
    id: string;
    name: string;
    data: Omit<Training, 'id' | 'date'>;
}

export interface Profile {
    id: string;
    name: string;
    belt: string;
    degrees: number;
    academies: string[];
    mainAcademy?: string;
    avatar_url?: string;
    language: string;
}
