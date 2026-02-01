import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  Box,
  Typography,
  TextField,
  Button,
  CircularProgress,
  Alert,
} from '@mui/material';
import { supabase } from '../../supabaseClient'; // Adjust path as needed

const LoginPage: React.FC = () => {
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  const handleLogin = async (event: React.FormEvent) => {
    event.preventDefault();
    setLoading(true);
    setError(null);

    const { error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (authError) {
      setError(authError.message);
    } else {
      navigate('/dashboard');
    }
    setLoading(false);
  };

  // Placeholder for social login - user requested Kakao, Google, Naver
  const handleSocialLogin = async (provider: 'google') => {
    setLoading(true);
    setError(null);

    // Supabase supports Google directly.
    if (provider === 'google') {
      const { error: authError } = await supabase.auth.signInWithOAuth({
        provider: 'google',
      });
      if (authError) {
        setError(authError.message);
      }
    } else {
      setError(`Social login with ${provider} is not yet implemented.`);
    }
    setLoading(false);
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
        <Typography component="h1" variant="h5">
          Gemini SP2 System Login
        </Typography>
        <Box component="form" onSubmit={handleLogin} noValidate sx={{ mt: 1 }}>
          <TextField
            margin="normal"
            required
            fullWidth
            id="email"
            label="Email Address"
            name="email"
            autoComplete="email"
            autoFocus
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <TextField
            margin="normal"
            required
            fullWidth
            name="password"
            label="Password"
            type="password"
            id="password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <Button
            type="submit"
            fullWidth
            variant="contained"
            sx={{ mt: 3, mb: 2 }}
            disabled={loading}
          >
            {loading ? <CircularProgress size={24} /> : 'Sign In'}
          </Button>
          {error && <Alert severity="error">{error}</Alert>}
          
          <Box sx={{ mt: 2, display: 'flex', justifyContent: 'space-around' }}>
            <Button
              variant="outlined"
              onClick={() => handleSocialLogin('google')}
              disabled={loading}
            >
              Google Login
            </Button>

          </Box>
        </Box>
      </Box>
    </Container>
  );
};

export default LoginPage;