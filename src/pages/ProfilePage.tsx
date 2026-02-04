import { useState, useRef, useEffect } from 'react';
import { useLocalStorage } from '../hooks/useLocalStorage';
import { useLanguage } from '../contexts/LanguageContext';
import { useAuth } from '../contexts/AuthContext';
import { Trophy, Flame, Download, Upload, MapPin, Plus, Trash2, LogOut, LogIn, User, Shield, TrendingUp, Languages, Star, Camera, Scan, Eye, Users, Loader2 } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { achievements } from '../data/achievements';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import type { Training, CheckIn, Profile } from '../types';
import { RoleSelector } from '../components/RoleSelector';
import { AcademyManager } from '../components/AcademyManager';
import { FaceEnrollment } from '../components/FaceEnrollment';
import { 
    extractFaceEmbedding, 
    serializeEmbedding, 
    encryptFaceData, 
    isDeepFaceAvailable,
    fileToBlob 
} from '../lib/deepFaceService';

export const ProfilePage = () => {
    const { t, language, setLanguage } = useLanguage();
    const { user, signOut } = useAuth();
    const [trainings, setTrainings] = useLocalStorage<Training[]>('bjj-trainings', []);
    const [checkIns, setCheckIns] = useLocalStorage<CheckIn[]>('bjj-checkins', []);
    const [belt, setBelt] = useLocalStorage<string>('bjj-belt', 'white');
    const [degrees, setDegrees] = useLocalStorage<number>('bjj-degrees', 0);
    const [name, setName] = useLocalStorage<string>('bjj-name', '');
    const [academies, setAcademies] = useLocalStorage<string[]>('bjj-academies', []);
    const [mainAcademy, setMainAcademy] = useLocalStorage<string>('bjj-main-academy', '');
    const [avatarUrl, setAvatarUrl] = useLocalStorage<string>('bjj-avatar-url', '');
    const [role, setRole] = useLocalStorage<'student' | 'professor'>('bjj-role', 'student');
    const [uploading, setUploading] = useState(false);
    const [newAcademy, setNewAcademy] = useState('');
    const fileInputRef = useRef<HTMLInputElement>(null);
    const avatarInputRef = useRef<HTMLInputElement>(null);
    const [showFaceEnrollment, setShowFaceEnrollment] = useState(false);
    const [profile, setProfile] = useState<Profile | null>(null);
    const [enrollingFace, setEnrollingFace] = useState(false);
    const [deepFaceAvailable, setDeepFaceAvailable] = useState(false);

    // Sync role with Supabase
    useEffect(() => {
        if (user && role) {
            supabase.from('profiles').update({ role }).eq('id', user.id).then(({ error }) => {
                if (error) console.error('Error syncing role:', error);
            });
        }
    }, [role, user]);

    // Fetch profile for facial recognition status
    useEffect(() => {
        if (user) {
            fetchProfile();
        }
    }, [user]);

    // Check DeepFace availability
    useEffect(() => {
        isDeepFaceAvailable().then(setDeepFaceAvailable);
    }, []);

    const fetchProfile = async () => {
        if (!user) return;

        const { data } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', user.id)
            .single();

        if (data) {
            setProfile(data);
        }
    };

    const handleDisableFaceRecognition = async () => {
        if (!user) return;
        if (!window.confirm(t('faceRecognition.deleteConfirm'))) return;

        try {
            const { error } = await supabase
                .from('profiles')
                .update({
                    face_recognition_enabled: false,
                    face_data: null,
                    face_enrollment_date: null,
                    face_last_updated: null
                })
                .eq('id', user.id);

            if (error) throw error;

            await fetchProfile();
            alert(t('faceRecognition.successTitle'));
        } catch (err) {
            console.error('Error disabling face recognition:', err);
            alert('Failed to disable face recognition');
        }
    };

    const handleFaceEnrollmentComplete = () => {
        setShowFaceEnrollment(false);
        fetchProfile();
    };

    const totalMinutes = trainings.reduce((acc, training) => acc + parseInt(training.duration || '0'), 0);
    const totalHours = Math.floor(totalMinutes / 60);

    const calculateStreak = () => {
        if (checkIns.length === 0) return 0;
        const sortedCheckIns = [...checkIns].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
        let streak = 0;
        let currentDate = new Date();
        for (const checkIn of sortedCheckIns) {
            const checkInDate = new Date(checkIn.date);
            const diffDays = Math.floor((currentDate.getTime() - checkInDate.getTime()) / (1000 * 60 * 60 * 24));
            if (diffDays === streak) streak++; else break;
        }
        return streak;
    };

    const streak = calculateStreak();

    const handleAddAcademy = (e: React.FormEvent) => {
        e.preventDefault();
        if (newAcademy.trim()) {
            const updatedAcademies = [...academies, newAcademy.trim()];
            setAcademies(updatedAcademies);
            if (updatedAcademies.length === 1) {
                setMainAcademy(newAcademy.trim());
            }
            setNewAcademy('');
        }
    };

    const handleDeleteAcademy = (index: number) => {
        if (window.confirm(t('trainings.confirmDelete'))) {
            const deletedAcademy = academies[index];
            const newAcademies = academies.filter((_, i) => i !== index);
            setAcademies(newAcademies);
            if (mainAcademy === deletedAcademy) {
                setMainAcademy(newAcademies.length > 0 ? newAcademies[0] : '');
            }
        }
    };

    const handleSetMainAcademy = (academy: string) => {
        setMainAcademy(academy);
        if (navigator.vibrate) navigator.vibrate(50);
    };

    const handleAvatarUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
        try {
            setUploading(true);

            if (!event.target.files || event.target.files.length === 0) {
                throw new Error('You must select an image to upload.');
            }

            const file = event.target.files[0];

            // Validate file size (max 2MB)
            if (file.size > 2 * 1024 * 1024) {
                throw new Error('Image too large. Max size is 2MB.');
            }

            const fileExt = file.name.split('.').pop();
            const fileName = `${Math.random()}.${fileExt}`;
            const filePath = `${fileName}`;

            console.log('Starting upload to:', filePath);

            const { error: uploadError } = await supabase.storage
                .from('avatars')
                .upload(filePath, file);

            if (uploadError) {
                console.error('Supabase Upload Error:', uploadError);
                throw uploadError;
            }

            const { data } = supabase.storage.from('avatars').getPublicUrl(filePath);

            setAvatarUrl(data.publicUrl);

            // Update profile with avatar URL
            if (user) {
                const { error: updateError } = await supabase.from('profiles').update({
                    avatar_url: data.publicUrl,
                    updated_at: new Date().toISOString()
                }).eq('id', user.id);

                if (updateError) {
                    console.error('Profile Update Error:', updateError);
                }
            }

            // Auto-enroll face if DeepFace is available
            if (deepFaceAvailable && user) {
                setEnrollingFace(true);
                try {
                    const blob = await fileToBlob(file);
                    const embedding = await extractFaceEmbedding(blob);
                    
                    if (embedding) {
                        // Serialize and encrypt the embedding
                        const serialized = serializeEmbedding(embedding);
                        const encrypted = encryptFaceData(serialized);
                        
                        // Save to database
                        const { error: faceError } = await supabase
                            .from('profiles')
                            .update({
                                face_recognition_enabled: true,
                                face_data: encrypted,
                                face_enrollment_date: new Date().toISOString(),
                                face_last_updated: new Date().toISOString()
                            })
                            .eq('id', user.id);
                        
                        if (faceError) {
                            console.error('Face enrollment error:', faceError);
                        } else {
                            console.log('Face auto-enrolled from profile photo!');
                            await fetchProfile();
                        }
                    } else {
                        console.log('No face detected in profile photo');
                    }
                } catch (faceErr) {
                    console.error('Face extraction failed:', faceErr);
                    // Don't fail the upload, just skip face enrollment
                } finally {
                    setEnrollingFace(false);
                }
            }

            alert(t('profile.avatarUpdated'));
        } catch (error: any) {
            console.error('Full Error Object:', error);
            alert(`Upload Failed: ${error.message || 'Unknown error'}`);
        } finally {
            setUploading(false);
        }
    };

    const handleExport = () => {
        const data = {
            trainings,
            checkIns,
            belt,
            degrees,
            name,
            academies,
            mainAcademy,
            avatarUrl,
            language,
            role
        };
        const blob = new Blob([JSON.stringify(data)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `my-bjj-backup-${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        alert(t('profile.dataExported'));
    };

    const handleImport = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        if (!window.confirm(t('profile.confirmImport'))) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const data = JSON.parse(e.target?.result as string);
                if (data.trainings) setTrainings(data.trainings);
                if (data.checkIns) setCheckIns(data.checkIns);
                if (data.belt) setBelt(data.belt);
                if (data.degrees) setDegrees(data.degrees);
                if (data.name) setName(data.name);
                if (data.academies) setAcademies(data.academies);
                if (data.mainAcademy) setMainAcademy(data.mainAcademy);
                if (data.avatarUrl) setAvatarUrl(data.avatarUrl);
                if (data.language) setLanguage(data.language);
                if (data.role) setRole(data.role);
                alert(t('profile.dataImported'));
            } catch (error) {
                alert('Error importing data');
            }
        };
        reader.readAsText(file);
    };

    const belts = [
        { id: 'white', color: 'bg-white text-black border-gray-200', label: 'white' },
        { id: 'blue', color: 'bg-blue-600 text-white border-blue-700', label: 'blue' },
        { id: 'purple', color: 'bg-purple-600 text-white border-purple-700', label: 'purple' },
        { id: 'brown', color: 'bg-[#5D4037] text-white border-[#3E2723]', label: 'brown' },
        { id: 'black', color: 'bg-black text-white border-gray-800', label: 'black' },
    ];

    const [imgError, setImgError] = useState(false);
    const googleAvatar = user?.user_metadata?.avatar_url || user?.user_metadata?.picture;
    const displayAvatar = !imgError && (avatarUrl || googleAvatar);

    useEffect(() => {
        setImgError(false);
        if (avatarUrl || googleAvatar) {
            const url = avatarUrl || googleAvatar;
            const img = new Image();
            img.referrerPolicy = 'no-referrer';
            img.src = url;
            img.onload = () => setImgError(false);
            img.onerror = () => setImgError(true);
        }
    }, [avatarUrl, googleAvatar]);

    return (
        <div className="space-y-12 pt-8">
            {/* Header */}
            <div className="flex justify-between items-start mb-8">
                <div>
                    <h1 className="text-4xl font-black tracking-tighter mb-1">
                        {name || t('profile.title')}
                    </h1>
                    <p className="text-muted-foreground text-sm uppercase tracking-widest">
                        {user ? user.email : t('profile.subtitle')}
                    </p>
                </div>

                <div className="relative group">
                    <div className="w-20 h-20 rounded-full bg-white/10 overflow-hidden border-2 border-white/20 group-hover:border-accent transition-colors">
                        {displayAvatar ? (
                            <img
                                src={displayAvatar}
                                alt="User Avatar"
                                className="w-full h-full object-cover"
                                referrerPolicy="no-referrer"
                            />
                        ) : (
                            <div className="w-full h-full flex items-center justify-center text-2xl font-bold text-muted-foreground">
                                {name ? name.charAt(0).toUpperCase() : <User className="w-8 h-8" />}
                            </div>
                        )}
                    </div>
                    <button
                        onClick={() => avatarInputRef.current?.click()}
                        disabled={uploading || enrollingFace}
                        className="absolute bottom-0 right-0 p-2 bg-accent text-black rounded-full hover:scale-110 transition-transform shadow-lg disabled:opacity-50"
                    >
                        {uploading || enrollingFace ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                            <Camera className="w-4 h-4" />
                        )}
                    </button>
                    {deepFaceAvailable && (
                        <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-background" title="Face recognition available" />
                    )}
                    <input
                        type="file"
                        ref={avatarInputRef}
                        onChange={handleAvatarUpload}
                        accept="image/*"
                        className="hidden"
                    />
                </div>

                <div className="flex gap-2">
                    <button
                        onClick={() => setLanguage(language === 'pt' ? 'en' : 'pt')}
                        className="p-3 rounded-full bg-white/5 hover:bg-white/10 transition-colors"
                    >
                        <span className="font-bold text-xs">{language.toUpperCase()}</span>
                    </button>
                    {user?.email === 'leonhatori@gmail.com' && (
                        <Link
                            to="/admin"
                            className="p-3 rounded-full bg-accent/10 hover:bg-accent/20 text-accent transition-colors"
                            title="Admin Panel"
                        >
                            <Shield className="w-5 h-5" />
                        </Link>
                    )}
                    {user ? (
                        <button
                            onClick={signOut}
                            className="p-3 rounded-full bg-white/5 hover:bg-red-500/20 text-muted-foreground hover:text-red-500 transition-colors"
                            title="Sign Out"
                        >
                            <LogOut className="w-5 h-5" />
                        </button>
                    ) : (
                        <Link
                            to="/auth"
                            className="p-3 rounded-full bg-accent/10 hover:bg-accent/20 text-accent transition-colors"
                            title="Sign In"
                        >
                            <LogIn className="w-5 h-5" />
                        </Link>
                    )}
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left Column */}
                <div className="space-y-8 lg:col-span-1">
                    {/* Role Selector */}
                    <div className="bg-white/[0.03] border border-white/[0.08] rounded-[2rem] p-6 space-y-6">
                        <div className="flex items-center gap-3">
                            <User className="w-5 h-5 text-accent" />
                            <h3 className="text-sm font-bold tracking-widest uppercase text-muted-foreground/80">
                                Role
                            </h3>
                        </div>
                        <RoleSelector selectedRole={role} onSelect={setRole} />
                    </div>

                    {/* Belt System */}
                    <div className="bg-white/[0.03] border border-white/[0.08] rounded-[2rem] p-6 space-y-6">
                        <div className="flex items-center gap-3">
                            <Shield className="w-5 h-5 text-accent" />
                            <h3 className="text-sm font-bold tracking-widest uppercase text-muted-foreground/80">
                                {t('profile.belt')}
                            </h3>
                        </div>

                        <div className="flex justify-between gap-2 overflow-x-auto p-4 -mx-4 scrollbar-hide">
                            {belts.map((b) => (
                                <button
                                    key={b.id}
                                    onClick={() => {
                                        if (belt !== b.id) {
                                            setBelt(b.id);
                                            setDegrees(0);
                                        }
                                    }}
                                    className={`w-12 h-12 rounded-full border-4 transition-all duration-300 flex-shrink-0 ${b.color} ${belt === b.id ? 'scale-110 shadow-[0_0_20px_rgba(255,255,255,0.3)] ring-2 ring-accent ring-offset-2 ring-offset-black' : 'opacity-50 hover:opacity-80 hover:scale-105'
                                        }`}
                                />
                            ))}
                        </div>

                        <div className="space-y-3">
                            <p className="text-xs text-muted-foreground uppercase tracking-widest">{t('profile.degrees')}</p>
                            <div className="flex gap-2">
                                {[1, 2, 3, 4].map((d) => (
                                    <button
                                        key={d}
                                        onClick={() => setDegrees(degrees === d ? 0 : d)}
                                        className={`flex-1 h-8 rounded-lg transition-all duration-300 ${degrees >= d
                                            ? 'bg-white shadow-[0_0_10px_rgba(255,255,255,0.5)]'
                                            : 'bg-white/10 hover:bg-white/20'
                                            }`}
                                    />
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Stats Grid */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="bg-white/[0.03] border border-white/[0.08] rounded-[2rem] p-6 space-y-3">
                            <Trophy className="w-8 h-8 text-accent" />
                            <div>
                                <p className="text-3xl font-black mb-1">{trainings.length}</p>
                                <p className="text-[10px] text-muted-foreground tracking-widest uppercase">{t('profile.trainingSessions')}</p>
                            </div>
                        </div>
                        <div className="bg-white/[0.03] border border-white/[0.08] rounded-[2rem] p-6 space-y-3">
                            <TrendingUp className="w-8 h-8 text-accent" />
                            <div>
                                <p className="text-3xl font-black mb-1">{totalHours}h</p>
                                <p className="text-[10px] text-muted-foreground tracking-widest uppercase">{t('profile.hoursTrained')}</p>
                            </div>
                        </div>
                        <div className="bg-white/[0.03] border border-white/[0.08] rounded-[2rem] p-6 space-y-3">
                            <User className="w-8 h-8 text-accent" />
                            <div>
                                <p className="text-3xl font-black mb-1">{checkIns.length}</p>
                                <p className="text-[10px] text-muted-foreground tracking-widest uppercase">{t('profile.totalCheckins')}</p>
                            </div>
                        </div>
                        <div className="bg-white/[0.03] border border-white/[0.08] rounded-[2rem] p-6 space-y-3">
                            <Flame className="w-8 h-8 text-accent" />
                            <div>
                                <p className="text-3xl font-black mb-1">{streak} {t('profile.days')}</p>
                                <p className="text-[10px] text-muted-foreground tracking-widest uppercase">{t('profile.currentStreak')}</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right Column */}
                <div className="space-y-8 lg:col-span-2">
                    {/* Academy Manager (New) */}
                    <div className="bg-white/[0.03] border border-white/[0.08] rounded-[2rem] p-6">
                        <AcademyManager />
                    </div>

                    {/* Academies (Legacy/Manual) */}
                    <div className="bg-white/[0.03] border border-white/[0.08] rounded-[2rem] p-6 space-y-6">
                        <div className="flex items-center gap-3">
                            <MapPin className="w-5 h-5 text-accent" />
                            <h3 className="text-sm font-bold tracking-widest uppercase text-muted-foreground/80">
                                {t('profile.myAcademies')}
                            </h3>
                        </div>

                        <form onSubmit={handleAddAcademy} className="flex gap-2">
                            <input
                                type="text"
                                value={newAcademy}
                                onChange={(e) => setNewAcademy(e.target.value)}
                                placeholder={t('profile.academyPlaceholder')}
                                className="flex-1 bg-white/[0.05] rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-1 focus:ring-accent"
                            />
                            <button
                                type="submit"
                                disabled={!newAcademy.trim()}
                                className="bg-accent text-black p-3 rounded-xl disabled:opacity-50 disabled:cursor-not-allowed hover:scale-105 transition-all"
                            >
                                <Plus className="w-5 h-5" />
                            </button>
                        </form>

                        <div className="space-y-2">
                            <AnimatePresence mode="popLayout">
                                {academies.length === 0 ? (
                                    <p className="text-xs text-muted-foreground text-center py-4">{t('profile.noAcademies')}</p>
                                ) : (
                                    academies.map((academy, index) => (
                                        <motion.div
                                            key={index}
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            exit={{ opacity: 0, x: -10 }}
                                            className={`flex items-center justify-between bg-white/[0.05] rounded-xl p-4 border transition-colors ${mainAcademy === academy ? 'border-accent/50 bg-accent/5' : 'border-transparent'}`}
                                        >
                                            <div className="flex items-center gap-3">
                                                <button
                                                    onClick={() => handleSetMainAcademy(academy)}
                                                    className={`transition-colors ${mainAcademy === academy ? 'text-accent' : 'text-muted-foreground hover:text-accent/50'}`}
                                                    title={t('profile.setMain')}
                                                >
                                                    <Star className={`w-4 h-4 ${mainAcademy === academy ? 'fill-accent' : ''}`} />
                                                </button>
                                                <span className={`font-medium ${mainAcademy === academy ? 'text-accent' : ''}`}>{academy}</span>
                                                {mainAcademy === academy && (
                                                    <span className="text-[10px] font-bold bg-accent/20 text-accent px-2 py-0.5 rounded uppercase tracking-wider">
                                                        {t('profile.mainAcademy')}
                                                    </span>
                                                )}
                                            </div>
                                            <button
                                                onClick={() => handleDeleteAcademy(index)}
                                                className="text-muted-foreground hover:text-red-500 transition-colors"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </motion.div>
                                    ))
                                )}
                            </AnimatePresence>
                        </div>
                    </div>

                    {/* Achievements */}
                    <div className="space-y-4">
                        <h2 className="text-[10px] font-light tracking-[0.3em] text-muted-foreground/50 uppercase text-center">
                            {t('profile.achievements')}
                        </h2>
                        <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                            {achievements.map((achievement) => {
                                const isUnlocked = achievement.check(trainings, checkIns);
                                const Icon = achievement.icon;
                                return (
                                    <motion.div
                                        key={achievement.id}
                                        initial={{ opacity: 0, scale: 0.9 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        className={`aspect-square rounded-2xl border flex flex-col items-center justify-center p-2 text-center gap-2 transition-all duration-300 ${isUnlocked
                                            ? 'bg-accent/10 border-accent/30 shadow-[0_0_15px_rgba(0,255,255,0.1)]'
                                            : 'bg-white/[0.02] border-white/[0.05] opacity-50 grayscale'
                                            }`}
                                    >
                                        <Icon className={`w-6 h-6 ${isUnlocked ? 'text-accent' : 'text-muted-foreground'}`} />
                                        <p className={`text-[10px] font-bold leading-tight ${isUnlocked ? 'text-white' : 'text-muted-foreground'}`}>
                                            {t(achievement.titleKey)}
                                        </p>
                                    </motion.div>
                                );
                            })}
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        {/* Language Switcher */}
                        <div className="bg-white/[0.03] border border-white/[0.08] rounded-[2rem] p-6 space-y-4">
                            <div className="flex items-center gap-3 mb-3">
                                <Languages className="w-5 h-5 text-accent" />
                                <h3 className="text-sm font-bold tracking-widest uppercase text-muted-foreground/80">
                                    {t('profile.language')}
                                </h3>
                            </div>
                            <div className="flex gap-3">
                                <button onClick={() => setLanguage('pt')} className={`flex-1 py-3 px-4 rounded-xl font-bold text-sm transition-all ${language === 'pt' ? 'bg-accent text-black shadow-glow' : 'bg-white/[0.05] text-muted-foreground'}`}>🇧🇷 Português</button>
                                <button onClick={() => setLanguage('en')} className={`flex-1 py-3 px-4 rounded-xl font-bold text-sm transition-all ${language === 'en' ? 'bg-accent text-black shadow-glow' : 'bg-white/[0.05] text-muted-foreground'}`}>🇺🇸 English</button>
                            </div>
                        </div>

                        {/* Data Management */}
                        <div className="bg-white/[0.03] border border-white/[0.08] rounded-[2rem] p-6 space-y-4">
                            <div className="flex items-center gap-3 mb-3">
                                <Download className="w-5 h-5 text-accent" />
                                <h3 className="text-sm font-bold tracking-widest uppercase text-muted-foreground/80">
                                    {t('profile.dataManagement')}
                                </h3>
                            </div>
                            <div className="flex flex-col gap-3">
                                <button
                                    onClick={handleExport}
                                    className="w-full py-3 px-4 rounded-xl bg-white/[0.05] hover:bg-white/[0.1] text-white font-bold text-sm flex items-center justify-center gap-2 transition-all"
                                >
                                    <Download className="w-4 h-4" />
                                    {t('profile.exportData')}
                                </button>
                                <button
                                    onClick={() => fileInputRef.current?.click()}
                                    className="w-full py-3 px-4 rounded-xl bg-white/[0.05] hover:bg-white/[0.1] text-white font-bold text-sm flex items-center justify-center gap-2 transition-all"
                                >
                                    <Upload className="w-4 h-4" />
                                    {t('profile.importData')}
                                </button>
                                <input
                                    type="file"
                                    ref={fileInputRef}
                                    onChange={handleImport}
                                    accept=".json"
                                    className="hidden"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Facial Recognition Settings */}
                    <div className="bg-white/[0.03] border border-white/[0.08] rounded-[2rem] p-6 space-y-4">
                        <div className="flex items-center gap-3 mb-3">
                            <Scan className="w-5 h-5 text-accent" />
                            <h3 className="text-sm font-bold tracking-widest uppercase text-muted-foreground/80">
                                {t('faceRecognition.settingsTitle')}
                            </h3>
                        </div>

                        <p className="text-xs text-muted-foreground mb-4">
                            {t('faceRecognition.settingsDesc')}
                        </p>

                        {/* Professor/Owner: Class Check-in Link */}
                        {(profile?.role === 'professor' || profile?.role === 'owner') && (
                            <Link
                                to="/class-checkin"
                                className="block w-full py-3 px-4 rounded-xl bg-accent/10 hover:bg-accent/20 border-2 border-accent text-accent font-bold text-sm flex items-center justify-center gap-2 transition-all mb-4"
                            >
                                <Users className="w-4 h-4" />
                                {t('faceRecognition.classCheckInTitle')}
                            </Link>
                        )}

                        {profile?.face_recognition_enabled ? (
                            <div className="space-y-4">
                                {/* Status Card */}
                                <div className="bg-accent/10 border border-accent/20 rounded-xl p-4">
                                    <div className="flex items-center gap-3 mb-3">
                                        <Eye className="w-5 h-5 text-accent" />
                                        <div>
                                            <p className="font-bold text-white text-sm">
                                                {t('faceRecognition.enabled')}
                                            </p>
                                            {profile.face_enrollment_date && (
                                                <p className="text-xs text-muted-foreground">
                                                    {t('faceRecognition.enrolledOn')}:{' '}
                                                    {new Date(profile.face_enrollment_date).toLocaleDateString()}
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                {/* Actions */}
                                <div className="flex flex-col gap-2">
                                    <button
                                        onClick={() => setShowFaceEnrollment(true)}
                                        className="w-full py-3 px-4 rounded-xl bg-white/[0.05] hover:bg-white/[0.1] text-white font-bold text-sm flex items-center justify-center gap-2 transition-all"
                                    >
                                        <Scan className="w-4 h-4" />
                                        {t('faceRecognition.reenroll')}
                                    </button>
                                    <button
                                        onClick={handleDisableFaceRecognition}
                                        className="w-full py-3 px-4 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-400 font-bold text-sm flex items-center justify-center gap-2 transition-all"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                        {t('faceRecognition.deleteData')}
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <button
                                onClick={() => setShowFaceEnrollment(true)}
                                className="w-full py-3 px-4 rounded-xl bg-accent hover:bg-accent/90 text-black font-bold text-sm flex items-center justify-center gap-2 transition-all"
                            >
                                <Scan className="w-4 h-4" />
                                {t('faceRecognition.enable')}
                            </button>
                        )}
                    </div>
                </div>
            </div>

            {/* Face Enrollment Modal */}
            {showFaceEnrollment && (
                <FaceEnrollment
                    onComplete={handleFaceEnrollmentComplete}
                    onCancel={() => setShowFaceEnrollment(false)}
                />
            )}
        </div>
    );
};
