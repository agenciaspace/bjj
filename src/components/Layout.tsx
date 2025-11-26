import { User } from 'lucide-react';
import { Link, NavLink } from 'react-router-dom';
import { useLanguage } from '../contexts/LanguageContext';

interface LayoutProps {
    children: React.ReactNode;
}

export const Layout: React.FC<LayoutProps> = ({ children }) => {
    const { t } = useLanguage();

    const navItems = [
        { to: '/', label: t('nav.home') },
        { to: '/checkin', label: t('nav.checkin') },
        { to: '/timer', label: t('timer.title') },
        { to: '/trainings', label: t('nav.trainings') },
        { to: '/profile', label: t('nav.profile') },
    ];

    return (
        <div className="min-h-screen text-foreground flex flex-col font-sans selection:bg-accent selection:text-black items-center">
            <header className="fixed top-0 left-0 right-0 z-[100] flex items-center justify-center pointer-events-none md:pointer-events-auto md:bg-black/50 md:backdrop-blur-xl md:border-b md:border-white/5 pt-6 md:pt-0 md:h-20 transition-all">
                <div className="w-full max-w-7xl px-6 flex items-center justify-between pointer-events-auto">
                    {/* Brand */}
                    <div className="flex items-center gap-4 bg-black/50 backdrop-blur-2xl border border-white/10 rounded-full py-3 px-6 shadow-2xl md:bg-transparent md:border-none md:shadow-none md:p-0">
                        <Link to="/" className="text-xl font-black tracking-tighter hover:text-white/80 transition-colors">
                            MY-BJJ
                        </Link>
                    </div>

                    {/* Desktop Nav */}
                    <nav className="hidden md:flex items-center gap-8">
                        {navItems.map(({ to, label }) => (
                            <NavLink
                                key={to}
                                to={to}
                                className={({ isActive }) =>
                                    `text-sm font-bold tracking-widest uppercase transition-colors hover:text-accent ${isActive ? 'text-accent' : 'text-muted-foreground'
                                    }`
                                }
                            >
                                {label}
                            </NavLink>
                        ))}
                    </nav>

                    {/* Mobile Profile Link */}
                    <Link
                        to="/profile"
                        className="md:hidden w-10 h-10 rounded-full bg-white text-black flex items-center justify-center hover:scale-105 transition-transform active:scale-95 shadow-lg shadow-white/10"
                    >
                        <User className="w-5 h-5" />
                    </Link>
                </div>
            </header>

            <main className="flex-1 pt-32 px-6 pb-28 md:pb-12 w-full max-w-7xl animate-fade-in">
                {children}
            </main>

            <footer className="w-full max-w-7xl py-8 text-center text-[10px] uppercase tracking-widest text-muted-foreground opacity-40 mt-auto pb-safe hover:opacity-60 transition-opacity">
                <p>© {new Date().getFullYear()} MY-BJJ</p>
            </footer>
        </div>
    );
};
