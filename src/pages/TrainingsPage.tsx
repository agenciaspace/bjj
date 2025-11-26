import { useState } from 'react';
import { useLocalStorage } from '../hooks/useLocalStorage';
import { useLanguage } from '../contexts/LanguageContext';
import { BarChart, Bar, XAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { Activity, TrendingUp, Trash2, Pencil, MapPin, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { ConfirmModal } from '../components/ConfirmModal';
import { TrainingForm } from '../components/TrainingForm';
import type { Training } from '../types';

export const TrainingsPage = () => {
    const { t } = useLanguage();
    const [trainings, setTrainings] = useLocalStorage<Training[]>('bjj-trainings', []);
    const [deleteId, setDeleteId] = useState<number | null>(null);
    const [editingTraining, setEditingTraining] = useState<Training | null>(null);

    const handleDelete = (id: number) => {
        setDeleteId(id);
    };

    const confirmDelete = () => {
        if (deleteId) {
            setTrainings(trainings.filter(t => t.id !== deleteId));
            if (navigator.vibrate) navigator.vibrate(50);
            setDeleteId(null);
        }
    };

    const handleUpdate = (data: Omit<Training, 'id'>) => {
        if (editingTraining) {
            setTrainings(trainings.map(t =>
                t.id === editingTraining.id ? { ...data, id: editingTraining.id } : t
            ));
            setEditingTraining(null);
        }
    };

    // Calculate monthly stats
    const monthlyStats = trainings.reduce((acc: any, curr) => {
        const month = new Date(curr.date).toLocaleString('default', { month: 'short' });
        acc[month] = (acc[month] || 0) + 1;
        return acc;
    }, {});

    const chartData = Object.entries(monthlyStats).map(([name, sessions]) => ({
        name,
        sessions
    }));

    const totalMinutes = trainings.reduce((acc, training) => acc + parseInt(training.duration || '0'), 0);
    const totalHours = Math.floor(totalMinutes / 60);

    return (
        <div className="space-y-8 pb-20">
            <ConfirmModal
                isOpen={!!deleteId}
                onClose={() => setDeleteId(null)}
                onConfirm={confirmDelete}
                title={t('modal.confirmTitle')}
                message={t('trainings.deleteConfirm')}
            />

            <AnimatePresence>
                {editingTraining && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
                        onClick={() => setEditingTraining(null)}
                    >
                        <motion.div
                            initial={{ scale: 0.95, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.95, opacity: 0 }}
                            onClick={e => e.stopPropagation()}
                            className="bg-zinc-900 border border-white/10 rounded-[2rem] p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto relative"
                        >
                            <button
                                onClick={() => setEditingTraining(null)}
                                className="absolute top-4 right-4 p-2 rounded-full hover:bg-white/10 transition-colors"
                            >
                                <X className="w-5 h-5 text-muted-foreground" />
                            </button>

                            <h2 className="text-2xl font-black mb-6">{t('trainings.editTraining')}</h2>

                            <TrainingForm
                                initialData={editingTraining}
                                onSubmit={handleUpdate}
                                buttonText={t('trainings.updateSession')}
                            />
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            <header className="flex justify-between items-end pt-8">
                <div>
                    <h1 className="text-4xl font-black tracking-tighter mb-1">{t('trainings.title')}</h1>
                    <p className="text-muted-foreground text-sm uppercase tracking-widest">{t('trainings.sessions')}</p>
                </div>
                <div className="bg-accent/10 p-3 rounded-2xl">
                    <TrendingUp className="w-6 h-6 text-accent" />
                </div>
            </header>

            {/* Stats Overview */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-white/[0.03] border border-white/[0.08] p-6 rounded-[2rem]">
                    <p className="text-3xl font-black mb-1">{trainings.length}</p>
                    <p className="text-[10px] text-muted-foreground uppercase tracking-widest">{t('trainings.trained')}</p>
                </div>
                <div className="bg-white/[0.03] border border-white/[0.08] p-6 rounded-[2rem]">
                    <p className="text-3xl font-black mb-1">
                        {totalHours}h
                    </p>
                    <p className="text-[10px] text-muted-foreground uppercase tracking-widest">{t('profile.hoursTrained')}</p>
                </div>
            </div>

            {/* Chart */}
            {trainings.length > 0 && (
                <div className="bg-white/[0.03] border border-white/[0.08] p-6 rounded-[2rem] h-64 md:h-96">
                    <p className="text-[10px] text-muted-foreground uppercase tracking-widest mb-4">{t('trainings.monthlyProgress')}</p>
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={chartData}>
                            <XAxis
                                dataKey="name"
                                axisLine={false}
                                tickLine={false}
                                tick={{ fill: '#666', fontSize: 10 }}
                            />
                            <Tooltip
                                contentStyle={{ backgroundColor: '#000', border: '1px solid #333', borderRadius: '12px' }}
                                itemStyle={{ color: '#fff', fontSize: '12px' }}
                                cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                            />
                            <Bar dataKey="sessions" radius={[4, 4, 4, 4]}>
                                {chartData.map((_entry, index) => (
                                    <Cell key={`cell-${index}`} fill="cyan" fillOpacity={0.6} />
                                ))}
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            )}

            {/* List */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {trainings.length === 0 ? (
                    <div className="text-center py-12 opacity-50">
                        <Activity className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                        <p className="text-lg font-bold">{t('trainings.noTrainings')}</p>
                        <p className="text-sm">{t('trainings.startAdding')}</p>
                    </div>
                ) : (
                    trainings.map((training) => (
                        <motion.div
                            key={training.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="bg-white/[0.03] border border-white/[0.08] p-6 rounded-[2rem] space-y-4 relative group"
                        >
                            <div className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                                <button
                                    onClick={() => setEditingTraining(training)}
                                    className="p-2 bg-white/10 hover:bg-white/20 rounded-full text-white transition-colors"
                                >
                                    <Pencil className="w-4 h-4" />
                                </button>
                                <button
                                    onClick={() => handleDelete(training.id)}
                                    className="p-2 bg-red-500/10 hover:bg-red-500/20 rounded-full text-red-500 transition-colors"
                                >
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            </div>

                            <div className="flex justify-between items-start">
                                <div>
                                    <div className="flex items-center gap-2 mb-1">
                                        <span className="text-[10px] font-bold bg-white/10 px-2 py-1 rounded-md text-muted-foreground">
                                            {new Date(training.date).toLocaleDateString()}
                                        </span>
                                        {training.academy && (
                                            <span className="text-[10px] font-bold bg-accent/10 text-accent px-2 py-1 rounded-md flex items-center gap-1">
                                                <MapPin className="w-3 h-3" />
                                                {training.academy}
                                            </span>
                                        )}
                                        {training.type && (
                                            <span className="text-[10px] font-bold bg-purple-500/10 text-purple-400 px-2 py-1 rounded-md uppercase">
                                                {t(`trainingTypes.${training.type}`)}
                                            </span>
                                        )}
                                    </div>
                                    <h3 className="text-xl font-bold">{training.technique}</h3>
                                </div>
                                <div className="text-right">
                                    <span className="text-2xl font-black text-accent">{training.duration}</span>
                                    <span className="text-[10px] font-bold text-muted-foreground ml-1">{t('trainings.min')}</span>
                                </div>
                            </div>

                            {training.notes && (
                                <p className="text-sm text-muted-foreground/80 leading-relaxed border-t border-white/5 pt-4">
                                    {training.notes}
                                </p>
                            )}
                        </motion.div>
                    ))
                )}
            </div>
        </div>
    );
};
