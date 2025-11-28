import React, { useState, useEffect } from 'react';
import { X, Send, Loader2, Brain } from 'lucide-react';
import { useLocalStorage } from '../hooks/useLocalStorage';
import { getTrainingSuggestion } from '../lib/gemini';
import type { Training } from '../types';
import { motion, AnimatePresence } from 'framer-motion';

interface Message {
    id: string;
    type: 'user' | 'ai';
    content: string;
    timestamp: Date;
}

export const FloatingAiCoach: React.FC = () => {
    const [trainings] = useLocalStorage<Training[]>('bjj-trainings', []);
    const [belt] = useLocalStorage<string>('bjj-belt', 'white');
    const [mainAcademy] = useLocalStorage<string>('bjj-main-academy', '');

    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState<Message[]>([]);
    const [loading, setLoading] = useState(false);
    const [hasGreeted, setHasGreeted] = useState(false);

    // Send greeting on first open
    useEffect(() => {
        if (isOpen && !hasGreeted && trainings.length > 0) {
            setHasGreeted(true);
            const latestTraining = trainings[0];

            const greetingMessage: Message = {
                id: Date.now().toString(),
                type: 'ai',
                content: `Olá! Vi que você treinou ${latestTraining.technique} por ${latestTraining.duration} minutos. Quer uma dica para o próximo treino?`,
                timestamp: new Date()
            };

            setMessages([greetingMessage]);
        } else if (isOpen && !hasGreeted && trainings.length === 0) {
            setHasGreeted(true);
            const greetingMessage: Message = {
                id: Date.now().toString(),
                type: 'ai',
                content: 'Olá! Ainda não vi treinos registrados. Quando treinar, volte aqui para dicas personalizadas!',
                timestamp: new Date()
            };
            setMessages([greetingMessage]);
        }
    }, [isOpen, hasGreeted, trainings]);

    const sendMessage = async (userMessage: string) => {
        // Add user message
        const newUserMessage: Message = {
            id: Date.now().toString(),
            type: 'user',
            content: userMessage,
            timestamp: new Date()
        };

        setMessages(prev => [...prev, newUserMessage]);
        setLoading(true);

        try {
            const suggestion = await getTrainingSuggestion(trainings, belt, mainAcademy);

            const aiResponse: Message = {
                id: (Date.now() + 1).toString(),
                type: 'ai',
                content: `**${suggestion.focus}**\n\n${suggestion.reasoning}\n\n**Técnicas sugeridas:**\n${suggestion.suggestedTechniques.map(t => `• ${t}`).join('\n')}`,
                timestamp: new Date()
            };

            setMessages(prev => [...prev, aiResponse]);
        } catch (error) {
            const errorMessage: Message = {
                id: (Date.now() + 1).toString(),
                type: 'ai',
                content: 'Desculpe, tive um problema para gerar a sugestão. Tente novamente!',
                timestamp: new Date()
            };
            setMessages(prev => [...prev, errorMessage]);
        } finally {
            setLoading(false);
        }
    };

    const quickActions = [
        { label: 'Dica para hoje', action: () => sendMessage('Me dê uma dica para o treino de hoje') },
        { label: 'Análise do progresso', action: () => sendMessage('Como está meu progresso?') },
        { label: 'Técnicas recomendadas', action: () => sendMessage('Que técnicas devo focar?') }
    ];

    return (
        <>
            {/* Floating Button */}
            <AnimatePresence>
                {!isOpen && (
                    <motion.button
                        initial={{ scale: 0, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0, opacity: 0 }}
                        onClick={() => setIsOpen(true)}
                        className="fixed bottom-6 right-6 z-50 w-16 h-16 bg-gradient-to-br from-accent to-accent/80 rounded-full shadow-2xl flex items-center justify-center hover:scale-110 transition-transform group"
                    >
                        <Brain className="w-8 h-8 text-black" />
                        <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-background animate-pulse" />
                    </motion.button>
                )}
            </AnimatePresence>

            {/* Chat Window */}
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: 20, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 20, scale: 0.95 }}
                        className="fixed bottom-6 right-6 z-50 w-96 h-[600px] bg-gradient-to-br from-black to-[#1a1a1a] rounded-2xl shadow-2xl border border-white/10 flex flex-col overflow-hidden"
                    >
                        {/* Header */}
                        <div className="bg-gradient-to-r from-accent to-accent/80 p-4 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-black/20 rounded-full flex items-center justify-center">
                                    <Brain className="w-6 h-6 text-black" />
                                </div>
                                <div>
                                    <h3 className="font-black text-black">AI Coach</h3>
                                    <p className="text-xs text-black/70">Seu assistente de treino</p>
                                </div>
                            </div>
                            <button
                                onClick={() => setIsOpen(false)}
                                className="w-8 h-8 rounded-full bg-black/20 hover:bg-black/30 flex items-center justify-center transition-colors"
                            >
                                <X className="w-5 h-5 text-black" />
                            </button>
                        </div>

                        {/* Messages */}
                        <div className="flex-1 overflow-y-auto p-4 space-y-4">
                            {messages.map((message) => (
                                <div
                                    key={message.id}
                                    className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
                                >
                                    <div
                                        className={`max-w-[80%] rounded-2xl p-3 ${message.type === 'user'
                                            ? 'bg-accent text-black'
                                            : 'bg-white/5 text-white border border-white/10'
                                            }`}
                                    >
                                        <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                                        <p className={`text-[10px] mt-1 ${message.type === 'user' ? 'text-black/60' : 'text-white/40'}`}>
                                            {message.timestamp.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                                        </p>
                                    </div>
                                </div>
                            ))}

                            {loading && (
                                <div className="flex justify-start">
                                    <div className="bg-white/5 border border-white/10 rounded-2xl p-3">
                                        <Loader2 className="w-5 h-5 text-accent animate-spin" />
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Quick Actions */}
                        {messages.length <= 1 && !loading && (
                            <div className="p-4 border-t border-white/10 space-y-2">
                                <p className="text-xs text-muted-foreground mb-2">Perguntas rápidas:</p>
                                <div className="flex flex-wrap gap-2">
                                    {quickActions.map((action, i) => (
                                        <button
                                            key={i}
                                            onClick={action.action}
                                            className="px-3 py-1.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-xs text-white transition-colors"
                                        >
                                            {action.label}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Input */}
                        <div className="p-4 border-t border-white/10">
                            <div className="flex items-center gap-2">
                                <input
                                    type="text"
                                    placeholder="Pergunte algo..."
                                    className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-sm text-white placeholder-muted-foreground focus:outline-none focus:border-accent"
                                    onKeyPress={(e) => {
                                        if (e.key === 'Enter' && e.currentTarget.value.trim()) {
                                            sendMessage(e.currentTarget.value);
                                            e.currentTarget.value = '';
                                        }
                                    }}
                                />
                                <button className="w-10 h-10 bg-accent rounded-xl flex items-center justify-center hover:scale-105 transition-transform">
                                    <Send className="w-5 h-5 text-black" />
                                </button>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
};
