import React, { createContext, useContext, type ReactNode } from 'react';
import { useLocalStorage } from '../hooks/useLocalStorage';
import ptTranslations from '../locales/pt.json';
import enTranslations from '../locales/en.json';

type Language = 'pt' | 'en';

interface LanguageContextType {
    language: Language;
    setLanguage: (lang: Language) => void;
    t: (key: string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

const translations = {
    pt: ptTranslations,
    en: enTranslations,
};

export const LanguageProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const getInitialLanguage = (): Language => {
        if (typeof window === 'undefined') return 'pt';

        // Check localStorage first (manual override)
        const saved = window.localStorage.getItem('bjj-language');
        if (saved) return JSON.parse(saved);

        // Auto-detect from browser
        const browserLang = navigator.language.toLowerCase();
        return browserLang.startsWith('pt') ? 'pt' : 'en';
    };

    const [language, setLanguage] = useLocalStorage<Language>('bjj-language', getInitialLanguage());

    const t = (key: string): string => {
        const keys = key.split('.');
        let value: any = translations[language];

        for (const k of keys) {
            value = value?.[k];
        }

        return value || key;
    };

    return (
        <LanguageContext.Provider value={{ language, setLanguage, t }}>
            {children}
        </LanguageContext.Provider>
    );
};

export const useLanguage = () => {
    const context = useContext(LanguageContext);
    if (!context) {
        throw new Error('useLanguage must be used within LanguageProvider');
    }
    return context;
};
