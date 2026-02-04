/**
 * Face Recognition Utility Library
 * Uses face-api.js for client-side face detection and recognition
 * All processing happens in the browser for privacy
 */

import * as faceapi from 'face-api.js';

// Constants
const MODEL_URL = '/models'; // Face-api.js models should be in public/models/
const FACE_DETECTION_OPTIONS = new faceapi.SsdMobilenetv1Options({ 
    minConfidence: 0.5,
    maxResults: 10 // Allow multiple faces for class check-ins
});
const DISTANCE_THRESHOLD = 0.6; // Lower = more strict matching

let modelsLoaded = false;

/**
 * Load face detection and recognition models
 * Must be called before using any face recognition features
 */
export async function loadFaceRecognitionModels(): Promise<void> {
    if (modelsLoaded) return;

    try {
        await Promise.all([
            faceapi.nets.ssdMobilenetv1.loadFromUri(MODEL_URL),
            faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
            faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL),
        ]);
        modelsLoaded = true;
        console.log('✅ Face recognition models loaded successfully');
    } catch (error) {
        console.error('❌ Failed to load face recognition models:', error);
        throw new Error('Failed to load face recognition models. Please check model files.');
    }
}

/**
 * Check if models are loaded
 */
export function areModelsLoaded(): boolean {
    return modelsLoaded;
}

/**
 * Detect a single face in an image/video element and extract facial descriptor
 * @param input - HTMLImageElement, HTMLVideoElement, or HTMLCanvasElement
 * @returns Face descriptor (128-dimension array) or null if no face detected
 */
export async function detectSingleFace(
    input: HTMLImageElement | HTMLVideoElement | HTMLCanvasElement
): Promise<Float32Array | null> {
    if (!modelsLoaded) {
        await loadFaceRecognitionModels();
    }

    try {
        const detection = await faceapi
            .detectSingleFace(input, FACE_DETECTION_OPTIONS)
            .withFaceLandmarks()
            .withFaceDescriptor();

        if (!detection) {
            return null;
        }

        return detection.descriptor;
    } catch (error) {
        console.error('Error detecting face:', error);
        return null;
    }
}

/**
 * Detect multiple faces in an image/video (for class check-ins)
 * @param input - HTMLImageElement, HTMLVideoElement, or HTMLCanvasElement
 * @returns Array of face descriptors with bounding boxes
 */
export async function detectMultipleFaces(
    input: HTMLImageElement | HTMLVideoElement | HTMLCanvasElement
): Promise<Array<{ descriptor: Float32Array; box: faceapi.Box }>> {
    if (!modelsLoaded) {
        await loadFaceRecognitionModels();
    }

    try {
        const detections = await faceapi
            .detectAllFaces(input, FACE_DETECTION_OPTIONS)
            .withFaceLandmarks()
            .withFaceDescriptors();

        return detections.map(detection => ({
            descriptor: detection.descriptor,
            box: detection.detection.box
        }));
    } catch (error) {
        console.error('Error detecting multiple faces:', error);
        return [];
    }
}

/**
 * Compare a face descriptor against stored descriptors
 * @param faceDescriptor - Face descriptor to match
 * @param storedDescriptors - Array of stored face descriptors
 * @returns Match result with confidence score
 */
export function matchFace(
    faceDescriptor: Float32Array,
    storedDescriptors: Float32Array[]
): { matched: boolean; confidence: number; bestMatchIndex: number } {
    if (storedDescriptors.length === 0) {
        return { matched: false, confidence: 0, bestMatchIndex: -1 };
    }

    // Calculate Euclidean distance to all stored descriptors
    const distances = storedDescriptors.map(stored => 
        faceapi.euclideanDistance(faceDescriptor, stored)
    );

    // Find best match (minimum distance)
    const bestMatchIndex = distances.indexOf(Math.min(...distances));
    const bestDistance = distances[bestMatchIndex];

    // Convert distance to confidence percentage (inverse relationship)
    const confidence = Math.max(0, Math.min(100, (1 - bestDistance) * 100));
    const matched = bestDistance < DISTANCE_THRESHOLD;

    return { matched, confidence, bestMatchIndex };
}

/**
 * Enroll multiple face samples for better accuracy
 * Takes 3-5 samples from different angles for robust recognition
 */
export async function enrollMultipleFaceSamples(
    samples: (HTMLImageElement | HTMLVideoElement | HTMLCanvasElement)[]
): Promise<Float32Array[]> {
    const descriptors: Float32Array[] = [];

    for (const sample of samples) {
        const descriptor = await detectSingleFace(sample);
        if (descriptor) {
            descriptors.push(descriptor);
        }
    }

    if (descriptors.length === 0) {
        throw new Error('No faces detected in any sample');
    }

    return descriptors;
}

/**
 * Serialize face descriptors to JSON string for storage
 */
export function serializeFaceDescriptors(descriptors: Float32Array[]): string {
    const serialized = descriptors.map(desc => Array.from(desc));
    return JSON.stringify(serialized);
}

/**
 * Deserialize face descriptors from JSON string
 */
