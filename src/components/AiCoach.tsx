import React, { useState } from 'react';
import { Brain, Sparkles, Loader2, AlertCircle, RefreshCw } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { useLocalStorage } from '../hooks/useLocalStorage';
import { getTrainingSuggestion, type AiSuggestion } from '../lib/gemini';
import type { Training } from '../types';
import { motion, AnimatePresence } from 'framer-motion';

export const AiCoach: React.FC = () => {
    const { t } = useLanguage();
    const [trainings] = useLocalStorage<Training[]>('bjj-trainings', []);
    const [belt] = useLocalStorage<string>('bjj-belt', 'white');
    const [mainAcademy] = useLocalStorage<string>('bjj-main-academy', '');

    const [suggestion, setSuggestion] = useState<AiSuggestion | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleGetAdvice = async () => {
        setLoading(true);
        setError(null);
        try {
            const result = await getTrainingSuggestion(trainings, belt, mainAcademy);
            setSuggestion(result);
        } catch (err: any) {
            console.error('AI Coach Error:', err);
            // More specific error messages
            if (err.message?.includes('API key') || err.message?.includes('Invalid')) {
                setError(t('coach.errorApiKey'));
            } else if (err.message?.includes('quota')) {
                setError(t('coach.errorQuota'));
            } else {
                setError(t('coach.errorGeneric'));
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="bg-gradient-to-br from-black to-[#1a1a1a] border border-white/10 rounded-[2rem] p-6 relative overflow-hidden group">
            {/* Background Glow */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-accent/10 rounded-full blur-[50px] -translate-y-1/2 translate-x-1/2 group-hover:bg-accent/20 transition-all duration-500" />

            <div className="relative z-10">
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                        <div className="p-3 bg-accent/10 rounded-xl text-accent">
                            <Brain className="w-6 h-6" />
                        </div>
                        <div>
                            <h2 className="text-lg font-black tracking-tight text-white">{t('coach.title')}</h2>
                            <p className="text-[10px] uppercase tracking-widest text-muted-foreground">{t('coach.subtitle')}</p>
                        </div>
                    </div>
                    {!suggestion && !loading && (
                        <button
                            onClick={handleGetAdvice}
                            className="flex items-center gap-2 px-4 py-2 bg-white text-black rounded-xl text-xs font-bold uppercase tracking-wider hover:scale-105 transition-transform shadow-glow"
                        >
                            <Sparkles className="w-4 h-4" />
                            {t('coach.ask')}
                        </button>
                    )}
                </div>

                <AnimatePresence mode="wait">
                    {loading ? (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="flex flex-col items-center justify-center py-8 space-y-4"
                        >
                            <Loader2 className="w-8 h-8 text-accent animate-spin" />
                            <p className="text-xs text-muted-foreground animate-pulse">{t('coach.analyzing')}</p>
                        </motion.div>
                    ) : error ? (
                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 flex items-start gap-3"
                        >
                            <AlertCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
                            <div className="flex-1">
                                <p className="text-sm text-red-200 font-medium">{error}</p>
                                <button
                                    onClick={handleGetAdvice}
                                    className="mt-2 text-xs text-red-400 hover:text-red-300 underline"
                                >
                                    {t('coach.tryAgain')}
                                </button>
                            </div>
                        </motion.div>
                    ) : suggestion ? (
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="space-y-4"
                        >
                            <div className="space-y-2">
                                <h3 className="text-2xl font-black text-white leading-none">
                                    {suggestion.focus}
                                </h3>
                                <p className="text-sm text-muted-foreground leading-relaxed">
                                    {suggestion.reasoning}
                                </p>
                            </div>

                            <div className="space-y-2">
                                <p className="text-[10px] uppercase tracking-widest text-accent font-bold">{t('coach.suggestedTechniques')}</p>
                                <div className="flex flex-wrap gap-2">
                                    {suggestion.suggestedTechniques.map((tech, i) => (
                                        <span
                                            key={i}
                                            className="px-3 py-1.5 bg-white/5 border border-white/10 rounded-lg text-xs text-white/80"
                                        >
                                            {tech}
                                        </span>
                                    ))}
                                </div>
                            </div>

                            <button
                                onClick={handleGetAdvice}
                                className="w-full mt-4 py-3 flex items-center justify-center gap-2 text-xs font-bold uppercase tracking-wider text-muted-foreground hover:text-white transition-colors border-t border-white/5"
                            >
                                <RefreshCw className="w-3 h-3" />
                                {t('coach.newSuggestion')}
                            </button>
                        </motion.div>
                    ) : (
                        <div className="text-center py-6 px-4 border border-dashed border-white/10 rounded-xl">
                            <p className="text-sm text-muted-foreground/60">
                                {t('coach.placeholder')}
                            </p>
                        </div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
};
