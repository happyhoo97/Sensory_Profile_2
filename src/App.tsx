import { useState, useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import type { Session } from '@supabase/supabase-js';
import { supabase } from './supabaseClient';
import LoginPage from './components/Auth/LoginPage';
import DashboardPage from './pages/DashboardPage';
import BabyListManagementPage from './pages/BabyListManagementPage';
import MakeNewProfilePage from './pages/MakeNewProfilePage';
import SearchProfileHistoryPage from './pages/SearchProfileHistoryPage';
import SearchProfileHistoryPage from './pages/SearchProfileHistoryPage';
import SystemManagementPage from './pages/SystemManagementPage';
import AuthCallback from './pages/AuthCallback'; // Import the new callback page
import ProtectedRoute from './components/Auth/ProtectedRoute';

function App() {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Get initial session
    const getSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setSession(session);
      setLoading(false);
    };
    getSession();

    // Listen for auth state changes
    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    // Cleanup listener on component unmount
    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  if (loading) {
    return <div>Loading...</div>; // Or a spinner component
  }

  return (
    <Routes>
      <Route
        path="/login"
        element={session ? <Navigate to="/dashboard" /> : <LoginPage />}
      />
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute session={session}>
            <DashboardPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/baby-list-management"
        element={
          <ProtectedRoute session={session}>
            <BabyListManagementPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/make-new-profile"
        element={
          <ProtectedRoute session={session}>
            <MakeNewProfilePage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/search-profile-history"
        element={
          <ProtectedRoute session={session}>
            <SearchProfileHistoryPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/system-management" // New admin-only route
        element={
          <ProtectedRoute session={session} adminOnly={true}>
            <SystemManagementPage />
          </ProtectedRoute>
        }
      />
      <Route // New Auth Callback route
        path="/auth-callback"
        element={<AuthCallback />}
      />
      {/* Redirect root to either dashboard or login */}
      <Route
        path="/"
        element={<Navigate to={session ? "/dashboard" : "/login"} />}
      />
    </Routes>
  );
}

export default App;