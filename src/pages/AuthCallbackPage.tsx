import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';

export const AuthCallbackPage = () => {
    const navigate = useNavigate();
    const { user } = useAuth();

    useEffect(() => {
        // Handle the OAuth callback
        const handleCallback = async () => {
            const { error } = await supabase.auth.getSession();
            if (error) {
                console.error('Error during auth callback:', error);
                navigate('/auth');
            } else if (user) {
                navigate('/');
            }
        };

        handleCallback();
    }, [user, navigate]);

    return (
        <div className="min-h-screen bg-black text-white flex items-center justify-center">
            <div className="animate-pulse text-accent font-bold">
                Completing sign in...
            </div>
        </div>
    );
};
