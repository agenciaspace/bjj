import React from 'react';
import { NavLink } from 'react-router-dom';
import { Home, CheckCircle, BarChart3, User, Timer } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';

export const BottomNav: React.FC = () => {
    const { t } = useLanguage();

    const navItems = [
        { to: '/', icon: Home, label: t('nav.home') },
        { to: '/checkin', icon: CheckCircle, label: t('nav.checkin') },
        { to: '/timer', icon: Timer, label: t('timer.title') },
        { to: '/trainings', icon: BarChart3, label: t('nav.trainings') },
        { to: '/profile', icon: User, label: t('nav.profile') },
    ];

    return (
        <nav className="fixed bottom-0 left-0 right-0 z-50 bg-black/60 backdrop-blur-2xl border-t border-white/10 pb-safe md:hidden">
            <div className="max-w-md mx-auto flex items-center justify-around h-16 md:h-18 px-2">
                {navItems.map(({ to, icon: Icon, label }) => (
                    <NavLink
                        key={to}
                        to={to}
                        className={({ isActive }) =>
                            `flex flex-col items-center justify-center gap-1 px-4 py-2 rounded-2xl transition-all duration-300 min-w-[64px] ${isActive
                                ? 'text-accent scale-105'
                                : 'text-muted-foreground hover:text-white hover:scale-105'
                            }`
                        }
                    >
                        {({ isActive }) => (
                            <>
                                <Icon className={`w-5 h-5 transition-all ${isActive ? 'drop-shadow-glow' : ''}`} />
                                <span className="text-[10px] font-bold tracking-wider uppercase">{label}</span>
                            </>
                        )}
                    </NavLink>
                ))}
            </div>
        </nav>
    );
};