export function deserializeFaceDescriptors(data: string): Float32Array[] {
    try {
        const parsed = JSON.parse(data);
        return parsed.map((arr: number[]) => new Float32Array(arr));
    } catch (error) {
        console.error('Error deserializing face descriptors:', error);
        return [];
    }
}

/**
 * Securely encrypt face data using Web Crypto API (AES-GCM)
 * IMPORTANT: The 'secret' should be a securely managed key, 
 * ideally derived from user password or a secret stored in a secure enclave.
 */
export async function getEncryptionKey(secret: string, salt: string = 'salt'): Promise<CryptoKey> {
    const enc = new TextEncoder();
    const keyMaterial = await window.crypto.subtle.importKey(
        'raw',
        enc.encode(secret),
        { name: 'PBKDF2' },
        false,
        ['deriveKey']
    );
    return window.crypto.subtle.deriveKey(
        {
            name: 'PBKDF2',
            salt: enc.encode(salt),
            iterations: 100000,
            hash: 'SHA-256',
        },
        keyMaterial,
        { name: 'AES-GCM', length: 256 },
        true,
        ['encrypt', 'decrypt']
    );
}

export function arrayBufferToBase64(buffer: ArrayBuffer): string {
    let binary = '';
    const bytes = new Uint8Array(buffer);
    const len = bytes.byteLength;
    for (let i = 0; i < len; i++) {
        binary += String.fromCharCode(bytes[i]);
    }
    return window.btoa(binary);
}

export function base64ToArrayBuffer(base64: string): ArrayBuffer {
    const binary_string = window.atob(base64);
    const len = binary_string.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
        bytes[i] = binary_string.charCodeAt(i);
    }
    return bytes.buffer;
}

export async function encryptFaceData(data: string, secret: string): Promise<string> {
    const key = await getEncryptionKey(secret);
    const iv = window.crypto.getRandomValues(new Uint8Array(12));
    const encodedData = new TextEncoder().encode(data);

    const encryptedData = await window.crypto.subtle.encrypt(
        {
            name: 'AES-GCM',
            iv: iv,
        },
        key,
        encodedData
    );

    const encryptedPackage = {
        iv: arrayBufferToBase64(iv.buffer),
        data: arrayBufferToBase64(encryptedData)
    };
    
    return JSON.stringify(encryptedPackage);
}


/**
 * Securely decrypt face data using Web Crypto API (AES-GCM)
 */
export async function decryptFaceData(encryptedPackageJSON: string, secret: string): Promise<string> {
    try {
        const key = await getEncryptionKey(secret);
        const encryptedPackage = JSON.parse(encryptedPackageJSON);
        const iv = base64ToArrayBuffer(encryptedPackage.iv);
        const encryptedData = base64ToArrayBuffer(encryptedPackage.data);

        const decryptedData = await window.crypto.subtle.decrypt(
            {
                name: 'AES-GCM',
                iv: iv,
            },
            key,
            encryptedData
        );

        return new TextDecoder().decode(decryptedData);
    } catch (error) {
        console.error('Error decrypting face data:', error);
        return '';
    }
}

/**
 * Draw face detection boxes on canvas (for debugging/visualization)
 */
export function drawFaceDetections(
    canvas: HTMLCanvasElement,
    detections: Array<{ box: faceapi.Box; label?: string }>
): void {
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    detections.forEach(({ box, label }) => {
        // Draw bounding box
        ctx.strokeStyle = '#00ffff';
        ctx.lineWidth = 2;
        ctx.strokeRect(box.x, box.y, box.width, box.height);

        // Draw label if provided
        if (label) {
            ctx.fillStyle = '#00ffff';
            ctx.font = '16px Arial';
            ctx.fillText(label, box.x, box.y - 5);
        }
    });
}

/**
 * Validate face quality before enrollment
 * Checks for proper lighting, face size, and clarity
 */
export async function validateFaceQuality(
    input: HTMLImageElement | HTMLVideoElement | HTMLCanvasElement
): Promise<{ valid: boolean; message: string }> {
    const detection = await faceapi
        .detectSingleFace(input, FACE_DETECTION_OPTIONS)
        .withFaceLandmarks();

    if (!detection) {
        return { valid: false, message: 'No face detected. Please position your face in the camera.' };
    }

    const { width, height } = detection.detection.box;
    const imageWidth = input instanceof HTMLVideoElement ? input.videoWidth : input.width;
    const imageHeight = input instanceof HTMLVideoElement ? input.videoHeight : input.height;

    // Face should be at least 20% of image size
    const faceArea = width * height;
    const imageArea = imageWidth * imageHeight;
    const faceRatio = faceArea / imageArea;

    if (faceRatio < 0.1) {
        return { valid: false, message: 'Face too small. Please move closer to the camera.' };
    }

    if (faceRatio > 0.8) {
        return { valid: false, message: 'Face too close. Please move back a bit.' };
    }

    // Check confidence score
    if (detection.detection.score < 0.7) {
        return { valid: false, message: 'Face not clear enough. Please ensure good lighting.' };
    }

    return { valid: true, message: 'Face quality is good!' };
}
