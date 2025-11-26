import { useState, useEffect, useRef } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { Play, Pause, RotateCcw, Settings, Volume2, VolumeX } from 'lucide-react';

export const TimerPage = () => {
    const { t } = useLanguage();
    const [timeLeft, setTimeLeft] = useState(300); // 5 min default
    const [isActive, setIsActive] = useState(false);
    const [isResting, setIsResting] = useState(false);
    const [round, setRound] = useState(1);
    const [roundTime, setRoundTime] = useState(300); // 5 min
    const [restTime, setRestTime] = useState(60); // 1 min
    const [soundEnabled, setSoundEnabled] = useState(true);

    const audioContextRef = useRef<AudioContext | null>(null);

    useEffect(() => {
        let interval: ReturnType<typeof setInterval> | null = null;

        if (isActive && timeLeft > 0) {
            interval = setInterval(() => {
                setTimeLeft((prev) => prev - 1);
            }, 1000);
        } else if (isActive && timeLeft === 0) {
            playBeep(true);
            if (isResting) {
                setIsResting(false);
                setTimeLeft(roundTime);
                setRound((prev) => prev + 1);
            } else {
                setIsResting(true);
                setTimeLeft(restTime);
            }
        }

        return () => {
            if (interval) clearInterval(interval);
        };
    }, [isActive, timeLeft, isResting, roundTime, restTime]);

    const toggleTimer = () => {
        setIsActive(!isActive);
        if (!isActive) playBeep(false);
    };

    const resetTimer = () => {
        setIsActive(false);
        setIsResting(false);
        setRound(1);
        setTimeLeft(roundTime);
    };

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
    };

    const playBeep = (long: boolean) => {
        if (!soundEnabled) return;

        if (!audioContextRef.current) {
            audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
        }

        const ctx = audioContextRef.current;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.type = 'sine';
        osc.frequency.setValueAtTime(long ? 440 : 880, ctx.currentTime);
        gain.gain.setValueAtTime(0.1, ctx.currentTime);

        osc.start();
        osc.stop(ctx.currentTime + (long ? 1 : 0.1));
    };

    return (
        <div className="space-y-12 pt-8 text-center">
            <div className="space-y-2">
                <h1 className="text-4xl font-black tracking-[-0.02em] bg-gradient-to-b from-white via-white to-white/40 bg-clip-text text-transparent">
                    {t('timer.title')}
                </h1>
                <div className="flex justify-center items-center gap-4 text-sm font-bold tracking-widest uppercase">
                    <span className={!isResting ? 'text-accent animate-pulse' : 'text-muted-foreground'}>
                        {t('timer.rolling')}
                    </span>
                    <span className="text-muted-foreground/30">|</span>
                    <span className={isResting ? 'text-red-500 animate-pulse' : 'text-muted-foreground'}>
                        {t('timer.resting')}
                    </span>
                </div>
            </div>

            {/* Timer Display */}
            <div className="relative w-64 h-64 mx-auto flex items-center justify-center">
                <div className={`absolute inset-0 rounded-full border-4 ${isResting ? 'border-red-500/20' : 'border-accent/20'} animate-pulse`} />
                <div className={`absolute inset-4 rounded-full border-2 ${isResting ? 'border-red-500/10' : 'border-accent/10'}`} />

                <div className="space-y-2">
                    <p className={`text-7xl font-black tabular-nums tracking-tighter ${isResting ? 'text-red-500' : 'text-white'}`}>
                        {formatTime(timeLeft)}
                    </p>
                    <p className="text-sm font-bold tracking-widest uppercase text-muted-foreground">
                        {t('timer.round')} {round}
                    </p>
                </div>
            </div>

            {/* Controls */}
            <div className="flex justify-center gap-6">
                <button
                    onClick={toggleTimer}
                    className={`w-20 h-20 rounded-full flex items-center justify-center transition-all duration-300 ${isActive
                        ? 'bg-red-500/20 text-red-500 hover:bg-red-500/30'
                        : 'bg-accent text-black hover:scale-105 shadow-[0_0_30px_rgba(0,255,255,0.3)]'
                        }`}
                >
                    {isActive ? <Pause className="w-8 h-8 fill-current" /> : <Play className="w-8 h-8 fill-current ml-1" />}
                </button>

                <button
                    onClick={resetTimer}
                    className="w-20 h-20 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-all duration-300"
                >
                    <RotateCcw className="w-8 h-8" />
                </button>
            </div>

            {/* Settings */}
            <div className="bg-white/[0.03] border border-white/[0.08] rounded-[2rem] p-6 space-y-6">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <Settings className="w-5 h-5 text-accent" />
                        <h3 className="text-sm font-bold tracking-widest uppercase text-muted-foreground/80">
                            Config
                        </h3>
                    </div>
                    <button onClick={() => setSoundEnabled(!soundEnabled)}>
                        {soundEnabled ? <Volume2 className="w-5 h-5 text-accent" /> : <VolumeX className="w-5 h-5 text-muted-foreground" />}
                    </button>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <label className="text-xs font-bold uppercase text-muted-foreground">{t('timer.round')}</label>
                        <div className="flex gap-2 justify-center">
                            {[5, 6, 7, 10].map(min => (
                                <button
                                    key={min}
                                    onClick={() => { setRoundTime(min * 60); if (!isActive && !isResting) setTimeLeft(min * 60); }}
                                    className={`px-3 py-2 rounded-lg text-xs font-bold transition-all ${roundTime === min * 60 ? 'bg-accent text-black' : 'bg-white/5 hover:bg-white/10'
                                        }`}
                                >
                                    {min}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-xs font-bold uppercase text-muted-foreground">{t('timer.rest')}</label>
                        <div className="flex gap-2 justify-center">
                            {[30, 60, 90].map(sec => (
                                <button
                                    key={sec}
                                    onClick={() => setRestTime(sec)}
                                    className={`px-3 py-2 rounded-lg text-xs font-bold transition-all ${restTime === sec ? 'bg-red-500 text-white' : 'bg-white/5 hover:bg-white/10'
                                        }`}
                                >
                                    {sec}s
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
