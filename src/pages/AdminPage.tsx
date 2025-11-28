import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Users, Building2, UserCheck, Search, Shield, RefreshCw } from 'lucide-react';
import type { Profile, Academy } from '../types';

interface AcademyMember {
    id: string;
    academy_id: string;
    user_id: string;
    status: 'pending' | 'active';
    created_at: string;
    profiles?: Profile;
    academies?: Academy;
}

export const AdminPage = () => {
    const [activeTab, setActiveTab] = useState<'users' | 'academies' | 'members'>('users');
    const [profiles, setProfiles] = useState<Profile[]>([]);
    const [academies, setAcademies] = useState<Academy[]>([]);
    const [members, setMembers] = useState<AcademyMember[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        fetchAllData();
    }, []);

    const fetchAllData = async () => {
        setLoading(true);
        try {
            // Fetch all profiles
            const { data: profilesData } = await supabase
                .from('profiles')
                .select('*');
            // .order('created_at', { ascending: false }); // Column might not exist

            // Fetch all academies
            const { data: academiesData } = await supabase
                .from('academies')
                .select('*')
                .order('created_at', { ascending: false });

            // Fetch all academy members with relations
            const { data: membersData, error: membersError } = await supabase
                .from('academy_members')
                .select('*, profiles(*), academies(*)');
            // .order('created_at', { ascending: false }); // Column might not exist

            if (membersError) {
                console.error('Error fetching members:', membersError);
            }

            setProfiles(profilesData || []);
            setAcademies(academiesData || []);
            setMembers(membersData || []);

            console.log('Admin Debug - Data Fetch:', {
                profiles: profilesData?.length,
                academies: academiesData?.length,
                members: membersData?.length,
                membersError,
                membersData // Inspect the actual array
            });
        } catch (error) {
            console.error('Error fetching admin data:', error);
        } finally {
            setLoading(false);
        }
    };

    const filteredProfiles = profiles.filter(p =>
        p.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.id.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const filteredAcademies = academies.filter(a =>
        a.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        a.join_code?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const filteredMembers = members.filter(m =>
        m.profiles?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (m.academies as any)?.name?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-white text-xl">Loading admin data...</div>
            </div>
        );
    }

    return (
        <div className="space-y-6 pb-24">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-black flex items-center gap-2">
                        <Shield className="w-8 h-8 text-accent" />
                        Admin Dashboard
                    </h1>
                    <p className="text-sm text-muted-foreground">Database Overview</p>
                </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-4">
                <div className="bg-white/5 border border-white/10 rounded-2xl p-4">
                    <Users className="w-6 h-6 text-accent mb-2" />
                    <p className="text-2xl font-black">{profiles.length}</p>
                    <p className="text-xs text-muted-foreground">Total Users</p>
                </div>
                <div className="bg-white/5 border border-white/10 rounded-2xl p-4">
                    <Building2 className="w-6 h-6 text-accent mb-2" />
                    <p className="text-2xl font-black">{academies.length}</p>
                    <p className="text-xs text-muted-foreground">Academies</p>
                </div>
                <div className="bg-white/5 border border-white/10 rounded-2xl p-4">
                    <UserCheck className="w-6 h-6 text-accent mb-2" />
                    <p className="text-2xl font-black">{members.length}</p>
                    <p className="text-xs text-muted-foreground">Memberships</p>
                </div>
            </div>

            {/* Search and Refresh */}
            <div className="flex gap-2">
                <div className="relative flex-grow">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                    <input
                        type="text"
                        placeholder="Search..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full bg-white/5 border border-white/10 rounded-xl pl-12 pr-4 py-3 text-white placeholder-muted-foreground focus:outline-none focus:border-accent"
                    />
                </div>
                <button
                    onClick={() => fetchAllData()}
                    className="px-4 py-2 bg-accent text-black rounded-xl hover:bg-accent/90 transition-colors font-medium flex items-center gap-2"
                >
                    <RefreshCw className="w-5 h-5" />
                    Refresh
                </button>
            </div>

            {/* Tabs */}
            <div className="flex gap-2 border-b border-white/10">
                <button
                    onClick={() => setActiveTab('users')}
                    className={`px-4 py-2 font-bold text-sm transition-colors ${activeTab === 'users'
                        ? 'text-accent border-b-2 border-accent'
                        : 'text-muted-foreground hover:text-white'
                        }`}
                >
                    Users ({profiles.length})
                </button>
                <button
                    onClick={() => setActiveTab('academies')}
                    className={`px-4 py-2 font-bold text-sm transition-colors ${activeTab === 'academies'
                        ? 'text-accent border-b-2 border-accent'
                        : 'text-muted-foreground hover:text-white'
                        }`}
                >
                    Academies ({academies.length})
                </button>
                <button
                    onClick={() => setActiveTab('members')}
                    className={`px-4 py-2 font-bold text-sm transition-colors ${activeTab === 'members'
                        ? 'text-accent border-b-2 border-accent'
                        : 'text-muted-foreground hover:text-white'
                        }`}
                >
                    Members ({members.length})
                </button>
            </div>

            {/* Content */}
            <div className="space-y-3">
                {activeTab === 'users' && (
                    <>
                        {filteredProfiles.map((profile) => (
                            <div
                                key={profile.id}
                                className="bg-white/5 border border-white/10 rounded-xl p-4 hover:bg-white/10 transition-colors"
                            >
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 rounded-full bg-white/10 overflow-hidden flex-shrink-0">
                                        {profile.avatar_url ? (
                                            <img src={profile.avatar_url} alt="" className="w-full h-full object-cover" />
                                        ) : (
                                            <img src="/default-avatar.png" alt="Default" className="w-full h-full object-cover opacity-50" />
                                        )}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="font-bold text-white truncate">{profile.name || 'Unnamed'}</p>
                                        <p className="text-xs text-muted-foreground truncate">ID: {profile.id}</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-sm font-bold text-accent capitalize">{profile.role}</p>
                                        <p className="text-xs text-muted-foreground capitalize">{profile.belt} • {profile.degrees}°</p>
                                    </div>
                                </div>
                            </div>
                        ))}
                        {filteredProfiles.length === 0 && (
                            <div className="text-center py-8 text-muted-foreground">
                                No users found
                            </div>
                        )}
                    </>
                )}

                {activeTab === 'academies' && (
                    <>
                        {filteredAcademies.map((academy) => {
                            const memberCount = members.filter(m => m.academy_id === academy.id).length;
                            const ownerProfile = profiles.find(p => p.id === academy.owner_id);

                            // Debug logging
                            console.log('Academy Debug:', {
                                academyName: academy.name,
                                academyId: academy.id,
                                totalMembersInState: members.length,
                                membersForThisAcademy: members.filter(m => m.academy_id === academy.id),
                                memberCount
                            });

                            return (
                                <div
                                    key={academy.id}
                                    className="bg-white/5 border border-white/10 rounded-xl p-4 hover:bg-white/10 transition-colors"
                                >
                                    <div className="flex items-center justify-between">
                                        <div className="flex-1">
                                            <p className="font-bold text-white">{academy.name}</p>
                                            <p className="text-xs text-muted-foreground">
                                                Owner: {ownerProfile?.name || 'Unknown'} • Code: {academy.join_code}
                                            </p>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-lg font-black text-accent">{memberCount}</p>
                                            <p className="text-xs text-muted-foreground">Members</p>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                        {filteredAcademies.length === 0 && (
                            <div className="text-center py-8 text-muted-foreground">
                                No academies found
                            </div>
                        )}
                    </>
                )}

                {activeTab === 'members' && (
                    <>
                        {filteredMembers.map((member) => (
                            <div
                                key={member.id}
                                className="bg-white/5 border border-white/10 rounded-xl p-4 hover:bg-white/10 transition-colors"
                            >
                                <div className="flex items-center justify-between">
                                    <div className="flex-1">
                                        <p className="font-bold text-white">{member.profiles?.name || 'Unknown'}</p>
                                        <p className="text-xs text-muted-foreground">
                                            Academy: {(member.academies as any)?.name || 'Unknown'}
                                        </p>
                                    </div>
                                    <div className="text-right">
                                        <p className={`text-xs font-bold px-2 py-1 rounded ${member.status === 'active'
                                            ? 'bg-green-500/20 text-green-400'
                                            : 'bg-yellow-500/20 text-yellow-400'
                                            }`}>
                                            {member.status}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        ))}
                        {filteredMembers.length === 0 && (
                            <div className="text-center py-8 text-muted-foreground">
                                No members found
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    );
};
