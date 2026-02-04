/**
 * DeepFace API Service
 * Communicates with the Python DeepFace backend for high-accuracy face recognition
 */

const DEEPFACE_API_URL = import.meta.env.VITE_DEEPFACE_API_URL || (typeof window !== 'undefined' ? window.location.origin + '/api' : 'http://localhost:8000');

export interface FaceDetection {
    box: { x: number; y: number; w: number; h: number };
    embedding: number[];
    confidence: number;
}

export interface AnalyzeResponse {
    faces: FaceDetection[];
}

export interface MatchResult {
    matched: boolean;
    name: string;
    distance: number;
    confidence: number;
}

/**
 * Check if DeepFace backend is available
 */
export async function isDeepFaceAvailable(): Promise<boolean> {
    try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000); // Increase timeout to 10 seconds

        const response = await fetch(`${DEEPFACE_API_URL}/`, {
            method: 'GET',
            signal: controller.signal
        });

        clearTimeout(timeoutId);
        return response.ok;
    } catch {
        return false;
    }
}

/**
 * Analyze an image and extract face embeddings for all detected faces
 */
export async function analyzeImage(imageBlob: Blob): Promise<AnalyzeResponse> {
    const formData = new FormData();
    formData.append('file', imageBlob, 'image.jpg');

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout for image processing

    try {
        const response = await fetch(`${DEEPFACE_API_URL}/analyze`, {
            method: 'POST',
            body: formData,
            signal: controller.signal
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
            const errorText = await response.text().catch(() => 'Unknown error');
            throw new Error(`DeepFace analysis failed: ${response.status} - ${errorText}`);
        }

        return response.json();
    } catch (error) {
        clearTimeout(timeoutId);
        if (error instanceof TypeError && error.message.includes('fetch')) {
            throw new Error('Connection timeout or network error. Please check your connection and try again.');
        }
        throw error;
    }
}

/**
 * Extract face embedding from an image (expects single face)
 * Returns the embedding array for storage
 */
export async function extractFaceEmbedding(imageBlob: Blob): Promise<number[] | null> {
    try {
        const result = await analyzeImage(imageBlob);
        
        if (result.faces.length === 0) {
            return null;
        }

        // Return the first face's embedding
        return result.faces[0].embedding;
    } catch (error) {
        console.error('Failed to extract face embedding:', error);
        throw error;
    }
}

/**
 * Calculate cosine distance between two embeddings
 * Lower distance = more similar faces
 */
export function getCosineDistance(a: number[], b: number[]): number {
    if (!a || !b || a.length !== b.length) return 1;
    
    let dotProduct = 0;
    let normA = 0;
    let normB = 0;
    
    for (let i = 0; i < a.length; i++) {
        dotProduct += a[i] * b[i];
        normA += a[i] * a[i];
        normB += b[i] * b[i];
    }
    
    if (normA === 0 || normB === 0) return 1;
    
    const similarity = dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
    return 1 - similarity;
}

/**
 * Match a detected face against a gallery of known faces
 * @param embedding - The detected face embedding
 * @param gallery - Array of { userId, name, embedding } objects
 * @param threshold - Maximum distance to consider a match (default: 0.25)
 */
export function matchFaceAgainstGallery(
    embedding: number[],
    gallery: Array<{ userId: string; name: string; embedding: number[] }>,
    threshold: number = 0.25
): MatchResult {
    if (gallery.length === 0) {
        return { matched: false, name: 'unknown', distance: 1, confidence: 0 };
    }

    let bestMatch = { userId: '', name: '', distance: Infinity };

    for (const person of gallery) {
        const distance = getCosineDistance(embedding, person.embedding);
        if (distance < bestMatch.distance) {
            bestMatch = { userId: person.userId, name: person.name, distance };
        }
    }

    if (bestMatch.distance < threshold) {
        // Convert distance to confidence percentage (0 distance = 100% confidence)
        const confidence = Math.round((1 - bestMatch.distance) * 100);
        return {
            matched: true,
            name: bestMatch.name,
            distance: bestMatch.distance,
            confidence
        };
    }

    return {
        matched: false,
        name: 'unknown',
        distance: bestMatch.distance,
        confidence: 0
    };
}

/**
 * Process a class photo and identify all students
 * @param imageBlob - The class photo
 * @param enrolledStudents - Array of enrolled students with their embeddings
 * @param threshold - Matching threshold
 */
export async function processClassPhoto(
    imageBlob: Blob,
    enrolledStudents: Array<{ userId: string; name: string; embedding: number[] }>,
    threshold: number = 0.25
): Promise<Array<{
    faceIndex: number;
    box: { x: number; y: number; w: number; h: number };
    match: MatchResult;
}>> {
    const result = await analyzeImage(imageBlob);
    
    return result.faces.map((face, index) => ({
        faceIndex: index + 1,
        box: face.box,
        match: matchFaceAgainstGallery(face.embedding, enrolledStudents, threshold)
    }));
}

/**
 * Serialize embedding to JSON string for storage
 */
export function serializeEmbedding(embedding: number[]): string {
    return JSON.stringify(embedding);
}

/**
 * Deserialize embedding from JSON string
 */
export function deserializeEmbedding(data: string): number[] {
    try {
        return JSON.parse(data);
    } catch {
        return [];
    }
}

/**
 * Simple encryption for face data (base64 + reverse)
 * In production, use proper encryption with user-specific keys
 */
export function encryptFaceData(data: string): string {
    const base64 = btoa(unescape(encodeURIComponent(data)));
    return base64.split('').reverse().join('');
}

/**
 * Decrypt face data
 */
export function decryptFaceData(encrypted: string): string {
    const base64 = encrypted.split('').reverse().join('');
    return decodeURIComponent(escape(atob(base64)));
}

/**
 * Convert image URL to Blob for processing
 */
export async function imageUrlToBlob(url: string): Promise<Blob> {
    const response = await fetch(url);
    return response.blob();
}

/**
 * Convert canvas to Blob
 */
export function canvasToBlob(canvas: HTMLCanvasElement, quality: number = 0.95): Promise<Blob> {
    return new Promise((resolve, reject) => {
        canvas.toBlob(
            (blob) => {
                if (blob) {
                    resolve(blob);
                } else {
                    reject(new Error('Failed to convert canvas to blob'));
                }
            },
            'image/jpeg',
            quality
        );
    });
}

/**
 * Convert File to Blob (for file inputs)
 */
export function fileToBlob(file: File): Promise<Blob> {
    return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onload = () => {
            const blob = new Blob([reader.result as ArrayBuffer], { type: file.type });
            resolve(blob);
        };
        reader.readAsArrayBuffer(file);
    });
}
