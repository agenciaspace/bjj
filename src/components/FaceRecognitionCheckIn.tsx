import { useState, useRef, useEffect } from 'react';
import { Camera, CheckCircle, XCircle, Loader2, User, AlertCircle, Shield } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import {
    loadFaceRecognitionModels,
    detectSingleFace,
    matchFace,
    deserializeFaceDescriptors,
    decryptFaceData,
    areModelsLoaded
} from '../lib/faceRecognition';
import type { Profile } from '../types';

interface FaceRecognitionCheckInProps {
    onSuccess: () => void;
    onCancel: () => void;
}

type CheckInState = 'loading' | 'ready' | 'detecting' | 'matching' | 'success' | 'error';

export const FaceRecognitionCheckIn = ({ onSuccess, onCancel }: FaceRecognitionCheckInProps) => {
    const { t } = useLanguage();
    const { user } = useAuth();
    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const animationFrameRef = useRef<number | undefined>(undefined);
    
    const [state, setState] = useState<CheckInState>('loading');
    const [stream, setStream] = useState<MediaStream | null>(null);
    const [error, setError] = useState<string>('');
    const [confidence, setConfidence] = useState<number>(0);
    const [profile, setProfile] = useState<Profile | null>(null);
const [secret, setSecret] = useState('');

    useEffect(() => {
        initialize();
        return () => {
            cleanup();
        };
    }, []);

    const initialize = async () => {
        try {
            // Fetch user profile
            if (!user) {
                setError('User not authenticated');
                setState('error');
                return;
            }

            const { data: profileData } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', user.id)
                .single();

            if (!profileData) {
                setError('Profile not found');
                setState('error');
                return;
            }

            setProfile(profileData);

            // Check if facial recognition is enabled
            if (!profileData.face_recognition_enabled || !profileData.face_data) {
                setError(t('faceRecognition.noFaceData'));
                setState('error');
                return;
            }

            // Load models
            if (!areModelsLoaded()) {
                await loadFaceRecognitionModels();
            }

            // Start camera
            await startCamera();
            setState('ready');
        } catch (err) {
            console.error('Initialization error:', err);
            setError('Failed to initialize face recognition');
            setState('error');
        }
    };

    const startCamera = async () => {
        try {
            const mediaStream = await navigator.mediaDevices.getUserMedia({
                video: {
                    width: { ideal: 1280 },
                    height: { ideal: 720 },
                    facingMode: 'user'
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

    const startDetectionLoop = (secret: string) => {
        const detectAndMatch = async () => {
            if (!videoRef.current || !canvasRef.current || !profile || state !== 'ready') {
                animationFrameRef.current = requestAnimationFrame(detectAndMatch);
                return;
            }

            try {
                setState('detecting');
                
                // Detect face
                const descriptor = await detectSingleFace(videoRef.current);
                
                if (!descriptor) {
                    setState('ready');
                    animationFrameRef.current = requestAnimationFrame(detectAndMatch);
                    return;
                }

                setState('matching');

                // Decrypt and deserialize stored face data
                const decrypted = await decryptFaceData(profile.face_data!, secret);
                const storedDescriptors = deserializeFaceDescriptors(decrypted);

                // Match face
                const match = matchFace(descriptor, storedDescriptors);
                setConfidence(match.confidence);

                if (match.matched) {
                    // Successful match - perform check-in
                    await performCheckIn(match.confidence);
                } else {
                    // No match - continue loop
                    setState('ready');
                    animationFrameRef.current = requestAnimationFrame(detectAndMatch);
                }
            } catch (err) {
                console.error('Detection error:', err);
                setState('ready');
                animationFrameRef.current = requestAnimationFrame(detectAndMatch);
            }
        };

        animationFrameRef.current = requestAnimationFrame(detectAndMatch);
    };

    const performCheckIn = async (confidenceScore: number) => {
        if (!user) return;

        try {
            const today = new Date().toISOString().split('T')[0];

            // Check if already checked in today
            const { data: existing } = await supabase
                .from('check_ins')
                .select('id')
                .eq('user_id', user.id)
                .eq('check_in_date', today)
                .single();

            if (existing) {
                setError('Already checked in today');
                setState('error');
                return;
            }

            // Create check-in record
            const { error: insertError } = await supabase
                .from('check_ins')
                .insert({
                    user_id: user.id,
                    check_in_date: today,
                    check_in_time: new Date().toISOString(),
                    method: 'face_recognition',
                    confidence_score: Math.round(confidenceScore)
                });

            if (insertError) throw insertError;

            // Also save to local storage for backwards compatibility
            const existingCheckIns = JSON.parse(localStorage.getItem('bjj-checkins') || '[]');
            existingCheckIns.unshift({
                id: Date.now(),
                date: today,
                timestamp: Date.now()
            });
            localStorage.setItem('bjj-checkins', JSON.stringify(existingCheckIns));

            setState('success');
            
            // Vibrate on success
            if (navigator.vibrate) {
                navigator.vibrate([50, 100, 50]);
            }

            // Wait a moment then complete
            setTimeout(() => {
                cleanup();
                onSuccess();
            }, 2000);
        } catch (err) {
            console.error('Check-in error:', err);
            setError('Failed to save check-in');
            setState('error');
        }
    };

    const cleanup = () => {
        if (animationFrameRef.current) {
            cancelAnimationFrame(animationFrameRef.current);
        }
        stopCamera();
    };

    return (
        <div className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4">
            <div className="bg-gradient-to-b from-gray-900 to-black border border-white/10 rounded-3xl p-8 max-w-2xl w-full">
                {/* Loading State */}
                {state === 'loading' && (
                    <div className="text-center space-y-4 py-8">
                        <Loader2 className="w-16 h-16 text-accent animate-spin mx-auto" />
                        <p className="text-white font-medium">{t('faceRecognition.loadingModels')}</p>
                    </div>
                )}

                {/* Ready/Detecting/Matching State */}
                {(state === 'ready' || state === 'detecting' || state === 'matching') && (
                    <div className="space-y-6">
                        <div className="text-center mb-4">
                            <h2 className="text-2xl font-black text-white mb-2">
                                {t('faceRecognition.useFaceRecognition')}
                            </h2>
                            <div className="flex items-center justify-center gap-2">
                                {state === 'ready' && (
                                    <>
                                        <Camera className="w-4 h-4 text-muted-foreground" />
                                        <p className="text-muted-foreground text-sm">
                                            {t('faceRecognition.lookingForFace')}
                                        </p>
                                    </>
                                )}
                                {state === 'detecting' && (
                                    <>
                                        <User className="w-4 h-4 text-accent" />
                                        <p className="text-accent text-sm">
                                            {t('faceRecognition.faceDetected')}
                                        </p>
                                    </>
                                )}
                                {state === 'matching' && (
                                    <>
                                        <Loader2 className="w-4 h-4 text-accent animate-spin" />
                                        <p className="text-accent text-sm">
                                            {t('faceRecognition.processing')}
                                        </p>
                                    </>
                                )}
                            </div>
                        </div>

                        <div className="flex items-center gap-2">
                            <Shield className="w-5 h-5 text-accent" />
                            <input
                                type="password"
                                placeholder="Enter your secret to start check-in"
                                value={secret}
                                onChange={(e) => setSecret(e.target.value)}
                                className="w-full px-4 py-2 bg-white/10 text-white rounded-lg"
                            />
                        </div>
                        <button
                            onClick={() => startDetectionLoop(secret)}
                            className="w-full px-6 py-4 bg-accent hover:bg-accent/90 text-black rounded-xl transition-colors font-bold"
                        >
                            Start Check-in
                        </button>
                        
                        {/* Camera Preview */}
                        <div className="relative rounded-2xl overflow-hidden bg-black">
                            <video
                                ref={videoRef}
                                autoPlay
                                playsInline
                                muted
                                className="w-full h-auto"
                            />
                            <canvas
                                ref={canvasRef}
                                className="hidden"
                            />
                            
                            {/* Face Detection Overlay */}
                            {state === 'matching' && (
                                <div className="absolute inset-0 flex items-center justify-center bg-accent/10">
                                    <div className="text-center">
                                        <Loader2 className="w-12 h-12 text-accent animate-spin mx-auto mb-2" />
                                        {confidence > 0 && (
                                            <p className="text-white font-bold">
                                                {t('faceRecognition.confidence')}: {Math.round(confidence)}%
                                            </p>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>

                        <button
                            onClick={() => {
                                cleanup();
                                onCancel();
                            }}
                            className="w-full px-6 py-3 bg-white/5 hover:bg-white/10 text-white rounded-xl transition-colors font-medium"
                        >
                            {t('faceRecognition.cancel')}
                        </button>
                    </div>
                )}

                {/* Success State */}
                {state === 'success' && (
                    <div className="text-center space-y-4 py-8">
                        <CheckCircle className="w-16 h-16 text-green-500 mx-auto" />
                        <h2 className="text-2xl font-black text-white">
                            {t('faceRecognition.checkInSuccess')}
                        </h2>
                        {confidence > 0 && (
                            <p className="text-muted-foreground">
                                {t('faceRecognition.confidence')}: {Math.round(confidence)}%
                            </p>
                        )}
                    </div>
                )}

                {/* Error State */}
                {state === 'error' && (
                    <div className="space-y-6">
                        <div className="text-center space-y-4">
                            <XCircle className="w-16 h-16 text-red-500 mx-auto" />
                            <h2 className="text-2xl font-black text-white">
                                {t('faceRecognition.checkInFailed')}
                            </h2>
                            <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4">
                                <div className="flex items-start gap-3">
                                    <AlertCircle className="w-5 h-5 text-red-400 mt-0.5" />
                                    <p className="text-red-400 text-sm text-left">{error}</p>
                                </div>
                            </div>
                        </div>

                        <button
                            onClick={() => {
                                cleanup();
                                onCancel();
                            }}
                            className="w-full px-6 py-3 bg-accent hover:bg-accent/90 text-black rounded-xl transition-colors font-bold"
                        >
                            {t('faceRecognition.useManual')}
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};
