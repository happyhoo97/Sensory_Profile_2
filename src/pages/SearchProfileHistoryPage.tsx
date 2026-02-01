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
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material';
import { supabase } from '../supabaseClient';
import { useNavigate } from 'react-router-dom';
import PrintIcon from '@mui/icons-material/Print';
import VisibilityIcon from '@mui/icons-material/Visibility';

interface Baby {
  id: string; // name_YYYYMMDD
  name: string;
}

interface Profile {
  id: string; // profile_id: baby_id_sequence
  baby_id: string;
  user_id: string;
  created_at: string;
  created_by: string;
  updated_at: string;
  updated_by: string;
  profile_data: any; // JSONB data from the questionnaire
}

const SearchProfileHistoryPage: React.FC = () => {
  const [babies, setBabies] = useState<Baby[]>([]);
  const [selectedBabyId, setSelectedBabyId] = useState<string>('');
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [viewingProfile, setViewingProfile] = useState<Profile | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    fetchBabies();
  }, []);

  useEffect(() => {
    if (selectedBabyId) {
      fetchProfiles(selectedBabyId);
    } else {
      setProfiles([]);
    }
  }, [selectedBabyId]);

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
      }
    }
    setLoading(false);
  };

  const fetchProfiles = async (babyId: string) => {
    setLoading(true);
    const { data: userData, error: userError } = await supabase.auth.getUser();
    if (userError || !userData?.user) {
      setError('User not authenticated.');
      setLoading(false);
      return;
    }
    const userId = userData.user.id;

    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('baby_id', babyId)
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      setError(error.message);
    } else {
      setProfiles(data as Profile[]);
    }
    setLoading(false);
  };

  const handleBabyChange = (event: any) => {
    setSelectedBabyId(event.target.value as string);
    setError(null);
  };

  const handleViewProfile = (profile: Profile) => {
    setViewingProfile(profile);
  };

  const handleCloseViewDialog = () => {
    setViewingProfile(null);
  };

  const handlePrintProfile = () => {
    if (viewingProfile) {
      // This is a basic print functionality.
      // For more advanced printing (e.g., custom layout, PDF generation),
      // a dedicated library or backend service might be needed.
      const printWindow = window.open('', '', 'height=600,width=800');
      if (printWindow) {
        const babyName = babies.find(b => b.id === viewingProfile.baby_id)?.name || viewingProfile.baby_id;
        printWindow.document.write(`
          <html>
            <head>
              <title>Profile for ${babyName} (${viewingProfile.id})</title>
              <style>
                body { font-family: sans-serif; padding: 20px; }
                h1 { text-align: center; }
                .profile-details div { margin-bottom: 10px; }
                .profile-details strong { display: inline-block; width: 120px; }
                table { width: 100%; border-collapse: collapse; margin-top: 20px; }
                th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
                th { background-color: #f2f2f2; }
              </style>
            </head>
            <body>
              <h1>아기 프로파일 기록</h1>
              <div class="profile-details">
                <div><strong>아기 이름:</strong> ${babyName}</div>
                <div><strong>프로파일 ID:</strong> ${viewingProfile.id}</div>
                <div><strong>생성일:</strong> ${new Date(viewingProfile.created_at).toLocaleString()}</div>
                <div><strong>생성자:</strong> ${viewingProfile.created_by}</div>
                <div><strong>최신 수정일:</strong> ${new Date(viewingProfile.updated_at).toLocaleString()}</div>
                <div><strong>최신 수정자:</strong> ${viewingProfile.updated_by}</div>
              </div>
              <h2>설문지 응답</h2>
              <table>
                <thead>
                  <tr>
                    <th>질문</th>
                    <th>응답</th>
                  </tr>
                </thead>
                <tbody>
                  ${Object.entries(viewingProfile.profile_data).map(([key, value]) => `
                    <tr>
                      <td>${key.replace('question1_score', 'Q1. 예시 질문입니다.')}</td>
                      <td>${value}</td>
                    </tr>
                  `).join('')}
                </tbody>
              </table>
            </body>
          </html>
        `);
        printWindow.document.close();
        printWindow.print();
      }
    }
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
        Search Profile History
      </Typography>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      <Paper elevation={3} sx={{ p: 3, mb: 3 }}>
        <FormControl fullWidth margin="normal">
          <InputLabel id="baby-select-label">아기 선택</InputLabel>
          <Select
            labelId="baby-select-label"
            id="baby-select"
            value={selectedBabyId}
            label="아기 선택"
            onChange={handleBabyChange}
          >
            {babies.map((baby) => (
              <MenuItem key={baby.id} value={baby.id}>
                {baby.name} ({baby.id})
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Paper>

      {selectedBabyId && profiles.length === 0 && !loading && (
        <Alert severity="info" sx={{ mb: 2 }}>
          선택된 아기의 프로파일 기록이 없습니다.
        </Alert>
      )}

      {profiles.length > 0 && (
        <TableContainer component={Paper}>
          <>
            <Table aria-label="profile history table">
              <TableHead>
                <TableRow>
                  <TableCell>프로파일 ID</TableCell>
                  <TableCell>생성일</TableCell>
                  <TableCell>생성자</TableCell>
                  <TableCell>최신 수정일</TableCell>
                  <TableCell>최신 수정자</TableCell>
                  <TableCell align="right">액션</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {profiles.map((profile) => (
                  <TableRow key={profile.id}>
                    <TableCell>{profile.id}</TableCell>
                    <TableCell>{new Date(profile.created_at).toLocaleString()}</TableCell>
                    <TableCell>{profile.created_by}</TableCell>
                    <TableCell>{new Date(profile.updated_at).toLocaleString()}</TableCell>
                    <TableCell>{profile.updated_by}</TableCell>
                    <TableCell align="right">
                      <IconButton onClick={() => handleViewProfile(profile)} color="primary">
                        <VisibilityIcon />
                      </IconButton>
                      <IconButton onClick={handlePrintProfile} disabled={!viewingProfile || viewingProfile.id !== profile.id} color="info">
                        <PrintIcon />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </>
        </TableContainer>
      )}

      <Dialog open={!!viewingProfile} onClose={handleCloseViewDialog} maxWidth="md" fullWidth>
        <DialogTitle>프로파일 상세 보기: {viewingProfile?.id}</DialogTitle>
        <DialogContent dividers>
          {viewingProfile && (
            <Box>
              <Typography variant="body1"><strong>아기 이름:</strong> {babies.find(b => b.id === viewingProfile.baby_id)?.name}</Typography>
              <Typography variant="body1"><strong>생성일:</strong> {new Date(viewingProfile.created_at).toLocaleString()}</Typography>
              <Typography variant="body1"><strong>생성자:</strong> {viewingProfile.created_by}</Typography>
              <Typography variant="body1"><strong>최신 수정일:</strong> {new Date(viewingProfile.updated_at).toLocaleString()}</Typography>
              <Typography variant="body1"><strong>최신 수정자:</strong> {viewingProfile.updated_by}</Typography>
              <Typography variant="h6" sx={{ mt: 2, mb: 1 }}>설문지 응답:</Typography>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 'bold' }}>질문</TableCell>
                    <TableCell sx={{ fontWeight: 'bold' }}>응답</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {Object.entries(viewingProfile.profile_data || {}).map(([key, value]) => (
                    <TableRow key={key}>
                      <TableCell>{key.replace('question1_score', 'Q1. 예시 질문입니다.')}</TableCell>
                      <TableCell>{String(value)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handlePrintProfile} color="info" startIcon={<PrintIcon />}>
            인쇄하기
          </Button>
          <Button onClick={handleCloseViewDialog} color="primary">
            닫기
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default SearchProfileHistoryPage;
