import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CircularProgress, Typography, Container, Alert } from '@mui/material';
import { supabase } from '../supabaseClient';

const AuthCallback: React.FC = () => {
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const handleAuthCallback = async () => {
      // Supabase's signInWithOAuth will handle the session from the URL hash
      // We just need to wait for onAuthStateChange to fire or manually check session.
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();

      if (sessionError) {
        setError(sessionError.message);
        // Redirect to login with error after a delay
        setTimeout(() => navigate('/login'), 3000);
        return;
      }

      if (session) {
        // User is logged in, redirect to dashboard
        navigate('/dashboard');
      } else {
        // No session found after callback, maybe login failed or user cancelled
        setError('Authentication failed or cancelled.');
        setTimeout(() => navigate('/login'), 3000);
      }
    };

    handleAuthCallback();
  }, [navigate]);

  if (error) {
    return (
      <Container component="main" maxWidth="xs" sx={{ mt: 8, textAlign: 'center' }}>
        <Alert severity="error">{error}</Alert>
        <Typography sx={{ mt: 2 }}>Redirecting to login...</Typography>
        <CircularProgress sx={{ mt: 2 }} />
      </Container>
    );
  }

  return (
    <Container component="main" maxWidth="xs" sx={{ mt: 8, textAlign: 'center' }}>
      <CircularProgress />
      <Typography sx={{ mt: 2 }}>Authenticating...</Typography>
    </Container>
  );
};

export default AuthCallback;
