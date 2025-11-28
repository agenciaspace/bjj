import { GoogleGenerativeAI } from '@google/generative-ai';
import type { Training } from '../types';

// Initialize the API client
// Note: In a real production app, you should proxy this through a backend to hide the key.
// For this PWA/Client-side demo, we use the env var directly.
const API_KEY = import.meta.env.VITE_GEMINI_API_KEY;

let genAI: GoogleGenerativeAI | null = null;

if (API_KEY && !API_KEY.includes('placeholder')) {
    genAI = new GoogleGenerativeAI(API_KEY);
}

export interface AiSuggestion {
    focus: string;
    reasoning: string;
    suggestedTechniques: string[];
}

export const getTrainingSuggestion = async (
    trainings: Training[],
    belt: string,
    mainAcademy: string
): Promise<AiSuggestion> => {
    if (!genAI) {
        throw new Error('Gemini API Key not configured');
    }

    // Use gemini-1.5-flash-latest (alias for latest flash model)
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash-latest' });

    // Prepare context from history
    const recentTrainings = trainings
        .slice(0, 5)
        .map(t => `${t.date}: ${t.type} (${t.duration}min) - Focus: ${t.technique}`)
        .join('\n');

    const prompt = `
        You are an expert Brazilian Jiu-Jitsu coach.
        
        My Profile:
        - Belt: ${belt}
        - Academy: ${mainAcademy}
        
        My Recent Trainings:
        ${recentTrainings || 'No recent trainings recorded.'}
        
        Based on this history and my belt level, suggest a specific training focus for my next session.
        If I haven't trained recently, motivate me.
        If I've been training a lot of one thing (e.g. Gi), maybe suggest No-Gi or specific complementary techniques.
        
        Format the response strictly as JSON with the following structure:
        {
            "focus": "Short title of the focus area (e.g. 'Guard Retention')",
            "reasoning": "One or two sentences explaining why this is good for me now.",
            "suggestedTechniques": ["Technique 1", "Technique 2", "Technique 3"]
        }
    `;

    try {
        console.log('🤖 Gemini API Request:', {
            model: 'gemini-pro',
            trainingsCount: trainings.length,
            belt,
            mainAcademy
        });

        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text();

        console.log('✅ Gemini API Response:', text.substring(0, 200));

        // Clean up markdown code blocks if present
        const jsonStr = text.replace(/```json/g, '').replace(/```/g, '').trim();

        return JSON.parse(jsonStr) as AiSuggestion;
    } catch (error: any) {
        console.error('❌ Gemini API Error Details:', {
            message: error.message,
            stack: error.stack,
            fullError: error
        });

        // Improve error message for user
        if (error.message?.includes('API key') || error.message?.includes('Invalid')) {
            throw new Error('Chave da API Gemini inválida. Verifique sua configuração.');
        } else if (error.message?.includes('quota')) {
            throw new Error('Cota da API Gemini excedida. Tente novamente mais tarde.');
        } else if (error.message?.includes('404') || error.message?.includes('not found')) {
            throw new Error('Modelo Gemini não encontrado. Verifique a configuração da API.');
        }
        throw new Error(`Erro ao gerar sugestão: ${error.message || 'Erro desconhecido'}`);
    }
};
