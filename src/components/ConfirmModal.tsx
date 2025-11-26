import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, X } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';

interface ConfirmModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    title?: string;
    message?: string;
}

export const ConfirmModal: React.FC<ConfirmModalProps> = ({
    isOpen,
    onClose,
    onConfirm,
    title,
    message
}) => {
    const { t } = useLanguage();

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
                onClick={onClose}
            >
                <motion.div
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.9, opacity: 0 }}
                    className="bg-zinc-900 border border-white/10 rounded-[2rem] p-6 w-full max-w-sm relative shadow-2xl"
                    onClick={e => e.stopPropagation()}
                >
                    <button
                        onClick={onClose}
                        className="absolute top-4 right-4 p-2 text-muted-foreground hover:text-white transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>

                    <div className="flex flex-col items-center text-center space-y-4 pt-2">
                        <div className="w-12 h-12 rounded-full bg-red-500/10 flex items-center justify-center mb-2">
                            <AlertTriangle className="w-6 h-6 text-red-500" />
                        </div>

                        <h3 className="text-xl font-bold text-white">
                            {title || t('modal.confirmTitle')}
                        </h3>

                        <p className="text-muted-foreground text-sm leading-relaxed">
                            {message || t('modal.confirmDelete')}
                        </p>

                        <div className="flex gap-3 w-full pt-4">
                            <button
                                onClick={onClose}
                                className="flex-1 py-3 px-4 rounded-xl bg-white/5 hover:bg-white/10 text-white font-bold text-sm transition-all"
                            >
                                {t('modal.cancel')}
                            </button>
                            <button
                                onClick={() => {
                                    if (navigator.vibrate) navigator.vibrate(50);
                                    onConfirm();
                                }}
                                className="flex-1 py-3 px-4 rounded-xl bg-red-500 hover:bg-red-600 text-white font-bold text-sm transition-all shadow-lg shadow-red-500/20"
                            >
                                {t('modal.confirm')}
                            </button>
                        </div>
                    </div>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
};
