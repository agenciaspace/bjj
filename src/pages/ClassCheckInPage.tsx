import { useState, useRef, useEffect } from 'react';
import { Camera, Users, CheckCircle, XCircle, Loader2, ArrowLeft, Scan, Eye, Upload, Image, Shield } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../contexts/LanguageContext';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import {
    loadFaceRecognitionModels,
    detectMultipleFaces,
    matchFace,
    deserializeFaceDescriptors,
    decryptFaceData,
    areModelsLoaded
} from '../lib/faceRecognition';
import {
    processClassPhoto,
    deserializeEmbedding,
    isDeepFaceAvailable,
    fileToBlob
} from '../lib/deepFaceService';
import type { Profile } from '../types';

interface DetectedStudent {
    profile: Profile;
    confidence: number;
    box: { x: number; y: number; width: number; height: number };
}

interface PhotoDetection {
    faceIndex: number;
    box: { x: number; y: number; w: number; h: number };
    match: { matched: boolean; name: string; distance: number; confidence: number };
    userId?: string;
}

type ScanState = 'idle' | 'loading' | 'scanning' | 'processing' | 'photo_results' | 'complete';

export const ClassCheckInPage = () => {
    const { t } = useLanguage();
    const { user } = useAuth();
    const navigate = useNavigate();
    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const overlayCanvasRef = useRef<HTMLCanvasElement>(null);
    const animationFrameRef = useRef<number | undefined>(undefined);
    
    const [state, setState] = useState<ScanState>('idle');
    const [stream, setStream] = useState<MediaStream | null>(null);
    const [error, setError] = useState<string>('');
    const [enrolledStudents, setEnrolledStudents] = useState<Profile[]>([]);
    const [detectedStudents, setDetectedStudents] = useState<DetectedStudent[]>([]);
    const [checkedInStudents, setCheckedInStudents] = useState<Set<string>>(new Set());
    const [academyId, setAcademyId] = useState<string>('');
const [academySecret, setAcademySecret] = useState('');
    const [deepFaceAvailable, setDeepFaceAvailable] = useState(false);
    const [photoDetections, setPhotoDetections] = useState<PhotoDetection[]>([]);
    const [uploadedImageUrl, setUploadedImageUrl] = useState<string>('');
    const photoInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        fetchEnrolledStudents();
        isDeepFaceAvailable().then(setDeepFaceAvailable);
        return () => cleanup();
    }, []);

    const fetchEnrolledStudents = async () => {
        if (!user) return;

        try {
            // Get user's academies
            const { data: academies } = await supabase
                .from('academies')
                .select('id')
                .eq('owner_id', user.id);

            if (!academies || academies.length === 0) {
                setError('No academy found. Only academy owners can use this feature.');
                return;
            }

            const academy = academies[0];

            setAcademyId(academy.id);

            // Get all active members with facial recognition enabled
            const { data: members } = await supabase
                .from('academy_members')
                .select('profiles(*)')
                .eq('academy_id', academy.id)
                .eq('status', 'active');

            if (members) {
                const enrolled = members
                    .filter((m: any) => m.profiles !== null)
                    .map((m: any) => m.profiles as unknown as Profile)
                    .filter((p: Profile) => 
                        p.face_recognition_enabled === true && 
                        !!p.face_data
                    );
                
                setEnrolledStudents(enrolled);
            }
        } catch (err) {
            console.error('Error fetching students:', err);
            setError('Failed to load enrolled students');
        }
    };

    const startScanning = async () => {
        setState('loading');
        setError('');

        try {
            // Load models
            if (!areModelsLoaded()) {
                await loadFaceRecognitionModels();
            }

            // Start camera
            await startCamera();
            setState('scanning');
            
            // Start detection loop
            startDetectionLoop();
        } catch (err) {
            console.error('Failed to start scanning:', err);
            setError('Failed to start camera');
            setState('idle');
        }
    };

    const startCamera = async () => {
        try {
            const mediaStream = await navigator.mediaDevices.getUserMedia({
                video: {
                    width: { ideal: 1920 },
                    height: { ideal: 1080 },
                    facingMode: 'environment' // Use back camera if available
                }
            });

            if (videoRef.current) {
                videoRef.current.srcObject = mediaStream;
                setStream(mediaStream);
            }
        } catch (err) {
            throw new Error('Camera access denied');
        }
    };

    const stopCamera = () => {
        if (stream) {
            stream.getTracks().forEach(track => track.stop());
            setStream(null);
        }
    };

    const startDetectionLoop = () => {
    if (!academySecret) {
        alert('Please enter the academy secret to start scanning.');
        return;
    }
        const detectAndMatch = async () => {
            if (!videoRef.current || !canvasRef.current || state !== 'scanning') {
                animationFrameRef.current = requestAnimationFrame(detectAndMatch);
                return;
            }

            try {
                // Detect all faces in frame
                const detections = await detectMultipleFaces(videoRef.current);
                
                if (detections.length === 0) {
                    setDetectedStudents([]);
                    drawOverlay([]);
                    animationFrameRef.current = requestAnimationFrame(detectAndMatch);
                    return;
                }

                // Match each detected face against enrolled students
                const matches: DetectedStudent[] = [];
                
                for (const detection of detections) {
                    let bestMatch: { profile: Profile; confidence: number } | null = null;
                    
                    for (const student of enrolledStudents) {
                        if (checkedInStudents.has(student.id)) continue; // Skip already checked in
                        
                        const decrypted = await decryptFaceData(student.face_data!, academySecret);
                        const storedDescriptors = deserializeFaceDescriptors(decrypted);
                        const match = matchFace(detection.descriptor, storedDescriptors);
                        
                        if (match.matched && (!bestMatch || match.confidence > bestMatch.confidence)) {
                            bestMatch = { profile: student, confidence: match.confidence };
                        }
                    }
                    
                    if (bestMatch) {
                        matches.push({
                            profile: bestMatch.profile,
                            confidence: bestMatch.confidence,
                            box: detection.box
                        });
                    }
                }
                
                setDetectedStudents(matches);
                drawOverlay(matches);
                
                animationFrameRef.current = requestAnimationFrame(detectAndMatch);
            } catch (err) {
                console.error('Detection error:', err);
                animationFrameRef.current = requestAnimationFrame(detectAndMatch);
            }
        };

        animationFrameRef.current = requestAnimationFrame(detectAndMatch);
    };

    const drawOverlay = (students: DetectedStudent[]) => {
        const canvas = overlayCanvasRef.current;
        const video = videoRef.current;
        
        if (!canvas || !video) return;
        
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        // Draw bounding boxes and labels
        students.forEach(({ profile, confidence, box }) => {
            // Draw box
            ctx.strokeStyle = '#00ffff';
            ctx.lineWidth = 3;
            ctx.strokeRect(box.x, box.y, box.width, box.height);
            
            // Draw label background
            ctx.fillStyle = 'rgba(0, 255, 255, 0.9)';
            ctx.fillRect(box.x, box.y - 30, box.width, 30);
            
            // Draw name
            ctx.fillStyle = '#000000';
            ctx.font = 'bold 16px Arial';
            ctx.fillText(profile.name, box.x + 5, box.y - 10);
            
            // Draw confidence
            ctx.font = '12px Arial';
            ctx.fillText(`${Math.round(confidence)}%`, box.x + box.width - 40, box.y - 10);
        });
    };

    const performBatchCheckIn = async () => {
        if (detectedStudents.length === 0) return;
        
        setState('processing');
        
        try {
            const today = new Date().toISOString().split('T')[0];
            const checkInTime = new Date().toISOString();
            
            // Create check-in records for all detected students
            const checkInRecords = detectedStudents.map(({ profile, confidence }) => ({
                user_id: profile.id,
                academy_id: academyId,
                check_in_date: today,
                check_in_time: checkInTime,
                method: 'face_recognition',
                confidence_score: Math.round(confidence)
            }));
            
            const { error: insertError } = await supabase
                .from('check_ins')
                .insert(checkInRecords);
            
            if (insertError) throw insertError;
            
            // Update checked-in set
            const newCheckedIn = new Set(checkedInStudents);
            detectedStudents.forEach(({ profile }) => newCheckedIn.add(profile.id));
            setCheckedInStudents(newCheckedIn);
            
            // Clear detected students
            setDetectedStudents([]);
            
            // Vibrate on success
            if (navigator.vibrate) {
                navigator.vibrate([100, 50, 100]);
            }
            
            setState('scanning');
        } catch (err) {
            console.error('Batch check-in error:', err);
            setError('Failed to save check-ins');
            setState('scanning');
        }
    };

    const completeCheckIn = () => {
        cleanup();
        setState('complete');
        
        setTimeout(() => {
            navigate('/profile');
        }, 2000);
    };

    const cleanup = () => {
        if (animationFrameRef.current) {
            cancelAnimationFrame(animationFrameRef.current);
        }
        stopCamera();
    };

    // Photo upload handler for DeepFace
    const handlePhotoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        setState('processing');
        setError('');

        try {
            // Create preview URL
            const imageUrl = URL.createObjectURL(file);
            setUploadedImageUrl(imageUrl);

            // Prepare gallery of enrolled students
            const gallery = await Promise.all(enrolledStudents
                .filter(s => s.face_data)
                .map(async (s) => {
                    const decrypted = await decryptFaceData(s.face_data!, academySecret);
                    const embedding = deserializeEmbedding(decrypted);
                    return {
                        userId: s.id,
                        name: s.name,
                        embedding
                    };
                }));

            // Process photo with DeepFace
            const blob = await fileToBlob(file);
            const results = await processClassPhoto(blob, gallery, 0.25);

            // Add userId to matches
            const detectionsWithIds: PhotoDetection[] = results.map(r => {
                const matchedStudent = gallery.find(g => g.name === r.match.name);
                return {
                    ...r,
                    userId: matchedStudent?.userId
                };
            });

            setPhotoDetections(detectionsWithIds);
            setState('photo_results');
        } catch (err) {
            console.error('Photo processing error:', err);
            setError('Failed to process photo. Make sure DeepFace server is running.');
            setState('idle');
        }
    };

    // Check in from photo results
    const performPhotoCheckIn = async () => {
        const matchedDetections = photoDetections.filter(d => d.match.matched && d.userId);
        if (matchedDetections.length === 0) return;

        setState('processing');

        try {
            const today = new Date().toISOString().split('T')[0];
            const checkInTime = new Date().toISOString();

            const checkInRecords = matchedDetections.map(d => ({
                user_id: d.userId!,
                academy_id: academyId,
                check_in_date: today,
                check_in_time: checkInTime,
                method: 'face_recognition',
                confidence_score: d.match.confidence
            }));

            const { error: insertError } = await supabase
                .from('check_ins')
                .insert(checkInRecords);

            if (insertError) throw insertError;

            // Update checked-in set
            const newCheckedIn = new Set(checkedInStudents);
            matchedDetections.forEach(d => newCheckedIn.add(d.userId!));
            setCheckedInStudents(newCheckedIn);

            if (navigator.vibrate) {
                navigator.vibrate([100, 50, 100]);
            }

            setState('complete');
        } catch (err) {
            console.error('Photo check-in error:', err);
            setError('Failed to save check-ins');
            setState('photo_results');
        }
    };

    return (
        <div className="min-h-screen bg-background text-white p-6">
            {/* Header */}
            <div className="mb-6">
                <button
                    onClick={() => navigate(-1)}
                    className="flex items-center gap-2 text-muted-foreground hover:text-white mb-4 transition-colors"
                >
                    <ArrowLeft className="w-4 h-4" />
                    {t('admin.backToAdmin')}
                </button>
                
                <h1 className="text-3xl font-black flex items-center gap-3">
                    <Scan className="w-8 h-8 text-accent" />
                    {t('faceRecognition.classCheckInTitle')}
                </h1>
                <p className="text-sm text-muted-foreground mt-2">
                    {t('faceRecognition.classCheckInDesc')}
                </p>
            </div>

            {/* Error Message */}
            {error && (
                <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400">
                    {error}
                </div>
            )}

            {/* Stats */}
            <div className="grid grid-cols-3 gap-4 mb-6">
                <div className="bg-white/5 border border-white/10 rounded-xl p-4">
                    <Users className="w-6 h-6 text-accent mb-2" />
                    <p className="text-2xl font-black">{enrolledStudents.length}</p>
                    <p className="text-xs text-muted-foreground">Enrolled Students</p>
                </div>
                <div className="bg-white/5 border border-white/10 rounded-xl p-4">
                    <Eye className="w-6 h-6 text-blue-400 mb-2" />
                    <p className="text-2xl font-black">{state === 'photo_results' ? photoDetections.length : detectedStudents.length}</p>
                    <p className="text-xs text-muted-foreground">{t('faceRecognition.multipleDetected')}</p>
                </div>
                <div className="bg-white/5 border border-white/10 rounded-xl p-4">
                    <CheckCircle className="w-6 h-6 text-green-400 mb-2" />
                    <p className="text-2xl font-black">{checkedInStudents.size}</p>
                    <p className="text-xs text-muted-foreground">{t('faceRecognition.checkedInCount')}</p>
                </div>
            </div>

            {/* Hidden file input */}
            <input
                type="file"
                ref={photoInputRef}
                onChange={handlePhotoUpload}
                accept="image/*"
                className="hidden"
            />

            {/* Main Content */}
            {state === 'idle' && (
                <div className="text-center space-y-6">
                    <div className="max-w-2xl mx-auto">
                        {/* DeepFace Photo Upload Option */}
                        {deepFaceAvailable && (
                            <div className="mb-8">
                                <div className="bg-accent/10 border-2 border-accent rounded-2xl p-6 mb-4">
                                    <Image className="w-16 h-16 text-accent mx-auto mb-4" />
                                    <h3 className="text-xl font-bold text-white mb-2">Upload Class Photo</h3>
                                    <p className="text-muted-foreground text-sm mb-4">
                                        Upload a photo of the class and automatically identify all enrolled students
                                    </p>
                                    <button
                                        onClick={() => photoInputRef.current?.click()}
                                        disabled={enrolledStudents.length === 0}
                                        className="px-8 py-4 bg-accent hover:bg-accent/90 disabled:bg-gray-600 disabled:cursor-not-allowed text-black rounded-xl transition-colors font-bold text-lg flex items-center justify-center gap-3 mx-auto"
                                    >
                                        <Upload className="w-6 h-6" />
                                        Upload Photo
                                    </button>
                                </div>
                                <div className="flex items-center gap-4 text-muted-foreground text-sm">
                                    <div className="flex-1 border-t border-white/10"></div>
                                    <span>or use camera</span>
                                    <div className="flex-1 border-t border-white/10"></div>
                                </div>
                            </div>
                        )}

                        {/* Camera Option */}
                        <Camera className="w-24 h-24 text-accent mx-auto mb-4" />
                        <p className="text-muted-foreground mb-6">
                            {deepFaceAvailable 
                                ? 'Use live camera to scan students in real-time'
                                : 'Ready to scan? Position the camera to capture all students in the class.'}
                        </p>
                        <div className="flex items-center gap-2">
                            <Shield className="w-5 h-5 text-accent" />
                            <input
                                type="password"
                                placeholder="Enter academy secret to start scanning"
                                value={academySecret}
                                onChange={(e) => setAcademySecret(e.target.value)}
                                className="w-full px-4 py-2 bg-white/10 text-white rounded-lg"
                            />
                        </div>
                        <button
                            onClick={startScanning}
                            disabled={enrolledStudents.length === 0}
                            className="px-8 py-4 bg-white/10 hover:bg-white/20 disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded-xl transition-colors font-bold text-lg flex items-center justify-center gap-3 mx-auto"
                        >
                            <Scan className="w-6 h-6" />
                            {t('faceRecognition.startScanning')}
                        </button>

                        {!deepFaceAvailable && (
                            <p className="text-yellow-500 text-sm mt-4">
                                ⚠️ DeepFace server not available. Start it with: python backend/main.py
                            </p>
                        )}
                    </div>
                </div>
            )}

            {state === 'loading' && (
                <div className="text-center py-12">
                    <Loader2 className="w-16 h-16 text-accent animate-spin mx-auto mb-4" />
                    <p className="text-white font-medium">{t('faceRecognition.loadingModels')}</p>
                </div>
            )}

            {(state === 'scanning' || state === 'processing') && (
                <div className="space-y-6">
                    {/* Camera View */}
                    <div className="relative rounded-2xl overflow-hidden bg-black">
                        <video
                            ref={videoRef}
                            autoPlay
                            playsInline
                            muted
                            className="w-full h-auto"
                        />
                        <canvas
                            ref={overlayCanvasRef}
                            className="absolute inset-0 w-full h-full"
                        />
                        <canvas
                            ref={canvasRef}
                            className="hidden"
                        />
                        
                        {state === 'processing' && (
                            <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                                <Loader2 className="w-12 h-12 text-accent animate-spin" />
                            </div>
                        )}
                    </div>

                    {/* Detected Students List */}
                    {detectedStudents.length > 0 && (
                        <div className="bg-white/5 border border-white/10 rounded-xl p-4">
                            <h3 className="font-bold mb-3 flex items-center gap-2">
                                <Eye className="w-4 h-4 text-accent" />
                                Detected ({detectedStudents.length})
                            </h3>
                            <div className="space-y-2">
                                {detectedStudents.map(({ profile, confidence }, index) => (
                                    <div
                                        key={index}
                                        className="flex items-center justify-between bg-accent/10 border border-accent/20 rounded-lg p-3"
                                    >
                                        <span className="font-medium">{profile.name}</span>
                                        <span className="text-sm text-muted-foreground">
                                            {Math.round(confidence)}% {t('faceRecognition.confidence')}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Action Buttons */}
                    <div className="flex gap-3">
                        <button
                            onClick={() => {
                                cleanup();
                                setState('idle');
                            }}
                            className="flex-1 px-6 py-4 bg-white/5 hover:bg-white/10 text-white rounded-xl transition-colors font-medium"
                        >
                            {t('faceRecognition.stopScanning')}
                        </button>
                        
                        {detectedStudents.length > 0 && (
                            <button
                                onClick={performBatchCheckIn}
                                disabled={state === 'processing'}
                                className="flex-1 px-6 py-4 bg-accent hover:bg-accent/90 disabled:bg-gray-600 text-black rounded-xl transition-colors font-bold flex items-center justify-center gap-2"
                            >
                                <CheckCircle className="w-5 h-5" />
                                Check In {detectedStudents.length} Students
                            </button>
                        )}
                        
                        {checkedInStudents.size > 0 && (
                            <button
                                onClick={completeCheckIn}
                                className="flex-1 px-6 py-4 bg-green-600 hover:bg-green-700 text-white rounded-xl transition-colors font-bold"
                            >
                                Complete ({checkedInStudents.size} checked in)
                            </button>
                        )}
                    </div>
                </div>
            )}

            {/* Photo Results */}
            {state === 'photo_results' && (
                <div className="space-y-6">
                    {/* Uploaded Image */}
                    {uploadedImageUrl && (
                        <div className="relative rounded-2xl overflow-hidden bg-black">
                            <img 
                                src={uploadedImageUrl} 
                                alt="Uploaded class photo" 
                                className="w-full h-auto"
                            />
                        </div>
                    )}

                    {/* Detection Results */}
                    <div className="bg-white/5 border border-white/10 rounded-xl p-4">
                        <h3 className="font-bold mb-3 flex items-center gap-2">
                            <Eye className="w-4 h-4 text-accent" />
                            Detection Results ({photoDetections.length} faces)
                        </h3>
                        <div className="space-y-2">
                            {photoDetections.map((detection, index) => (
                                <div
                                    key={index}
                                    className={`flex items-center justify-between rounded-lg p-3 ${
                                        detection.match.matched 
                                            ? 'bg-green-500/10 border border-green-500/20' 
                                            : 'bg-orange-500/10 border border-orange-500/20'
                                    }`}
                                >
                                    <div className="flex items-center gap-3">
                                        <span className="text-muted-foreground">#{detection.faceIndex}</span>
                                        <span className={`font-medium ${detection.match.matched ? 'text-green-400' : 'text-orange-400'}`}>
                                            {detection.match.matched ? detection.match.name : 'Unknown'}
                                        </span>
                                    </div>
                                    <span className="text-sm text-muted-foreground">
                                        {detection.match.matched 
                                            ? `${detection.match.confidence}% confidence`
                                            : `dist: ${detection.match.distance.toFixed(3)}`}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Summary */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="bg-green-500/10 border border-green-500/20 rounded-xl p-4 text-center">
                            <CheckCircle className="w-8 h-8 text-green-400 mx-auto mb-2" />
                            <p className="text-2xl font-black text-green-400">
                                {photoDetections.filter(d => d.match.matched).length}
                            </p>
                            <p className="text-xs text-muted-foreground">Identified Students</p>
                        </div>
                        <div className="bg-orange-500/10 border border-orange-500/20 rounded-xl p-4 text-center">
                            <XCircle className="w-8 h-8 text-orange-400 mx-auto mb-2" />
                            <p className="text-2xl font-black text-orange-400">
                                {photoDetections.filter(d => !d.match.matched).length}
                            </p>
                            <p className="text-xs text-muted-foreground">Unknown Faces</p>
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-3">
                        <button
                            onClick={() => {
                                setPhotoDetections([]);
                                setUploadedImageUrl('');
                                setState('idle');
                            }}
                            className="flex-1 px-6 py-4 bg-white/5 hover:bg-white/10 text-white rounded-xl transition-colors font-medium"
                        >
                            Upload Different Photo
                        </button>
                        
                        {photoDetections.filter(d => d.match.matched).length > 0 && (
                            <button
                                onClick={performPhotoCheckIn}
                                className="flex-1 px-6 py-4 bg-accent hover:bg-accent/90 text-black rounded-xl transition-colors font-bold flex items-center justify-center gap-2"
                            >
                                <CheckCircle className="w-5 h-5" />
                                Check In {photoDetections.filter(d => d.match.matched).length} Students
                            </button>
                        )}
                    </div>
                </div>
            )}

            {state === 'complete' && (
                <div className="text-center py-12">
                    <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
                    <h2 className="text-2xl font-black text-white mb-2">
                        Class Check-in Complete!
                    </h2>
                    <p className="text-muted-foreground">
                        {checkedInStudents.size} students checked in successfully
                    </p>
                </div>
            )}
        </div>
    );
};
