import { Trophy, Zap, Star, Crown, Sun, Moon } from 'lucide-react';

export interface Achievement {
    id: string;
    titleKey: string;
    descKey: string;
    icon: any;
    check: (trainings: any[], checkIns: any[]) => boolean;
}

export const achievements: Achievement[] = [
    {
        id: 'first_step',
        titleKey: 'achievementsList.firstStep',
        descKey: 'achievementsList.firstStepDesc',
        icon: Star,
        check: (trainings) => trainings.length >= 1,
    },
    {
        id: 'consistent',
        titleKey: 'achievementsList.consistent',
        descKey: 'achievementsList.consistentDesc',
        icon: Zap,
        check: (trainings) => trainings.length >= 10,
    },
    {
        id: 'dedicated',
        titleKey: 'achievementsList.dedicated',
        descKey: 'achievementsList.dedicatedDesc',
        icon: Trophy,
        check: (trainings) => trainings.length >= 50,
    },
    {
        id: 'master',
        titleKey: 'achievementsList.master',
        descKey: 'achievementsList.masterDesc',
        icon: Crown,
        check: (trainings) => trainings.length >= 100,
    },
    {
        id: 'early_bird',
        titleKey: 'achievementsList.earlyBird',
        descKey: 'achievementsList.earlyBirdDesc',
        icon: Sun,
        check: (trainings) => trainings.some(t => {
            const hour = new Date(t.date).getHours();
            return hour < 8;
        }),
    },
    {
        id: 'night_owl',
        titleKey: 'achievementsList.nightOwl',
        descKey: 'achievementsList.nightOwlDesc',
        icon: Moon,
        check: (trainings) => trainings.some(t => {
            const hour = new Date(t.date).getHours();
            return hour >= 20;
        }),
    },
];
