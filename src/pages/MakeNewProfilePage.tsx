import React, { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Box,
  Button,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Alert,
  CircularProgress,
  Paper,
} from '@mui/material';
import { supabase } from '../supabaseClient';
import { useNavigate } from 'react-router-dom';

// Placeholder for Profile data - User will provide actual questions later
interface ProfileData {
  baby_id: string;
  // Dynamic fields for questions will go here
  // For now, let's just have a placeholder question
  question1_score: number | null;
  // Add other fields as needed based on the actual checklist
}

interface Baby {
  id: string; // Auto-generated: name_YYYYMMDD
  name: string;
}

const MakeNewProfilePage: React.FC = () => {
  const [babies, setBabies] = useState<Baby[]>([]);
  const [selectedBabyId, setSelectedBabyId] = useState<string>('');
  const [profileData, setProfileData] = useState<ProfileData>({
    baby_id: '',
    question1_score: null,
  });
  const [loading, setLoading] = useState<boolean>(true);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    fetchBabies();
  }, []);

  const fetchBabies = async () => {
    setLoading(true);
    const { data: userData, error: userError } = await supabase.auth.getUser();
    if (userError || !userData?.user) {
      setError('User not authenticated.');
      setLoading(false);
      return;
    }
    const userId = userData.user.id;

    const { data, error } = await supabase
      .from('babies')
      .select('id, name')
      .eq('user_id', userId)
      .order('name', { ascending: true });

    if (error) {
      setError(error.message);
    } else {
      setBabies(data as Baby[]);
      if (data && data.length > 0) {
        setSelectedBabyId(data[0].id); // Select first baby by default
        setProfileData((prev) => ({ ...prev, baby_id: data[0].id }));
      }
    }
    setLoading(false);
  };

  const handleBabyChange = (event: any) => {
    const babyId = event.target.value as string;
    setSelectedBabyId(babyId);
    setProfileData((prev) => ({ ...prev, baby_id: babyId }));
  };

  const handleScoreChange = (question: string, score: number) => {
    setProfileData((prev) => ({ ...prev, [question]: score }));
  };

  const handleSubmitProfile = async (event: React.FormEvent) => {
    event.preventDefault();
    setSubmitting(true);
    setError(null);
    setSuccess(null);

    if (!selectedBabyId) {
      setError('아기를 선택해주세요.');
      setSubmitting(false);
      return;
    }
    if (profileData.question1_score === null) {
      setError('모든 질문에 답해주세요.');
      setSubmitting(false);
      return;
    }

    const { data: userData, error: userError } = await supabase.auth.getUser();
    if (userError || !userData?.user) {
      setError('User not authenticated.');
      setSubmitting(false);
      return;
    }
    const userId = userData.user.id;
    const userName = userData.user.email || 'Unknown User';

    // 1. Get count of existing profiles for this baby_id to generate sequential profile_id
    const { count, error: countError } = await supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true })
      .eq('baby_id', selectedBabyId);

    if (countError) {
      setError(countError.message);
      setSubmitting(false);
      return;
    }

    const nextSequence = (count || 0) + 1;
    const newProfileId = `${selectedBabyId}_${nextSequence}`;

    const currentTime = new Date().toISOString();

    const { error } = await supabase
      .from('profiles')
      .insert({
        id: newProfileId, // Use the generated profile_id
        baby_id: selectedBabyId,
        user_id: userId,
        created_at: currentTime,
        created_by: userName,
        updated_at: currentTime, // Add updated_at
        updated_by: userName, // Add updated_by
        profile_data: profileData, // Store all profile questions as JSONB
      });

    if (error) {
      setError(error.message);
    } else {
      setSuccess('프로파일이 성공적으로 생성되었습니다!');
      // Optionally reset form or navigate
      setProfileData({ baby_id: selectedBabyId, question1_score: null }); // Reset form
      // navigate('/search-profile-history'); // Or navigate to history
    }
    setSubmitting(false);
  };

  if (loading) {
    return (
      <Container component="main" maxWidth="md" sx={{ mt: 8, textAlign: 'center' }}>
        <CircularProgress />
        <Typography sx={{ mt: 2 }}>아기 목록을 불러오는 중...</Typography>
      </Container>
    );
  }

  if (babies.length === 0) {
    return (
      <Container component="main" maxWidth="md" sx={{ mt: 8, textAlign: 'center' }}>
        <Alert severity="info">
          등록된 아기가 없습니다. 먼저 'Baby List Management'에서 아기를 등록해주세요.
        </Alert>
        <Button variant="contained" sx={{ mt: 2 }} onClick={() => navigate('/baby-list-management')}>
          아기 등록 페이지로 이동
        </Button>
      </Container>
    );
  }

  return (
    <Container component="main" maxWidth="md" sx={{ mt: 4 }}>
      <Typography component="h1" variant="h4" mb={3}>
        Make New Profile
      </Typography>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      {success && <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>}

      <Paper elevation={3} sx={{ p: 3, mb: 3 }}>
        <FormControl fullWidth margin="normal">
          <InputLabel id="baby-select-label">아기 선택</InputLabel>
          <Select
            labelId="baby-select-label"
            id="baby-select"
            value={selectedBabyId}
            label="아기 선택"
            onChange={handleBabyChange}
            disabled={submitting}
          >
            {babies.map((baby) => (
              <MenuItem key={baby.id} value={baby.id}>
                {baby.name} ({baby.id})
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Paper>

      <Paper elevation={3} sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          설문지 작성 (예시)
        </Typography>
        <Box sx={{ my: 2 }}>
          <Typography variant="body1">Q1. 예시 질문입니다. (1~5점)</Typography>
          <Box sx={{ display: 'flex', gap: 1, mt: 1 }}>
            {[1, 2, 3, 4, 5].map((score) => (
              <Button
                key={score}
                variant={profileData.question1_score === score ? 'contained' : 'outlined'}
                onClick={() => handleScoreChange('question1_score', score)}
                disabled={submitting}
              >
                {score}
              </Button>
            ))}
          </Box>
        </Box>
        {/* User will provide more questions here */}
      </Paper>

      <Button
        variant="contained"
        color="primary"
        onClick={handleSubmitProfile}
        disabled={submitting}
        fullWidth
        sx={{ mt: 2 }}
      >
        {submitting ? <CircularProgress size={24} /> : '프로파일 생성'}
      </Button>
    </Container>
  );
};

export default MakeNewProfilePage;