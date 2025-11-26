import { useState, useEffect } from 'react';
import { useLocalStorage } from '../hooks/useLocalStorage';
import { useLanguage } from '../contexts/LanguageContext';
import { CheckCircle, Flame, Calendar } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface CheckIn {
    id: number;
    date: string;
    timestamp: number;
}

export const CheckInPage = () => {
    const { t } = useLanguage();
    const [checkIns, setCheckIns] = useLocalStorage<CheckIn[]>('bjj-checkins', []);
    const [showSuccess, setShowSuccess] = useState(false);
    const [canCheckIn, setCanCheckIn] = useState(true);

    const today = new Date().toISOString().split('T')[0];

    useEffect(() => {
        const hasCheckedInToday = checkIns.some(c => c.date === today);
        setCanCheckIn(!hasCheckedInToday);
    }, [checkIns, today]);

    const handleCheckIn = () => {
        if (!canCheckIn) return;

        if (navigator.vibrate) navigator.vibrate([50, 100, 50]);

        const newCheckIn: CheckIn = {
            id: Date.now(),
            date: today,
            timestamp: Date.now(),
        };

        setCheckIns(prev => [newCheckIn, ...prev]);
        setShowSuccess(true);
        setTimeout(() => setShowSuccess(false), 2000);
    };

    const calculateStreak = () => {
        if (checkIns.length === 0) return 0;

        const sortedCheckIns = [...checkIns].sort((a, b) =>
            new Date(b.date).getTime() - new Date(a.date).getTime()
        );

        let streak = 0;
        let currentDate = new Date();

        for (const checkIn of sortedCheckIns) {
            const checkInDate = new Date(checkIn.date);
            const diffDays = Math.floor((currentDate.getTime() - checkInDate.getTime()) / (1000 * 60 * 60 * 24));

            if (diffDays === streak) {
                streak++;
            } else {
                break;
            }
        }

        return streak;
    };

    const streak = calculateStreak();

    return (
        <div className="space-y-12 pt-8">
            {/* Header */}
            <div className="text-center space-y-2">
                <h1 className="text-5xl md:text-6xl font-black tracking-[-0.02em] bg-gradient-to-b from-white via-white to-white/40 bg-clip-text text-transparent">
                    {t('checkin.title')}
                </h1>
                <p className="text-sm text-muted-foreground/60 tracking-wide font-light">
                    {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
                </p>
            </div>

            {/* Streak Display */}
            {streak > 0 && (
                <motion.div
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="flex items-center justify-center gap-3 bg-gradient-to-r from-accent/10 to-accent/5 border border-accent/20 rounded-[2rem] py-6 px-8"
                >
                    <Flame className="w-8 h-8 text-accent animate-pulse" />
                    <div className="text-center">
                        <p className="text-4xl font-black text-accent">{streak}</p>
                        <p className="text-xs text-muted-foreground tracking-widest uppercase">{t('checkin.streak')}</p>
                    </div>
                </motion.div>
            )}

            {/* Check-in Button */}
            <div className="flex flex-col items-center gap-6">
                <AnimatePresence mode="wait">
                    {canCheckIn ? (
                        <motion.button
                            key="checkin-button"
                            initial={{ scale: 0.9 }}
                            animate={{ scale: 1 }}
                            exit={{ scale: 0.9 }}
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={handleCheckIn}
                            className="relative w-48 h-48 rounded-full bg-gradient-to-br from-white to-gray-200 shadow-[0_0_60px_rgba(0,255,255,0.3)] hover:shadow-[0_0_80px_rgba(0,255,255,0.5)] transition-all duration-300 flex items-center justify-center group"
                        >
                            <div className="text-center">
                                <CheckCircle className="w-16 h-16 text-black mx-auto mb-2 group-hover:scale-110 transition-transform" />
                                <p className="text-sm font-black text-black tracking-[0.2em] uppercase">{t('checkin.button')}</p>
                            </div>
                        </motion.button>
                    ) : (
                        <motion.div
                            key="checked-in"
                            initial={{ scale: 0.9 }}
                            animate={{ scale: 1 }}
                            className="w-48 h-48 rounded-full bg-accent/20 border-4 border-accent flex items-center justify-center"
                        >
                            <div className="text-center">
                                <CheckCircle className="w-16 h-16 text-accent mx-auto mb-2" />
                                <p className="text-sm font-black text-accent tracking-[0.2em] uppercase">{t('checkin.checkedIn')}</p>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {showSuccess && (
                    <motion.p
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        className="text-accent font-bold tracking-wider text-sm"
                    >
                        ✓ {t('checkin.recorded')}
                    </motion.p>
                )}
            </div>

            {/* Recent Check-ins */}
            {checkIns.length > 0 && (
                <div className="space-y-4">
                    <h3 className="text-[10px] font-light tracking-[0.3em] text-muted-foreground/50 uppercase text-center">
                        {t('checkin.recentCheckins')}
                    </h3>
                    <div className="space-y-2">
                        {checkIns.slice(0, 7).map((checkIn, index) => (
                            <motion.div
                                key={checkIn.id}
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: index * 0.05 }}
                                className="bg-white/[0.03] border border-white/[0.08] rounded-2xl p-4 flex items-center justify-between hover:bg-white/[0.08] transition-colors"
                            >
                                <div className="flex items-center gap-3">
                                    <Calendar className="w-5 h-5 text-accent" />
                                    <div>
                                        <p className="font-bold text-sm">
                                            {new Date(checkIn.date).toLocaleDateString('en-US', { weekday: 'long' })}
                                        </p>
                                        <p className="text-xs text-muted-foreground">
                                            {new Date(checkIn.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                                        </p>
                                    </div>
                                </div>
                                <CheckCircle className="w-5 h-5 text-accent" />
                            </motion.div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};
