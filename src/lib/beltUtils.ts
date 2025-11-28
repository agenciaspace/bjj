/**
 * Belt translation utilities
 * Maps English belt colors to Portuguese
 */

export type BeltColor = 'white' | 'blue' | 'purple' | 'brown' | 'black';

export const BELT_TRANSLATIONS: Record<BeltColor, string> = {
    white: 'Branca',
    blue: 'Azul',
    purple: 'Roxa',
    brown: 'Marrom',
    black: 'Preta'
};

export function translateBelt(belt: string): string {
    const normalizedBelt = belt.toLowerCase() as BeltColor;
    return BELT_TRANSLATIONS[normalizedBelt] || belt;
}

export function getBeltColor(belt: string): string {
    const colors: Record<string, string> = {
        white: 'bg-white text-black',
        blue: 'bg-blue-600',
        purple: 'bg-purple-600',
        brown: 'bg-amber-800',
        black: 'bg-black'
    };
    return colors[belt.toLowerCase()] || 'bg-gray-500';
}
