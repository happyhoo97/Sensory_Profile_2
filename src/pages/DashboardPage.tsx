import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Box, Button, Typography, Container } from '@mui/material';
import { supabase } from '../supabaseClient';
import type { Session } from '@supabase/supabase-js';

const DashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const [session, setSession] = useState<Session | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    });
  }, []);

  const isAdmin = session?.user?.app_metadata?.role === 'admin';

  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      console.error('Logout error:', error.message);
    } else {
      navigate('/login');
    }
  };

  return (
    <Container component="main" maxWidth="md">
      <Box
        sx={{
          marginTop: 8,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
        }}
      >
        <Typography component="h1" variant="h4">
          Welcome to SP2 System Dashboard!
        </Typography>
        <Typography variant="body1" sx={{ mt: 2 }}>
          Here you will find the main navigation.
        </Typography>
        <Box sx={{ mt: 4, display: 'flex', flexDirection: 'column', gap: 2, width: '100%', maxWidth: '400px' }}>
          <Button
            variant="contained"
            onClick={() => navigate('/baby-list-management')}
            fullWidth
          >
            1. Baby List Management
          </Button>
          <Button
            variant="contained"
            onClick={() => navigate('/make-new-profile')}
            fullWidth
          >
            2. Make New Profile
          </Button>
          <Button
            variant="contained"
            onClick={() => navigate('/search-profile-history')}
            fullWidth
          >
            3. Search Profile History
          </Button>
          {isAdmin && (
            <Button
              variant="contained"
              color="warning" // Different color for admin button
              onClick={() => navigate('/system-management')}
              fullWidth
            >
              4. System Management
            </Button>
          )}
          <Button
            variant="contained"
            color="secondary"
            onClick={handleLogout}
            fullWidth
            sx={{ mt: 2 }}
          >
            Logout
          </Button>
        </Box>
      </Box>
    </Container>
  );
};

export default DashboardPage;
