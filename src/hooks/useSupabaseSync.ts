import { useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { useLocalStorage } from './useLocalStorage';
import type { Training } from '../types';

export const useSupabaseSync = () => {
    const { user } = useAuth();

    const [localTrainings, setLocalTrainings] = useLocalStorage<Training[]>('bjj-trainings', []);
    const [localName, setLocalName] = useLocalStorage<string>('bjj-name', '');
    const [localBelt, setLocalBelt] = useLocalStorage<string>('bjj-belt', 'white');
    const [localDegrees, setLocalDegrees] = useLocalStorage<number>('bjj-degrees', 0);
    const [localAcademies, setLocalAcademies] = useLocalStorage<string[]>('bjj-academies', []);
    const [localMainAcademy, setLocalMainAcademy] = useLocalStorage<string>('bjj-main-academy', '');
    const [localAvatarUrl, setLocalAvatarUrl] = useLocalStorage<string>('bjj-avatar-url', '');
    const [localLanguage, setLocalLanguage] = useLocalStorage<string>('bjj-language', 'pt');

    useEffect(() => {
        if (!user) return;

        const syncData = async () => {
            // 1. Pull from Supabase
            const { data: profileData } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', user.id)
                .single();

            // Get Google Avatar if available
            const googleAvatar = user.user_metadata?.avatar_url || user.user_metadata?.picture;

            if (profileData) {
                // Update local if remote exists
                if (profileData.name) setLocalName(profileData.name);
                if (profileData.belt) setLocalBelt(profileData.belt);
                if (profileData.degrees !== undefined) setLocalDegrees(profileData.degrees);
                if (profileData.academies) setLocalAcademies(profileData.academies);
                if (profileData.main_academy) setLocalMainAcademy(profileData.main_academy);

                // Avatar Sync Logic - Always sync Google avatar if available
                if (googleAvatar) {
                    // Use Google avatar URL directly
                    setLocalAvatarUrl(googleAvatar);
                    await supabase.from('profiles').update({ avatar_url: googleAvatar }).eq('id', user.id);
                } else if (profileData.avatar_url) {
                    // If no Google avatar, use existing profile avatar
                    setLocalAvatarUrl(profileData.avatar_url);
                }

                if (profileData.language) setLocalLanguage(profileData.language);
            } else {
                // 2. Push to Supabase if remote doesn't exist (first sync)
                const initialAvatar = localAvatarUrl || googleAvatar || '';

                if (initialAvatar) setLocalAvatarUrl(initialAvatar);

                const { error: upsertError } = await supabase.from('profiles').upsert({
                    id: user.id,
                    name: localName || user.user_metadata?.full_name || user.user_metadata?.name || '',
                    belt: localBelt,
                    degrees: localDegrees,
                    academies: localAcademies,
                    main_academy: localMainAcademy,
                    avatar_url: initialAvatar,
                    language: localLanguage,
                    role: 'student', // Add default role
                    updated_at: new Date().toISOString()
                });

                if (upsertError) {
                    console.error('[Profile Upsert] Error creating profile:', upsertError);
                    alert(`Failed to create profile: ${upsertError.message}`);
                }
            }

            const { data: trainingsData } = await supabase
                .from('trainings')
                .select('*')
                .eq('user_id', user.id);

            if (trainingsData && trainingsData.length > 0) {
                // Simple merge strategy: Remote wins if conflict (for now)
                // In a real app, you'd want smarter merging
                const remoteTrainings = trainingsData.map(t => ({
                    id: t.id,
                    date: t.date,
                    duration: t.duration,
                    technique: t.technique,
                    notes: t.notes,
                    academy: t.academy,
                    type: t.type
                }));

                // Merge avoiding duplicates (by ID or content)
                // For now, let's just use remote if it has data and local is empty
                if (localTrainings.length === 0) {
                    setLocalTrainings(remoteTrainings);
                }
            } else if (localTrainings.length > 0) {
                // Push local to remote
                const trainingsToPush = localTrainings.map(t => ({
                    user_id: user.id,
                    date: t.date,
                    duration: t.duration,
                    technique: t.technique,
                    notes: t.notes,
                    academy: t.academy,
                    type: t.type
                }));

                await supabase.from('trainings').upsert(trainingsToPush);
            }
        };

        syncData();
    }, [user]); // Only run on user change (login)

    // Listen for local changes and push to Supabase (Debounced ideally, but simple for now)
    useEffect(() => {
        if (!user) return;

        const pushProfile = async () => {
            await supabase.from('profiles').upsert({
                id: user.id,
                name: localName,
                belt: localBelt,
                degrees: localDegrees,
                academies: localAcademies,
                main_academy: localMainAcademy,
                avatar_url: localAvatarUrl,
                language: localLanguage,
                updated_at: new Date().toISOString()
            });
        };

        const timeout = setTimeout(pushProfile, 2000); // Debounce 2s
        return () => clearTimeout(timeout);
    }, [user, localName, localBelt, localDegrees, localAcademies, localMainAcademy, localAvatarUrl, localLanguage]);

    // Sync Trainings (Push only for now on change)
    useEffect(() => {
        if (!user || localTrainings.length === 0) return;

        // Placeholder for future training sync logic
    }, [localTrainings, user]);
};
