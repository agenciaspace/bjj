import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { Users, Award, ArrowLeft, Shield, UserCheck } from 'lucide-react';
import { translateBelt, getBeltColor } from '../lib/beltUtils';
import type { Academy, Profile } from '../types';

interface AcademyMember {
    id: string;
    academy_id: string;
    user_id: string;
    status: 'pending' | 'active';
    joined_at: string;
    profiles: Profile;
}

export default function AcademyPage() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [academy, setAcademy] = useState<Academy | null>(null);
    const [owner, setOwner] = useState<Profile | null>(null);
    const [members, setMembers] = useState<AcademyMember[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (id) {
            fetchAcademyData();
        }
    }, [id]);

    const fetchAcademyData = async () => {
        if (!id) return;

        try {
            // Fetch academy
            const { data: academyData } = await supabase
                .from('academies')
                .select('*')
                .eq('id', id)
                .single();

            if (academyData) {
                setAcademy(academyData);

                // Fetch owner
                const { data: ownerData } = await supabase
                    .from('profiles')
                    .select('*')
                    .eq('id', academyData.owner_id)
                    .single();

                setOwner(ownerData);
            }

            // Fetch members
            const { data: membersData } = await supabase
                .from('academy_members')
                .select('*, profiles(*)')
                .eq('academy_id', id)
                .eq('status', 'active');

            setMembers(membersData || []);
        } catch (error) {
            console.error('Error fetching academy:', error);
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

    if (!academy) {
        return (
            <div className="min-h-screen bg-background flex items-center justify-center">
                <div className="text-center">
                    <h2 className="text-2xl font-bold text-white mb-2">Academia não encontrada</h2>
                    <button
                        onClick={() => navigate('/')}
                        className="text-accent hover:underline"
                    >
                        Voltar ao Início
                    </button>
                </div>
            </div>
        );
    }

    const beltCounts = members.reduce((acc, member) => {
        const belt = member.profiles?.belt || 'unknown';
        acc[belt] = (acc[belt] || 0) + 1;
        return acc;
    }, {} as Record<string, number>);

    return (
        <div className="min-h-screen bg-background">
            {/* Header */}
            <div className="bg-gradient-to-r from-primary to-primary/80 text-white p-6">
                <button
                    onClick={() => navigate(-1)}
                    className="flex items-center gap-2 text-white/80 hover:text-white mb-4"
                >
                    <ArrowLeft className="w-4 h-4" />
                    Voltar
                </button>

                <div className="max-w-6xl mx-auto">
                    <h1 className="text-3xl font-black mb-2">{academy.name}</h1>
                    <div className="flex items-center gap-4 text-white/80">
                        <div className="flex items-center gap-1">
                            <Users className="w-4 h-4" />
                            <span>{members.length} membros</span>
                        </div>
                        {owner && (
                            <div className="flex items-center gap-1">
                                <Shield className="w-4 h-4" />
                                <span>Proprietário: {owner.name}</span>
                            </div>
                        )}
                        <div className="flex items-center gap-1">
                            <UserCheck className="w-4 h-4" />
                            <span>Código: {academy.join_code}</span>
                        </div>
                    </div>
                </div>
            </div>

            <div className="max-w-6xl mx-auto p-6">
                {/* Statistics */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
                    <div className="bg-white/5 border border-white/10 rounded-xl p-4">
                        <div className="flex items-center gap-3 mb-2">
                            <Users className="w-8 h-8 text-accent" />
                            <div>
                                <p className="text-2xl font-black text-white">{members.length}</p>
                                <p className="text-xs text-muted-foreground">Total de Membros</p>
                            </div>
                        </div>
                    </div>

                    {Object.entries(beltCounts).map(([belt, count]) => (
                        <div key={belt} className="bg-white/5 border border-white/10 rounded-xl p-4">
                            <div className="flex items-center gap-3 mb-2">
                                <Award className={`w-8 h-8 ${getBeltColor(belt)} rounded-full p-1`} />
                                <div>
                                    <p className="text-2xl font-black text-white">{count}</p>
                                    <p className="text-xs text-muted-foreground">Faixa {translateBelt(belt)}</p>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Members List */}
                <div className="bg-white/5 border border-white/10 rounded-xl p-6">
                    <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                        <Users className="w-5 h-5" />
                        Membros
                    </h2>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {members.map((member) => {
                            const profile = member.profiles;
                            if (!profile) return null;

                            return (
                                <div
                                    key={member.id}
                                    className="bg-white/5 border border-white/10 rounded-lg p-4 hover:bg-white/10 transition-colors"
                                >
                                    <div className="flex items-center gap-3">
                                        <img
                                            src={profile.avatar_url || '/default-avatar.png'}
                                            alt={profile.name}
                                            className="w-12 h-12 rounded-full object-cover"
                                            onError={(e) => {
                                                e.currentTarget.src = '/default-avatar.png';
                                            }}
                                        />
                                        <div className="flex-1">
                                            <p className="font-bold text-white">{profile.name}</p>
                                            <div className="flex items-center gap-2 mt-1">
                                                <span className={`px-2 py-0.5 rounded text-xs font-medium ${getBeltColor(profile.belt)}`}>
                                                    {translateBelt(profile.belt)}
                                                </span>
                                                {profile.degrees > 0 && (
                                                    <span className="text-xs text-muted-foreground">
                                                        {profile.degrees} {profile.degrees === 1 ? 'grau' : 'graus'}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    {members.length === 0 && (
                        <div className="text-center py-12 text-muted-foreground">
                            <Users className="w-12 h-12 mx-auto mb-3 opacity-50" />
                            <p>Nenhum membro ativo ainda</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
