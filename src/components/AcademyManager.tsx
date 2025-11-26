import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useLanguage } from '../contexts/LanguageContext';
import { useAuth } from '../contexts/AuthContext';
import type { Academy, Profile } from '../types';
import { Users, Copy, Check } from 'lucide-react';

export const AcademyManager = () => {
    const { user } = useAuth();
    const { t } = useLanguage();
    const [loading, setLoading] = useState(false);
    const [profile, setProfile] = useState<Profile | null>(null);
    const [myAcademy, setMyAcademy] = useState<Academy | null>(null);
    const [joinedAcademy, setJoinedAcademy] = useState<Academy | null>(null);
    const [members, setMembers] = useState<any[]>([]);
    const [joinCode, setJoinCode] = useState('');
    const [newAcademyName, setNewAcademyName] = useState('');
    const [copied, setCopied] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const [memberStatus, setMemberStatus] = useState<'pending' | 'active' | null>(null);
    const [promotionModal, setPromotionModal] = useState({
        isOpen: false,
        studentId: '',
        studentName: '',
        currentBelt: '',
        currentDegrees: 0
    });
    const [newBelt, setNewBelt] = useState('');
    const [newDegrees, setNewDegrees] = useState(0);

    const belts = ['white', 'blue', 'purple', 'brown', 'black'];

    useEffect(() => {
        if (user) {
            fetchProfileAndAcademy();
        }
    }, [user]);

    const fetchProfileAndAcademy = async () => {
        try {
            // Fetch Profile
            const { data: profileData } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', user!.id)
                .single();
            setProfile(profileData);

            if (profileData?.role === 'professor' || profileData?.role === 'owner') {
                // Fetch Owned Academy
                const { data: academyData } = await supabase
                    .from('academies')
                    .select('*')
                    .eq('owner_id', user!.id)
                    .single();
                setMyAcademy(academyData);

                if (academyData) {
                    // Fetch Members
                    const { data: membersData } = await supabase
                        .from('academy_members')
                        .select('*, profiles(*)')
                        .eq('academy_id', academyData.id);
                    setMembers(membersData || []);
                }
            } else {
                // Fetch Joined Academy
                const { data: memberData } = await supabase
                    .from('academy_members')
                    .select('*, academies(*)')
                    .eq('user_id', user!.id)
                    .single();

                if (memberData?.academies) {
                    setJoinedAcademy(memberData.academies as any);
                    setMemberStatus(memberData.status as any);
                } else {
                    setJoinedAcademy(null);
                    setMemberStatus(null);
                }
            }
        } catch (error) {
            console.error('Error fetching data:', error);
        }
    };

    const createAcademy = async () => {
        if (!newAcademyName.trim()) return;
        setLoading(true);
        try {
            const code = Math.random().toString(36).substring(2, 8).toUpperCase();
            const { error } = await supabase.from('academies').insert({
                name: newAcademyName,
                owner_id: user!.id,
                join_code: code
            });
            if (error) throw error;
            await fetchProfileAndAcademy();
            setNewAcademyName('');
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const joinAcademy = async () => {
        if (!joinCode.trim()) return;
        setLoading(true);
        try {
            // Find academy by code
            const { data: academy, error: searchError } = await supabase
                .from('academies')
                .select('id, name')
                .eq('join_code', joinCode.toUpperCase())
                .single();

            if (searchError || !academy) throw new Error(t('academy.errorNotFound'));

            // Join
            const { error: joinError } = await supabase.from('academy_members').insert({
                academy_id: academy.id,
                user_id: user!.id,
                status: 'pending' // Now defaults to pending
            });

            if (joinError) throw joinError;
            await fetchProfileAndAcademy();
            setJoinCode('');
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const updateMemberStatus = async (memberId: string, newStatus: 'active' | 'rejected') => {
        try {
            if (newStatus === 'rejected') {
                await supabase.from('academy_members').delete().eq('id', memberId);
            } else {
                await supabase.from('academy_members').update({ status: newStatus }).eq('id', memberId);
            }
            await fetchProfileAndAcademy();
        } catch (error) {
            console.error('Error updating member:', error);
        }
    };

    const copyCode = () => {
        if (myAcademy?.join_code) {
            navigator.clipboard.writeText(myAcademy.join_code);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }
    };

    const openPromotionModal = (member: any) => {
        setPromotionModal({
            isOpen: true,
            studentId: member.profiles.id,
            studentName: member.profiles.name,
            currentBelt: member.profiles.belt,
            currentDegrees: member.profiles.degrees
        });
        setNewBelt(member.profiles.belt);
        setNewDegrees(member.profiles.degrees);
    };

    const handlePromote = async () => {
        setLoading(true);
        try {
            const { error } = await supabase
                .from('profiles')
                .update({
                    belt: newBelt,
                    degrees: newDegrees
                })
                .eq('id', promotionModal.studentId);

            if (error) throw error;

            await fetchProfileAndAcademy();
            setPromotionModal({ ...promotionModal, isOpen: false });
            alert(t('academy.promotionSuccess'));
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    if (!profile) return null;

    const pendingMembers = members.filter(m => m.status === 'pending');
    const activeMembers = members.filter(m => m.status === 'active');

    return (
        <div className="space-y-6">
            <h2 className="text-xl font-bold text-white">{t('academy.title')}</h2>

            {/* ERROR MESSAGE */}
            {error && (
                <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm">
                    {error}
                </div>
            )}

            {/* PROFESSOR VIEW */}
            {(profile.role === 'professor' || profile.role === 'owner') && (
                <div className="space-y-6">
                    {!myAcademy ? (
                        <div className="p-6 bg-white/5 border border-white/10 rounded-2xl space-y-4">
                            <h3 className="text-lg font-bold text-white">{t('academy.createTitle')}</h3>
                            <p className="text-sm text-muted-foreground">{t('academy.createSubtitle')}</p>
                            <div className="flex gap-2">
                                <input
                                    type="text"
                                    placeholder={t('academy.namePlaceholder')}
                                    value={newAcademyName}
                                    onChange={(e) => setNewAcademyName(e.target.value)}
                                    className="flex-1 bg-black/20 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-white/30"
                                />
                                <button
                                    onClick={createAcademy}
                                    disabled={loading}
                                    className="bg-white text-black font-bold px-6 rounded-xl hover:bg-gray-200 transition-colors"
                                >
                                    {loading ? t('academy.creating') : t('academy.createButton')}
                                </button>
                            </div>
                        </div>
                    ) : (
                        <div className="space-y-6">
                            {/* ACADEMY INFO CARD */}
                            <div className="p-6 bg-gradient-to-br from-blue-500/10 to-purple-500/10 border border-white/10 rounded-2xl space-y-4">
                                <div className="flex justify-between items-start">
                                    <div>
                                        <h3 className="text-2xl font-black text-white">{myAcademy.name}</h3>
                                        <p className="text-sm text-muted-foreground">{t('academy.owner')}</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">{t('academy.joinCode')}</p>
                                        <button
                                            onClick={copyCode}
                                            className="flex items-center gap-2 bg-white/10 hover:bg-white/20 px-3 py-1.5 rounded-lg transition-colors"
                                        >
                                            <span className="font-mono text-lg font-bold text-accent">{myAcademy.join_code}</span>
                                            {copied ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />}
                                        </button>
                                    </div>
                                </div>
                            </div>

                            {/* PENDING REQUESTS */}
                            {pendingMembers.length > 0 && (
                                <div className="space-y-4">
                                    <h3 className="text-lg font-bold text-white flex items-center gap-2">
                                        <div className="w-2 h-2 rounded-full bg-yellow-500 animate-pulse" />
                                        {t('academy.pendingRequests')} ({pendingMembers.length})
                                    </h3>
                                    <div className="grid gap-3">
                                        {pendingMembers.map((member) => (
                                            <div key={member.id} className="p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-xl flex items-center justify-between">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 rounded-full bg-white/10 overflow-hidden">
                                                        {member.profiles?.avatar_url ? (
                                                            <img src={member.profiles.avatar_url} alt="" className="w-full h-full object-cover" />
                                                        ) : (
                                                            <div className="w-full h-full flex items-center justify-center text-xs font-bold">
                                                                {member.profiles?.name?.[0] || '?'}
                                                            </div>
                                                        )}
                                                    </div>
                                                    <div>
                                                        <p className="font-bold text-white">{member.profiles?.name || 'Unknown'}</p>
                                                        <p className="text-xs text-muted-foreground capitalize">{member.profiles?.belt} Belt</p>
                                                    </div>
                                                </div>
                                                <div className="flex gap-2">
                                                    <button
                                                        onClick={() => updateMemberStatus(member.id, 'active')}
                                                        className="px-3 py-1.5 rounded-lg bg-green-500/20 text-green-400 text-xs font-bold hover:bg-green-500/30 transition-colors"
                                                    >
                                                        {t('academy.approve')}
                                                    </button>
                                                    <button
                                                        onClick={() => updateMemberStatus(member.id, 'rejected')}
                                                        className="px-3 py-1.5 rounded-lg bg-red-500/20 text-red-400 text-xs font-bold hover:bg-red-500/30 transition-colors"
                                                    >
                                                        {t('academy.reject')}
                                                    </button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* ACTIVE STUDENTS LIST */}
                            <div className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <h3 className="text-lg font-bold text-white flex items-center gap-2">
                                        <Users className="w-5 h-5 text-accent" />
                                        {t('academy.students')} ({activeMembers.length})
                                    </h3>
                                </div>

                                <div className="grid gap-3">
                                    {activeMembers.map((member) => (
                                        <div key={member.id} className="p-4 bg-white/5 border border-white/10 rounded-xl flex items-center justify-between">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-full bg-white/10 overflow-hidden">
                                                    {member.profiles?.avatar_url ? (
                                                        <img src={member.profiles.avatar_url} alt="" className="w-full h-full object-cover" />
                                                    ) : (
                                                        <div className="w-full h-full flex items-center justify-center text-xs font-bold">
                                                            {member.profiles?.name?.[0] || '?'}
                                                        </div>
                                                    )}
                                                </div>
                                                <div>
                                                    <p className="font-bold text-white">{member.profiles?.name || 'Unknown'}</p>
                                                    <p className="text-xs text-muted-foreground capitalize">{member.profiles?.belt} Belt • {member.profiles?.degrees} degrees</p>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <button
                                                    onClick={() => openPromotionModal(member)}
                                                    className="px-3 py-1.5 rounded-lg bg-purple-500/20 text-purple-400 text-xs font-bold hover:bg-purple-500/30 transition-colors"
                                                >
                                                    {t('academy.promote')}
                                                </button>
                                                <div className="px-3 py-1 rounded-full bg-green-500/20 text-green-400 text-xs font-bold uppercase">
                                                    {t('academy.active')}
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                    {activeMembers.length === 0 && (
                                        <div className="text-center py-8 text-muted-foreground">
                                            {t('academy.noStudents')}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* PROMOTION MODAL */}
            {promotionModal.isOpen && (
                <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50">
                    <div className="bg-[#1a1a1a] border border-white/10 rounded-2xl p-6 w-full max-w-md space-y-6">
                        <h3 className="text-xl font-bold text-white">{t('academy.promoteTitle')}</h3>

                        <div className="space-y-4">
                            <div>
                                <label className="text-xs text-muted-foreground uppercase tracking-wider block mb-2">{t('academy.student')}</label>
                                <div className="p-3 bg-white/5 rounded-xl text-white font-bold">
                                    {promotionModal.studentName}
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-xs text-muted-foreground uppercase tracking-wider block mb-2">{t('academy.newBelt')}</label>
                                    <select
                                        value={newBelt}
                                        onChange={(e) => setNewBelt(e.target.value)}
                                        className="w-full bg-black/20 border border-white/10 rounded-xl px-3 py-2 text-white capitalize focus:outline-none focus:border-white/30"
                                    >
                                        {belts.map(belt => (
                                            <option key={belt} value={belt}>{belt}</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="text-xs text-muted-foreground uppercase tracking-wider block mb-2">{t('academy.degrees')}</label>
                                    <select
                                        value={newDegrees}
                                        onChange={(e) => setNewDegrees(Number(e.target.value))}
                                        className="w-full bg-black/20 border border-white/10 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-white/30"
                                    >
                                        {[0, 1, 2, 3, 4].map(d => (
                                            <option key={d} value={d}>{d}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                        </div>

                        <div className="flex gap-3 pt-2">
                            <button
                                onClick={() => setPromotionModal({ ...promotionModal, isOpen: false })}
                                className="flex-1 px-4 py-3 rounded-xl bg-white/5 text-white font-bold hover:bg-white/10 transition-colors"
                            >
                                {t('academy.cancel')}
                            </button>
                            <button
                                onClick={handlePromote}
                                disabled={loading}
                                className="flex-1 px-4 py-3 rounded-xl bg-white text-black font-bold hover:bg-gray-200 transition-colors"
                            >
                                {loading ? '...' : t('academy.confirmPromote')}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* STUDENT VIEW */}
            {profile.role === 'student' && (
                <div className="space-y-6">
                    {!joinedAcademy ? (
                        <div className="p-6 bg-white/5 border border-white/10 rounded-2xl space-y-4">
                            <h3 className="text-lg font-bold text-white">{t('academy.joinTitle')}</h3>
                            <p className="text-sm text-muted-foreground">{t('academy.joinSubtitle')}</p>
                            <div className="flex gap-2">
                                <input
                                    type="text"
                                    placeholder={t('academy.codePlaceholder')}
                                    value={joinCode}
                                    onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                                    maxLength={6}
                                    className="flex-1 bg-black/20 border border-white/10 rounded-xl px-4 py-3 text-white font-mono uppercase placeholder-muted-foreground focus:outline-none focus:border-white/30"
                                />
                                <button
                                    onClick={joinAcademy}
                                    disabled={loading}
                                    className="bg-white text-black font-bold px-6 rounded-xl hover:bg-gray-200 transition-colors"
                                >
                                    {loading ? t('academy.joining') : t('academy.joinButton')}
                                </button>
                            </div>
                        </div>
                    ) : (
                        <div className={`p-6 border rounded-2xl ${memberStatus === 'pending' ? 'bg-yellow-500/10 border-yellow-500/20' : 'bg-gradient-to-br from-green-500/10 to-emerald-500/10 border-white/10'}`}>
                            <div className="flex items-center gap-4">
                                <div className={`p-3 rounded-xl ${memberStatus === 'pending' ? 'bg-yellow-500/20' : 'bg-white/10'}`}>
                                    <Users className={`w-6 h-6 ${memberStatus === 'pending' ? 'text-yellow-500' : 'text-white'}`} />
                                </div>
                                <div>
                                    <p className="text-sm text-muted-foreground">{memberStatus === 'pending' ? t('academy.pendingApproval') : t('academy.memberOf')}</p>
                                    <h3 className="text-xl font-black text-white">{joinedAcademy.name}</h3>
                                    {memberStatus === 'pending' && (
                                        <p className="text-xs text-yellow-500 mt-1">
                                            {t('academy.pendingMessage').replace('{name}', joinedAcademy.name)}
                                        </p>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};
