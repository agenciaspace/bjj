import { useState, useRef, useEffect } from 'react';
import { Camera, CheckCircle, XCircle, Loader2, Shield, Eye, AlertTriangle } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import {
    loadFaceRecognitionModels,
    detectSingleFace,
    serializeFaceDescriptors,
    encryptFaceData,
    validateFaceQuality,
    areModelsLoaded
} from '../lib/faceRecognition';

interface FaceEnrollmentProps {
    onComplete: () => void;
    onCancel: () => void;
}

type EnrollmentStep = 'consent' | 'loading' | 'capture' | 'processing' | 'success' | 'error';

export const FaceEnrollment = ({ onComplete, onCancel }: FaceEnrollmentProps) => {
    const { t } = useLanguage();
    const { user } = useAuth();
    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [step, setStep] = useState<EnrollmentStep>('consent');
    const [stream, setStream] = useState<MediaStream | null>(null);
    const [capturedSamples, setCapturedSamples] = useState<Float32Array[]>([]);
    const [error, setError] = useState<string>('');
    const [validationMessage, setValidationMessage] = useState<string>('');
    const [countdown, setCountdown] = useState<number>(0);
    const [secret, setSecret] = useState('');

    const REQUIRED_SAMPLES = 3; // Capture 3 samples from different angles

    // Cleanup camera stream on unmount
    useEffect(() => {
        return () => {
            stopCamera();
        };
    }, []);

    // Load models when entering capture phase
    useEffect(() => {
        if (step === 'loading') {
            loadModels();
        }
    }, [step]);

    // Validate face quality in real-time during capture
    useEffect(() => {
        if (step === 'capture' && videoRef.current && countdown === 0) {
            const interval = setInterval(async () => {
                if (videoRef.current && videoRef.current.readyState === 4) {
                    const validation = await validateFaceQuality(videoRef.current);
                    setValidationMessage(validation.message);
                }
            }, 1000);

            return () => clearInterval(interval);
        }
    }, [step, countdown]);

    const loadModels = async () => {
        try {
            if (!areModelsLoaded()) {
                await loadFaceRecognitionModels();
            }
            await startCamera();
            setStep('capture');
        } catch (err) {
            setError('Failed to load face recognition models. Please refresh and try again.');
            setStep('error');
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
            setError('Camera access denied. Please enable camera permissions.');
            setStep('error');
        }
    };

    const stopCamera = () => {
        if (stream) {
            stream.getTracks().forEach(track => track.stop());
            setStream(null);
        }
    };

    const captureSample = async () => {
        if (!videoRef.current || !canvasRef.current) return;

        // Start countdown
        setCountdown(3);
        const countdownInterval = setInterval(() => {
            setCountdown(prev => {
                if (prev <= 1) {
                    clearInterval(countdownInterval);
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);

        // Wait for countdown
        await new Promise(resolve => setTimeout(resolve, 3000));

        setStep('processing');

        try {
            // Capture frame
            const canvas = canvasRef.current;
            const video = videoRef.current;
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;
            const ctx = canvas.getContext('2d');
            
            if (!ctx) throw new Error('Canvas context not available');
            
            ctx.drawImage(video, 0, 0);

            // Detect face
            const descriptor = await detectSingleFace(canvas);

            if (!descriptor) {
                setError('No face detected. Please try again.');
                setStep('capture');
                return;
            }

            // Validate quality
            const validation = await validateFaceQuality(canvas);
            if (!validation.valid) {
                setError(validation.message);
                setStep('capture');
                return;
            }

            // Add sample
            const newSamples = [...capturedSamples, descriptor];
            setCapturedSamples(newSamples);

            if (newSamples.length < REQUIRED_SAMPLES) {
                setStep('capture');
            }
        } catch (err) {
            console.error('Error capturing sample:', err);
            setError('Failed to capture face sample. Please try again.');
            setStep('capture');
        }
    };

    const completeEnrollment = async () => {
        if (!user) return;
        if (capturedSamples.length < REQUIRED_SAMPLES) {
            setError('Not enough samples taken.');
            return;
        }
        if (!secret) {
            alert('Please enter a secret to encrypt your face data.');
            return;
        }
    
        setStep('processing');

        try {
            // Serialize and encrypt face data
            const serialized = serializeFaceDescriptors(capturedSamples);
            const encrypted = await encryptFaceData(serialized, secret);
    
            // Save to database
            const { error: updateError } = await supabase
                .from('profiles')
                .update({
                    face_recognition_enabled: true,
                    face_data: encrypted,
                    face_enrollment_date: new Date().toISOString(),
                    face_last_updated: new Date().toISOString()
                })
                .eq('id', user.id);

            if (updateError) throw updateError;

            stopCamera();
            setStep('success');
            
            // Complete after showing success
            setTimeout(() => {
                onComplete();
            }, 2000);
        } catch (err) {
            console.error('Error saving face data:', err);
            setError('Failed to save face data. Please try again.');
            setStep('error');
        }
    };

    const handleConsent = () => {
        setStep('loading');
    };

    const handleCancel = () => {
        stopCamera();
        onCancel();
    };

    return (
        <div className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4">
            <div className="bg-gradient-to-b from-gray-900 to-black border border-white/10 rounded-3xl p-8 max-w-2xl w-full">
                {/* Consent Step */}
                {step === 'consent' && (
                    <div className="space-y-6">
                        <div className="flex items-center gap-3 mb-4">
                            <Shield className="w-8 h-8 text-accent" />
                            <h2 className="text-2xl font-black text-white">
                                {t('faceRecognition.consentTitle')}
                            </h2>
                        </div>

                        <div className="space-y-4 text-muted-foreground">
                            <p>{t('faceRecognition.consentIntro')}</p>
                            
                            <div className="bg-white/5 border border-white/10 rounded-xl p-4 space-y-3">
                                <div className="flex items-start gap-3">
                                    <Eye className="w-5 h-5 text-accent mt-1" />
                                    <div>
                                        <p className="font-bold text-white">{t('faceRecognition.whatWeCollect')}</p>
                                        <p className="text-sm">{t('faceRecognition.whatWeCollectDesc')}</p>
                                    </div>
                                </div>
                                
                                <div className="flex items-start gap-3">
                                    <Shield className="w-5 h-5 text-accent mt-1" />
                                    <div>
                                        <p className="font-bold text-white">{t('faceRecognition.howWeProtect')}</p>
                                        <p className="text-sm">{t('faceRecognition.howWeProtectDesc')}</p>
                                    </div>
                                </div>
                                
                                <div className="flex items-start gap-3">
                                    <AlertTriangle className="w-5 h-5 text-yellow-500 mt-1" />
                                    <div>
                                        <p className="font-bold text-white">{t('faceRecognition.yourRights')}</p>
                                        <p className="text-sm">{t('faceRecognition.yourRightsDesc')}</p>
                                    </div>
                                </div>
                            </div>

                            <p className="text-sm">{t('faceRecognition.consentAgreement')}</p>
                        </div>

                        <div className="flex gap-3">
                            <button
                                onClick={handleCancel}
                                className="flex-1 px-6 py-3 bg-white/5 hover:bg-white/10 text-white rounded-xl transition-colors font-medium"
                            >
                                {t('faceRecognition.decline')}
                            </button>
                            <button
                                onClick={handleConsent}
                                className="flex-1 px-6 py-3 bg-accent hover:bg-accent/90 text-black rounded-xl transition-colors font-bold"
                            >
                                {t('faceRecognition.accept')}
                            </button>
                        </div>
                    </div>
                )}

                {/* Loading Step */}
                {step === 'loading' && (
                    <div className="text-center space-y-4 py-8">
                        <Loader2 className="w-16 h-16 text-accent animate-spin mx-auto" />
                        <p className="text-white font-medium">{t('faceRecognition.loadingModels')}</p>
                    </div>
                )}

                {/* Capture Step */}
                {step === 'capture' && (
                    <div className="space-y-6">
                        <div className="text-center mb-4">
                            <h2 className="text-2xl font-black text-white mb-2">
                                {t('faceRecognition.captureTitle')}
                            </h2>
                            <p className="text-muted-foreground">
                                {capturedSamples.length} / {REQUIRED_SAMPLES} {t('faceRecognition.captureProgress')}
                            </p>
                        </div>

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
                            
                            {/* Countdown Overlay */}
                            {countdown > 0 && (
                                <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                                    <div className="text-8xl font-black text-accent animate-pulse">
                                        {countdown}
                                    </div>
                                </div>
                            )}

                            {/* Validation Message */}
                            {validationMessage && countdown === 0 && (
                                <div className="absolute bottom-4 left-4 right-4 bg-black/80 backdrop-blur-sm rounded-xl p-3 text-center">
                                    <p className="text-white text-sm">{validationMessage}</p>
                                </div>
                            )}
                        </div>

                        {/* Sample Indicators */}
                        <div className="flex justify-center gap-2">
                            {Array.from({ length: REQUIRED_SAMPLES }).map((_, i) => (
                                <div
                                    key={i}
                                    className={`w-3 h-3 rounded-full ${
                                        i < capturedSamples.length
                                            ? 'bg-accent'
                                            : 'bg-white/20'
                                    }`}
                                />
                            ))}
                        </div>

                        {/* Instructions */}
                        <div className="bg-accent/10 border border-accent/20 rounded-xl p-4">
                            <p className="text-sm text-white text-center">
                                {capturedSamples.length === 0 && t('faceRecognition.instructionsFront')}
                                {capturedSamples.length === 1 && t('faceRecognition.instructionsLeft')}
                                {capturedSamples.length === 2 && t('faceRecognition.instructionsRight')}
                            </p>
                        </div>

                        {capturedSamples.length < REQUIRED_SAMPLES ? (
                            <button
                                onClick={captureSample}
                                disabled={countdown > 0}
                                className="w-full px-6 py-4 bg-accent hover:bg-accent/90 disabled:bg-gray-600 disabled:cursor-not-allowed text-black rounded-xl transition-colors font-bold flex items-center justify-center gap-2"
                            >
                                <Camera className="w-5 h-5" />
                                {countdown > 0 ? t('faceRecognition.capturing') : t('faceRecognition.captureButton')}
                            </button>
                        ) : (
                            <div className="space-y-4">
                                <div className="flex items-center gap-2">
                                    <Shield className="w-5 h-5 text-accent" />
                                    <input
                                        type="password"
                                        placeholder="Enter a secret to encrypt your face data"
                                        value={secret}
                                        onChange={(e) => setSecret(e.target.value)}
                                        className="w-full px-4 py-2 bg-white/10 text-white rounded-lg"
                                    />
                                </div>
                                <button
                                    onClick={completeEnrollment}
                                    className="w-full px-6 py-4 bg-accent hover:bg-accent/90 text-black rounded-xl transition-colors font-bold"
                                >
                                    Complete Enrollment
                                </button>
                            </div>
                        )}

                        <button
                            onClick={handleCancel}
                            className="w-full px-6 py-2 text-muted-foreground hover:text-white transition-colors"
                        >
                            {t('faceRecognition.cancel')}
                        </button>
                    </div>
                )}

                {/* Processing Step */}
                {step === 'processing' && (
                    <div className="text-center space-y-4 py-8">
                        <Loader2 className="w-16 h-16 text-accent animate-spin mx-auto" />
                        <p className="text-white font-medium">{t('faceRecognition.processing')}</p>
                    </div>
                )}

                {/* Success Step */}
                {step === 'success' && (
                    <div className="text-center space-y-4 py-8">
                        <CheckCircle className="w-16 h-16 text-green-500 mx-auto" />
                        <h2 className="text-2xl font-black text-white">
                            {t('faceRecognition.successTitle')}
                        </h2>
                        <p className="text-muted-foreground">
                            {t('faceRecognition.successMessage')}
                        </p>
                    </div>
                )}

                {/* Error Step */}
                {step === 'error' && (
                    <div className="space-y-6">
                        <div className="text-center space-y-4">
                            <XCircle className="w-16 h-16 text-red-500 mx-auto" />
                            <h2 className="text-2xl font-black text-white">
                                {t('faceRecognition.errorTitle')}
                            </h2>
                            <p className="text-red-400">{error}</p>
                        </div>

                        <div className="flex gap-3">
                            <button
                                onClick={handleCancel}
                                className="flex-1 px-6 py-3 bg-white/5 hover:bg-white/10 text-white rounded-xl transition-colors font-medium"
                            >
                                {t('faceRecognition.cancel')}
                            </button>
                            <button
                                onClick={() => {
                                    setError('');
                                    setCapturedSamples([]);
                                    setStep('loading');
                                }}
                                className="flex-1 px-6 py-3 bg-accent hover:bg-accent/90 text-black rounded-xl transition-colors font-bold"
                            >
                                {t('faceRecognition.retry')}
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};