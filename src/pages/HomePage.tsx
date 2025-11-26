import { useState } from 'react';
import { TrainingForm } from '../components/TrainingForm';
import { AiCoach } from '../components/AiCoach';
import { SuccessAnimation } from '../components/SuccessAnimation';
import { useLocalStorage } from '../hooks/useLocalStorage';
import { useLanguage } from '../contexts/LanguageContext';
import { motion } from 'framer-motion';
import { type Training } from '../types';

export const HomePage = () => {
    const { t, language, setLanguage } = useLanguage();
    const [trainings, setTrainings] = useLocalStorage<Training[]>('bjj-trainings', []);
    const [showSuccess, setShowSuccess] = useState(false);

    const handleAddTraining = (data: Omit<Training, 'id'>) => {
        const newTraining = { ...data, id: Date.now() };
        setTrainings(prev => [newTraining, ...prev]);
        setShowSuccess(true);
    };

    return (
        <>
            <div className="space-y-16">
                <section className="mt-8 relative">
                    <div className="absolute top-0 right-0">
                        <button
                            onClick={() => setLanguage(language === 'pt' ? 'en' : 'pt')}
                            className="p-2 px-3 rounded-full bg-white/5 hover:bg-white/10 transition-colors text-[10px] font-black tracking-widest text-muted-foreground hover:text-white uppercase"
                        >
                            {language === 'pt' ? '🇧🇷 PT' : '🇺🇸 EN'}
                        </button>
                    </div>
                    <h2 className="text-5xl md:text-6xl font-black mb-14 tracking-[-0.02em] text-center bg-gradient-to-b from-white via-white to-white/40 bg-clip-text text-transparent drop-shadow-[0_0_10px_rgba(255,255,255,0.1)] pt-8">
                        {t('home.title')}
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {/* Training Form */}
                        <div className="md:col-span-2 lg:col-span-2">
                            <TrainingForm onSubmit={handleAddTraining} />
                        </div>

                        {/* AI Coach & Stats Column */}
                        <div className="space-y-8">
                            <AiCoach />

                            {/* Quick Stats (Optional - could move here later) */}
                        </div>
                    </div>
                </section>

                {trainings.length > 0 && trainings.slice(0, 3).length > 0 && (
                    <section className="animate-slide-up">
                        <h2 className="text-[10px] font-light mb-10 tracking-[0.3em] text-muted-foreground/50 uppercase text-center">
                            {t('home.recentActivity')}
                        </h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {trainings.slice(0, 3).map((training, index) => (
                                <motion.div
                                    key={training.id}
                                    initial={{ opacity: 0, y: 30 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: index * 0.1, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                                    className="bg-white/[0.03] border border-white/[0.08] p-6 rounded-[2rem] flex flex-col justify-between items-start hover:bg-white/[0.08] hover:border-white/20 hover:shadow-[0_8px_32px_rgba(0,0,0,0.3)] hover:-translate-y-1 transition-all duration-300 ease-out cursor-default group h-full"
                                >
                                    <div className="w-full mb-4">
                                        <div className="flex justify-between items-start mb-2">
                                            <p className="font-bold text-xl tracking-tight group-hover:text-white transition-colors duration-300 line-clamp-2">
                                                {training.technique}
                                            </p>
                                            <p className="text-[10px] font-bold tracking-widest text-muted-foreground/60 whitespace-nowrap ml-2">
                                                {new Date(training.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                                            </p>
                                        </div>
                                        <p className="text-sm text-muted-foreground/80 font-body leading-relaxed line-clamp-3">
                                            {training.notes || t('home.noNotes')}
                                        </p>
                                    </div>
                                    <div className="w-full flex justify-between items-end mt-auto">
                                        <div className="flex gap-2">
                                            {training.type && (
                                                <div className="inline-flex items-center bg-white/10 border border-white/20 px-3 py-1 rounded-full">
                                                    <p className="text-[10px] font-bold text-white tracking-wider uppercase">
                                                        {t(`trainingTypes.${training.type}`)}
                                                    </p>
                                                </div>
                                            )}
                                        </div>
                                        <div className="inline-flex items-center bg-accent/10 border border-accent/20 px-3 py-1 rounded-full group-hover:bg-accent/20 group-hover:shadow-glow transition-all duration-300">
                                            <p className="text-[10px] font-black text-accent tracking-wider">
                                                {training.duration} MIN
                                            </p>
                                        </div>
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    </section>
                )}
            </div>

            <SuccessAnimation
                isVisible={showSuccess}
                onComplete={() => setShowSuccess(false)}
            />
        </>
    );
};
