import React, { useState } from 'react';
import {
  Container,
  Box,
  Typography,
  Button,
  CircularProgress,
  Alert,
} from '@mui/material';
import { supabase } from '../../supabaseClient'; // Adjust path as needed

const LoginPage: React.FC = () => {
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);


  const handleGoogleLogin = async () => { // Renamed and simplified for direct Google login
    setLoading(true);
    setError(null);

    const { error: authError } = await supabase.auth.signInWithOAuth({
      provider: 'google',
    });
    if (authError) {
      setError(authError.message);
    }
    // setLoading(false) is handled by the redirect, or if error, we set it here.
    // If no error, it redirects away, so setLoading(false) is not needed immediately.
  };

  return (
    <Container component="main" maxWidth="xs">
      <Box
        sx={{
          marginTop: 8,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
        }}
      >
        <Typography component="h1" variant="h5" sx={{ mb: 4 }}>
          SP2 System Login {/* Changed title */}
        </Typography>
        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
        
        {/* Email/Password fields and Sign In button removed */}

        <Box sx={{ mt: 2, width: '100%' }}> {/* Adjusted Box for full width button */}
          <Button
            variant="contained" // Made contained for prominence
            color="primary" // Standard primary color
            onClick={handleGoogleLogin} // Direct call
            disabled={loading}
            fullWidth // Make it wide
            sx={{ fontSize: '1.2rem', padding: '15px 0' }} // Made bigger
          >
            {loading ? <CircularProgress size={24} color="inherit" /> : 'Login with Google'} {/* Changed text */}
          </Button>
        </Box>
      </Box>
    </Container>
  );
};

export default LoginPage;
