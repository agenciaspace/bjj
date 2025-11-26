import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import type { Academy, Profile } from '../types';
import { Users, Copy, Check } from 'lucide-react';

export const AcademyManager = () => {
    const { user } = useAuth();
    const [loading, setLoading] = useState(false);
    const [profile, setProfile] = useState<Profile | null>(null);
    const [myAcademy, setMyAcademy] = useState<Academy | null>(null);
    const [joinedAcademy, setJoinedAcademy] = useState<Academy | null>(null);
    const [members, setMembers] = useState<any[]>([]);
    const [joinCode, setJoinCode] = useState('');
    const [newAcademyName, setNewAcademyName] = useState('');
    const [copied, setCopied] = useState(false);
    const [error, setError] = useState<string | null>(null);

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
                .select('id')
                .eq('join_code', joinCode.toUpperCase())
                .single();

            if (searchError || !academy) throw new Error('Academy not found');

            // Join
            const { error: joinError } = await supabase.from('academy_members').insert({
                academy_id: academy.id,
                user_id: user!.id,
                status: 'active' // Auto-approve for now
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

    const copyCode = () => {
        if (myAcademy?.join_code) {
            navigator.clipboard.writeText(myAcademy.join_code);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }
    };

    if (!profile) return null;

    return (
        <div className="space-y-6">
            <h2 className="text-xl font-bold text-white">Academy Management</h2>

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
                            <h3 className="text-lg font-bold text-white">Create your Academy</h3>
                            <p className="text-sm text-muted-foreground">Create a space for your students to join.</p>
                            <div className="flex gap-2">
                                <input
                                    type="text"
                                    placeholder="Academy Name"
                                    value={newAcademyName}
                                    onChange={(e) => setNewAcademyName(e.target.value)}
                                    className="flex-1 bg-black/20 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-white/30"
                                />
                                <button
                                    onClick={createAcademy}
                                    disabled={loading}
                                    className="bg-white text-black font-bold px-6 rounded-xl hover:bg-gray-200 transition-colors"
                                >
                                    {loading ? 'Creating...' : 'Create'}
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
                                        <p className="text-sm text-muted-foreground">Owner</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Join Code</p>
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

                            {/* STUDENTS LIST */}
                            <div className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <h3 className="text-lg font-bold text-white flex items-center gap-2">
                                        <Users className="w-5 h-5 text-accent" />
                                        Students ({members.length})
                                    </h3>
                                </div>

                                <div className="grid gap-3">
                                    {members.map((member) => (
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
                                                    <p className="text-xs text-muted-foreground capitalize">{member.profiles?.belt} Belt</p>
                                                </div>
                                            </div>
                                            <div className="px-3 py-1 rounded-full bg-green-500/20 text-green-400 text-xs font-bold uppercase">
                                                Active
                                            </div>
                                        </div>
                                    ))}
                                    {members.length === 0 && (
                                        <div className="text-center py-8 text-muted-foreground">
                                            No students yet. Share your code!
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* STUDENT VIEW */}
            {profile.role === 'student' && (
                <div className="space-y-6">
                    {!joinedAcademy ? (
                        <div className="p-6 bg-white/5 border border-white/10 rounded-2xl space-y-4">
                            <h3 className="text-lg font-bold text-white">Join an Academy</h3>
                            <p className="text-sm text-muted-foreground">Enter the code provided by your professor.</p>
                            <div className="flex gap-2">
                                <input
                                    type="text"
                                    placeholder="Enter 6-digit code"
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
                                    {loading ? 'Joining...' : 'Join'}
                                </button>
                            </div>
                        </div>
                    ) : (
                        <div className="p-6 bg-gradient-to-br from-green-500/10 to-emerald-500/10 border border-white/10 rounded-2xl">
                            <div className="flex items-center gap-4">
                                <div className="p-3 bg-white/10 rounded-xl">
                                    <Users className="w-6 h-6 text-white" />
                                </div>
                                <div>
                                    <p className="text-sm text-muted-foreground">Member of</p>
                                    <h3 className="text-xl font-black text-white">{joinedAcademy.name}</h3>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};
