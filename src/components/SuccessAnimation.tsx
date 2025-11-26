import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLanguage } from '../contexts/LanguageContext';

interface SuccessAnimationProps {
    isVisible: boolean;
    onComplete: () => void;
}

export const SuccessAnimation: React.FC<SuccessAnimationProps> = ({ isVisible, onComplete }) => {
    const { t } = useLanguage();

    useEffect(() => {
        if (isVisible) {
            if (navigator.vibrate) navigator.vibrate([50, 100, 50]);
            const timer = setTimeout(() => {
                onComplete();
            }, 2000);
            return () => clearTimeout(timer);
        }
    }, [isVisible, onComplete]);

    return (
        <AnimatePresence>
            {isVisible && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-md flex flex-col items-center justify-center"
                >
                    {/* Expanding circle effect */}
                    <motion.div
                        className="absolute"
                        initial={{ scale: 0, opacity: 0 }}
                        animate={{ scale: [0, 1.5, 2], opacity: [0.5, 0.3, 0] }}
                        transition={{ duration: 1.5, ease: "easeOut" }}
                    >
                        <div
                            className="w-64 h-64 rounded-full border-4 border-accent"
                            style={{ boxShadow: '0 0 60px rgba(0, 255, 255, 0.3)' }}
                        />
                    </motion.div>

                    {/* OSS text */}
                    <motion.div
                        initial={{ scale: 0.5, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{
                            delay: 0.2,
                            duration: 0.6,
                            type: "spring",
                            stiffness: 200,
                            damping: 15
                        }}
                        className="text-center relative z-10"
                    >
                        <h1 className="text-8xl md:text-9xl font-black tracking-tighter uppercase text-white mb-4"
                            style={{
                                textShadow: '0 0 40px rgba(0, 255, 255, 0.5), 0 0 80px rgba(0, 255, 255, 0.3)'
                            }}>
                            {t('success.oss')}
                        </h1>

                        <motion.p
                            className="text-base tracking-[0.4em] uppercase text-accent font-light"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.6, duration: 0.5 }}
                        >
                            {t('success.trainingLogged')}
                        </motion.p>
                    </motion.div>

                    {/* Success checkmark */}
                    <motion.div
                        initial={{ scale: 0, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{
                            delay: 1.0,
                            duration: 0.5,
                            type: "spring",
                            stiffness: 200
                        }}
                        className="absolute bottom-20"
                    >
                        <svg width="80" height="80" viewBox="0 0 80 80">
                            <motion.circle
                                cx="40"
                                cy="40"
                                r="36"
                                stroke="currentColor"
                                strokeWidth="4"
                                fill="none"
                                className="text-accent"
                                initial={{ pathLength: 0 }}
                                animate={{ pathLength: 1 }}
                                transition={{ duration: 0.6, delay: 1.0 }}
                            />
                            <motion.path
                                d="M 20 40 L 32 52 L 60 24"
                                stroke="currentColor"
                                strokeWidth="6"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                fill="none"
                                className="text-accent"
                                style={{ filter: 'drop-shadow(0 0 8px rgba(0, 255, 255, 0.6))' }}
                                initial={{ pathLength: 0 }}
                                animate={{ pathLength: 1 }}
                                transition={{ duration: 0.5, delay: 1.2 }}
                            />
                        </svg>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};
