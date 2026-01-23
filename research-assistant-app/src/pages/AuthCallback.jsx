import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/useAuth';
import LoadingSpinner from '../components/common/LoadingSpinner';

export default function AuthCallback() {
    const { isAuthenticated, loading } = useAuth();
    const navigate = useNavigate();

    useEffect(() => {
        if (!loading) {
            if (isAuthenticated) {
                navigate('/dashboard');
            } else {
                // If not authenticated after loading, something went wrong or no session found
                // However, Supabase usually handles the hash parsing automatically in the client.
                // We might want to give it a moment or check if there's an error in URL.
                const hash = window.location.hash;
                if (!hash) {
                    navigate('/login');
                }
                // If there is a hash, supabase client in AuthProvider should pick it up.
                // We just wait here.
            }
        }
    }, [loading, isAuthenticated, navigate]);

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
            <div className="text-center">
                <LoadingSpinner size="lg" className="mb-4 mx-auto" />
                <h2 className="text-xl font-semibold text-gray-900">Completing sign in...</h2>
                <p className="text-gray-500 mt-2">Please wait while we redirect you.</p>
            </div>
        </div>
    );
}
