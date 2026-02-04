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
    role: 'student' | 'professor' | 'owner';
    face_recognition_enabled?: boolean;
    face_data?: string; // Encrypted face embeddings
    face_enrollment_date?: string;
    face_last_updated?: string;
}

export interface Academy {
    id: string;
    name: string;
    owner_id: string;
    join_code: string;
    created_at: string;
}

export interface AcademyMember {
    id: string;
    academy_id: string;
    user_id: string;
    status: 'pending' | 'active';
    created_at: string;
}

export interface CheckInRecord {
    id: string;
    user_id: string;
    academy_id?: string;
    check_in_date: string;
    check_in_time: string;
    method: 'manual' | 'face_recognition' | 'qr_code';
    confidence_score?: number;
    created_at: string;
}

export interface FaceDescriptor {
    descriptor: Float32Array;
    timestamp: number;
}

export interface FaceRecognitionConsent {
    accepted: boolean;
    accepted_at: string;
    ip_address?: string;
    user_agent?: string;
}
