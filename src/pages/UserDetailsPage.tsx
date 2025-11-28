import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { ArrowLeft, Calendar, Clock, TrendingUp, Building2 } from 'lucide-react';
import { getBeltColor } from '../lib/beltUtils';
import type { Profile } from '../types';

interface Training {
    id: string;
    date: string;
    duration: number;
    technique: string;
    notes: string;
    academy: string;
}

interface AcademyMember {
    id: string;
    academy_id: string;
    status: string;
    joined_at: string;
    academies: {
        id: string;
        name: string;
        join_code: string;
    };
}

export default function UserDetailsPage() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [profile, setProfile] = useState<Profile | null>(null);
    const [trainings, setTrainings] = useState<Training[]>([]);
    const [academies, setAcademies] = useState<AcademyMember[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (id) {
            fetchUserData();
        }
    }, [id]);

    const fetchUserData = async () => {
        if (!id) return;

        try {
            // Fetch profile
            const { data: profileData } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', id)
                .single();

            setProfile(profileData);

            // Fetch trainings
            const { data: trainingsData } = await supabase
                .from('trainings')
                .select('*')
                .eq('user_id', id)
                .order('date', { ascending: false });

            setTrainings(trainingsData || []);

            // Fetch academy memberships
            const { data: academiesData } = await supabase
                .from('academy_members')
                .select('*, academies(*)')
                .eq('user_id', id);

            setAcademies(academiesData || []);
        } catch (error) {
            console.error('Error fetching user data:', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-background flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-accent mx-auto mb-4"></div>
                    <p className="text-muted-foreground">Carregando...</p>
                </div>
            </div>
        );
    }

    if (!profile) {
        return (
            <div className="min-h-screen bg-background flex items-center justify-center">
                <div className="text-center">
                    <h2 className="text-2xl font-bold text-white mb-2">Usuário não encontrado</h2>
                    <button
                        onClick={() => navigate('/admin')}
                        className="text-accent hover:underline"
                    >
                        Voltar ao Admin
                    </button>
                </div>
            </div>
        );
    }

    // Calculate statistics
    const totalTrainings = trainings.length;
    const totalMinutes = trainings.reduce((sum, t) => sum + (Number(t.duration) || 0), 0);
    const totalHours = totalMinutes / 60;
    const avgDuration = totalTrainings > 0 ? totalHours / totalTrainings : 0;

    console.log('User Stats Debug:', {
        totalTrainings,
        totalMinutes,
        totalHours,
        avgDuration,
        sampleTraining: trainings[0]
    });



    return (
        <div className="min-h-screen bg-background">
            {/* Header */}
            <div className="bg-gradient-to-r from-primary to-primary/80 text-white p-6">
                <button
                    onClick={() => navigate('/admin')}
                    className="flex items-center gap-2 text-white/80 hover:text-white mb-4"
                >
                    <ArrowLeft className="w-4 h-4" />
                    Voltar ao Admin
                </button>

                <div className="max-w-6xl mx-auto flex items-center gap-6">
                    <img
                        src={profile.avatar_url || '/default-avatar.png'}
                        alt={profile.name}
                        className="w-24 h-24 rounded-full object-cover border-4 border-white/20"
                        onError={(e) => {
                            e.currentTarget.src = '/default-avatar.png';
                        }}
                    />
                    <div>
                        <h1 className="text-3xl font-black mb-2">{profile.name}</h1>
                        <div className="flex items-center gap-3">
                            <span className={`px-3 py-1 rounded-full text-sm font-bold ${getBeltColor(profile.belt)}`}>
                                {profile.belt.toUpperCase()}
                            </span>
                            {profile.degrees > 0 && (
                                <span className="text-white/80">
                                    {profile.degrees} {profile.degrees === 1 ? 'grau' : 'graus'}
                                </span>
                            )}
                            <span className="text-white/60">•</span>
                            <span className="text-white/80 capitalize">{profile.role}</span>
                        </div>
                    </div>
                </div>
            </div>

            <div className="max-w-6xl mx-auto p-6">
                {/* Statistics Cards */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
                    <div className="bg-white/5 border border-white/10 rounded-xl p-4">
                        <div className="flex items-center gap-3 mb-2">
                            <Calendar className="w-8 h-8 text-accent" />
                            <div>
                                <p className="text-2xl font-black text-white">{totalTrainings}</p>
                                <p className="text-xs text-muted-foreground">Total de Treinos</p>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white/5 border border-white/10 rounded-xl p-4">
                        <div className="flex items-center gap-3 mb-2">
                            <Clock className="w-8 h-8 text-blue-400" />
                            <div>
                                <p className="text-2xl font-black text-white">{totalHours.toFixed(1)}h</p>
                                <p className="text-xs text-muted-foreground">Horas Totais</p>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white/5 border border-white/10 rounded-xl p-4">
                        <div className="flex items-center gap-3 mb-2">
                            <TrendingUp className="w-8 h-8 text-green-400" />
                            <div>
                                <p className="text-2xl font-black text-white">{avgDuration.toFixed(1)}h</p>
                                <p className="text-xs text-muted-foreground">Média por Treino</p>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white/5 border border-white/10 rounded-xl p-4">
                        <div className="flex items-center gap-3 mb-2">
                            <Building2 className="w-8 h-8 text-purple-400" />
                            <div>
                                <p className="text-2xl font-black text-white">{academies.length}</p>
                                <p className="text-xs text-muted-foreground">Academias</p>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Academies */}
                    <div className="bg-white/5 border border-white/10 rounded-xl p-6">
                        <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                            <Building2 className="w-5 h-5" />
                            Academias
                        </h2>
                        <div className="space-y-3">
                            {academies.map((membership) => (
                                <div
                                    key={membership.id}
                                    className="bg-white/5 border border-white/10 rounded-lg p-4 hover:bg-white/10 transition-colors cursor-pointer"
                                    onClick={() => navigate(`/academy/${membership.academy_id}`)}
                                >
                                    <p className="font-bold text-white">{membership.academies.name}</p>
                                    <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                                        <span className={`px-2 py-0.5 rounded ${membership.status === 'active'
                                            ? 'bg-green-500/20 text-green-400'
                                            : 'bg-yellow-500/20 text-yellow-400'
                                            }`}>
                                            {membership.status}
                                        </span>
                                        <span>•</span>
                                        <span>Entrou: {new Date(membership.joined_at).toLocaleDateString('pt-BR')}</span>
                                    </div>
                                </div>
                            ))}
                            {academies.length === 0 && (
                                <p className="text-center py-8 text-muted-foreground">
                                    Não participa de nenhuma academia ainda
                                </p>
                            )}
                        </div>
                    </div>

                    {/* Recent Trainings */}
                    <div className="bg-white/5 border border-white/10 rounded-xl p-6">
                        <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                            <Calendar className="w-5 h-5" />
                            Treinos Recentes
                        </h2>
                        <div className="space-y-3 max-h-96 overflow-y-auto">
                            {trainings.slice(0, 10).map((training) => (
                                <div
                                    key={training.id}
                                    className="bg-white/5 border border-white/10 rounded-lg p-4"
                                >
                                    <div className="flex items-center justify-between mb-2">
                                        <p className="font-bold text-white">{training.technique}</p>
                                        <span className="text-xs text-muted-foreground">
                                            {training.duration} min
                                        </span>
                                    </div>
                                    <p className="text-sm text-muted-foreground mb-1">{training.notes}</p>
                                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                        <span>{new Date(training.date).toLocaleDateString('pt-BR')}</span>
                                        <span>•</span>
                                        <span>{training.academy}</span>
                                    </div>
                                </div>
                            ))}
                            {trainings.length === 0 && (
                                <p className="text-center py-8 text-muted-foreground">
                                    Nenhum treino registrado ainda
                                </p>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
