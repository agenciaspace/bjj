import React, { useState, useRef, useEffect } from 'react';
import { Calendar, Clock, Activity, ArrowRight, MapPin, Save, FileDown, Trash2, Dumbbell, ChevronDown, Check } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { useLocalStorage } from '../hooks/useLocalStorage';
import { motion, AnimatePresence } from 'framer-motion';
import type { Training, Template } from '../types';

interface TrainingFormProps {
    onSubmit: (data: Omit<Training, 'id'>) => void;
    initialData?: Training;
    buttonText?: string;
}

interface CustomSelectProps {
    value: string;
    onChange: (value: string) => void;
    options: { value: string; label: string }[];
    placeholder: string;
    icon: React.ElementType;
}

const CustomSelect: React.FC<CustomSelectProps> = ({ value, onChange, options, placeholder, icon: Icon }) => {
    const [isOpen, setIsOpen] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const selectedLabel = options.find(opt => opt.value === value)?.label;

    return (
        <div className="relative" ref={containerRef}>
            <button
                type="button"
                onClick={() => setIsOpen(!isOpen)}
                className={`w-full flex items-center bg-white/[0.03] rounded-[1.5rem] px-6 py-4 border transition-all duration-300 ease-out group ${isOpen ? 'border-accent/50 bg-white/[0.08] shadow-[0_0_20px_rgba(0,255,255,0.1)]' : 'border-white/[0.08] hover:bg-white/[0.05]'}`}
            >
                <Icon className={`w-5 h-5 mr-4 transition-colors duration-300 ${isOpen ? 'text-accent' : 'text-muted-foreground'}`} />
                <span className={`flex-1 text-left text-base font-medium tracking-wide ${value ? 'text-white' : 'text-muted-foreground/50'}`}>
                    {selectedLabel || placeholder}
                </span>
                <ChevronDown className={`w-4 h-4 text-muted-foreground transition-transform duration-300 ${isOpen ? 'rotate-180 text-accent' : ''}`} />
            </button>

            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 10, scale: 0.95 }}
                        transition={{ duration: 0.2 }}
                        className="absolute z-50 top-full left-0 right-0 mt-2 bg-[#0a0a0a] border border-white/10 rounded-2xl overflow-hidden shadow-2xl max-h-60 overflow-y-auto"
                    >
                        {options.map((option) => (
                            <button
                                key={option.value}
                                type="button"
                                onClick={() => {
                                    onChange(option.value);
                                    setIsOpen(false);
                                }}
                                className={`w-full flex items-center justify-between px-6 py-3 text-sm font-medium transition-colors ${value === option.value ? 'bg-accent/10 text-accent' : 'text-muted-foreground hover:bg-white/5 hover:text-white'}`}
                            >
                                {option.label}
                                {value === option.value && <Check className="w-4 h-4" />}
                            </button>
                        ))}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export const TrainingForm: React.FC<TrainingFormProps> = ({ onSubmit, initialData, buttonText }) => {
    const { t } = useLanguage();
    const [academies] = useLocalStorage<string[]>('bjj-academies', []);
    const [mainAcademy] = useLocalStorage<string>('bjj-main-academy', '');
    const [templates, setTemplates] = useLocalStorage<Template[]>('bjj-templates', []);
    const [formData, setFormData] = useState<Omit<Training, 'id'>>(initialData || {
        date: new Date().toISOString().split('T')[0],
        duration: '60',
        technique: '',
        notes: '',
        academy: mainAcademy || (academies.length > 0 ? academies[0] : ''),
        type: ''
    });

    const trainingTypes = [
        'gi', 'nogi', 'wrestling', 'judo', 'openMat', 'drill', 'competition', 'seminar'
    ];

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (navigator.vibrate) navigator.vibrate(50);
        onSubmit(formData);
        if (!initialData) {
            setFormData(prev => ({
                ...prev,
                technique: '',
                notes: '',
                type: ''
            }));
        }
    };

    const handleSaveTemplate = () => {
        const name = prompt(t('templates.templateName'));
        if (name) {
            const newTemplate: Template = {
                id: Date.now().toString(),
                name,
                data: {
                    duration: formData.duration,
                    technique: formData.technique,
                    notes: formData.notes,
                    academy: formData.academy,
                    type: formData.type
                }
            };
            setTemplates([...templates, newTemplate]);
            alert(t('templates.saved'));
        }
    };

    const handleLoadTemplate = (templateId: string) => {
        const template = templates.find(t => t.id === templateId);
        if (template) {
            setFormData(prev => ({
                ...prev,
                ...template.data
            }));
            if (navigator.vibrate) navigator.vibrate(50);
        }
    };

    const handleDeleteTemplate = (e: React.MouseEvent, templateId: string) => {
        e.stopPropagation();
        if (window.confirm(t('templates.confirmDelete'))) {
            setTemplates(templates.filter(t => t.id !== templateId));
        }
    };

    return (
        <div className="space-y-6">
            {/* Templates Section */}
            {!initialData && (
                <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                    <button
                        type="button"
                        onClick={handleSaveTemplate}
                        className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-xs font-bold uppercase tracking-wider whitespace-nowrap transition-all"
                    >
                        <Save className="w-4 h-4" />
                        {t('templates.saveTemplate')}
                    </button>
                    {templates.map(template => (
                        <div key={template.id} className="relative group">
                            <button
                                type="button"
                                onClick={() => handleLoadTemplate(template.id)}
                                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-accent/10 hover:bg-accent/20 text-accent text-xs font-bold uppercase tracking-wider whitespace-nowrap transition-all border border-accent/20"
                            >
                                <FileDown className="w-4 h-4" />
                                {template.name}
                            </button>
                            <button
                                type="button"
                                onClick={(e) => handleDeleteTemplate(e, template.id)}
                                className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                                <Trash2 className="w-3 h-3" />
                            </button>
                        </div>
                    ))}
                </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-7 w-full">
                <div className="space-y-5">
                    {/* Academy Selector */}
                    {academies.length > 0 && (
                        <div className="space-y-2">
                            <label className="text-[10px] font-light tracking-[0.25em] text-muted-foreground/60 uppercase block pl-5">
                                {t('profile.academies')}
                            </label>
                            <CustomSelect
                                value={formData.academy || ''}
                                onChange={(val) => setFormData({ ...formData, academy: val })}
                                options={academies.map(a => ({ value: a, label: a }))}
                                placeholder={t('profile.selectAcademy')}
                                icon={MapPin}
                            />
                        </div>
                    )}

                    {/* Training Type Selector */}
                    <div className="space-y-2">
                        <label className="text-[10px] font-light tracking-[0.25em] text-muted-foreground/60 uppercase block pl-5">
                            {t('form.type')}
                        </label>
                        <CustomSelect
                            value={formData.type || ''}
                            onChange={(val) => setFormData({ ...formData, type: val })}
                            options={trainingTypes.map(type => ({ value: type, label: t(`trainingTypes.${type}`) }))}
                            placeholder={t('form.selectType')}
                            icon={Dumbbell}
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="text-[10px] font-light tracking-[0.25em] text-muted-foreground/60 uppercase block pl-5">
                            {t('form.date')}
                        </label>
                        <div className="flex items-center bg-white/[0.03] rounded-[1.5rem] px-6 py-4 border border-white/[0.08] focus-within:border-accent/50 focus-within:bg-white/[0.08] focus-within:shadow-[0_0_20px_rgba(0,255,255,0.1)] transition-all duration-300 ease-out group">
                            <Calendar className="w-5 h-5 text-muted-foreground mr-4 group-focus-within:text-accent transition-colors duration-300" />
                            <input
                                type="date"
                                value={formData.date}
                                onChange={e => setFormData({ ...formData, date: e.target.value })}
                                className="w-full bg-transparent text-base focus:outline-none placeholder-muted-foreground/30 font-medium tracking-wide"
                                required
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-[10px] font-light tracking-[0.25em] text-muted-foreground/60 uppercase block pl-5">
                            {t('form.duration')}
                        </label>
                        <div className="flex items-center bg-white/[0.03] rounded-[1.5rem] px-6 py-4 border border-white/[0.08] focus-within:border-accent/50 focus-within:bg-white/[0.08] focus-within:shadow-[0_0_20px_rgba(0,255,255,0.1)] transition-all duration-300 ease-out group">
                            <Clock className="w-5 h-5 text-muted-foreground mr-4 group-focus-within:text-accent transition-colors duration-300" />
                            <input
                                type="number"
                                value={formData.duration}
                                onChange={e => setFormData({ ...formData, duration: e.target.value })}
                                className="w-full bg-transparent text-base focus:outline-none placeholder-muted-foreground/30 font-medium tracking-wide"
                                required
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-[10px] font-light tracking-[0.25em] text-muted-foreground/60 uppercase block pl-5">
                            {t('form.techniqueFocus')}
                        </label>
                        <div className="flex items-center bg-white/[0.03] rounded-[1.5rem] px-6 py-4 border border-white/[0.08] focus-within:border-accent/50 focus-within:bg-white/[0.08] focus-within:shadow-[0_0_20px_rgba(0,255,255,0.1)] transition-all duration-300 ease-out group">
                            <Activity className="w-5 h-5 text-muted-foreground mr-4 group-focus-within:text-accent transition-colors duration-300" />
                            <input
                                type="text"
                                value={formData.technique}
                                onChange={e => setFormData({ ...formData, technique: e.target.value })}
                                placeholder={t('form.techniquePlaceholder')}
                                className="w-full bg-transparent text-base focus:outline-none placeholder-muted-foreground/30 font-medium tracking-wide"
                                required
                            />
                        </div>
                    </div>

                    <div className="space-y-2 pt-2">
                        <label className="text-[10px] font-light tracking-[0.25em] text-muted-foreground/60 uppercase block pl-5">
                            {t('form.notes')}
                        </label>
                        <textarea
                            value={formData.notes}
                            onChange={e => setFormData({ ...formData, notes: e.target.value })}
                            placeholder={t('form.notesPlaceholder')}
                            className="w-full bg-white/[0.03] border border-white/[0.08] rounded-[1.5rem] p-6 text-base focus:outline-none focus:border-accent/50 focus:bg-white/[0.08] focus:shadow-[0_0_20px_rgba(0,255,255,0.1)] transition-all duration-300 ease-out min-h-[140px] resize-none leading-relaxed font-body"
                        />
                    </div>
                </div>

                <button
                    type="submit"
                    className="w-full bg-white text-black font-black py-5 rounded-[2rem] uppercase tracking-[0.25em] hover:scale-[1.02] hover:shadow-glow-lg hover:bg-gradient-to-r hover:from-white hover:to-gray-100 active:scale-[0.98] transition-all duration-300 ease-out flex items-center justify-center gap-3 shadow-[0_4px_24px_rgba(255,255,255,0.12)] mt-10 text-sm group"
                >
                    <span>{buttonText || t('form.logSession')}</span>
                    <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform duration-300" />
                </button>
            </form>
        </div>
    );
};
