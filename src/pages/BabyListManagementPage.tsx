import React, { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Box,
  Button,
  TextField,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Alert,
  CircularProgress,
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import { supabase } from '../supabaseClient';
import { v4 as uuidv4 } from 'uuid'; // For generating unique IDs, though user specified name_YYYYMMDD

// Define the Baby type
interface Baby {
  id: string; // Auto-generated: name_YYYYMMDD
  name: string;
  dob: string; // Date of Birth in YYYY-MM-DD format
  note: string;
  created_at: string;
  created_by: string;
  updated_at: string;
  updated_by: string;
  user_id: string; // Link to Supabase auth user
}

const BabyListManagementPage: React.FC = () => {
  const [babies, setBabies] = useState<Baby[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const [openDialog, setOpenDialog] = useState<boolean>(false);
  const [currentBaby, setCurrentBaby] = useState<Partial<Baby> | null>(null); // For edit/add
  const [babyName, setBabyName] = useState<string>('');
  const [babyDob, setBabyDob] = useState<string>('');
  const [babyNote, setBabyNote] = useState<string>('');

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
      .select('*')
      .eq('user_id', userId) // Filter by the current authenticated user
      .order('created_at', { ascending: false });

    if (error) {
      setError(error.message);
    } else {
      setBabies(data as Baby[]);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchBabies();
  }, []);

  const handleOpenDialog = (baby?: Baby) => {
    setError(null);
    if (baby) {
      setCurrentBaby(baby);
      setBabyName(baby.name);
      setBabyDob(baby.dob);
      setBabyNote(baby.note);
    } else {
      setCurrentBaby(null);
      setBabyName('');
      setBabyDob('');
      setBabyNote('');
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
  };

  const handleSaveBaby = async () => {
    setError(null);
    if (!babyName || !babyDob) {
      setError('아기 이름과 생년월일은 필수 항목입니다.');
      return;
    }

    setLoading(true);
    const { data: userData, error: userError } = await supabase.auth.getUser();
    if (userError || !userData?.user) {
      setError('User not authenticated.');
      setLoading(false);
      return;
    }
    const userId = userData.user.id;
    const userName = userData.user.email || 'Unknown User'; // Using email as username for now

    // Generate Baby ID: name_YYYYMMDD
    const formattedDob = babyDob.replace(/-/g, ''); // Remove hyphens
    const newBabyId = `${babyName}_${formattedDob}`;

    if (currentBaby && currentBaby.id) {
      // Update existing baby
      const { error } = await supabase
        .from('babies')
        .update({
          name: babyName,
          dob: babyDob,
          note: babyNote,
          updated_at: new Date().toISOString(),
          updated_by: userName,
        })
        .eq('id', currentBaby.id)
        .eq('user_id', userId); // Ensure user can only update their own baby

      if (error) {
        setError(error.message);
      } else {
        await fetchBabies();
        handleCloseDialog();
      }
    } else {
      // Add new baby
      const { error } = await supabase
        .from('babies')
        .insert({
          id: newBabyId, // Use the generated ID
          name: babyName,
          dob: babyDob,
          note: babyNote,
          created_at: new Date().toISOString(),
          created_by: userName,
          updated_at: new Date().toISOString(),
          updated_by: userName,
          user_id: userId,
        });

      if (error) {
        // Handle potential duplicate ID error (if name_YYYYMMDD is not unique enough)
        if (error.code === '23505') { // PostgreSQL unique violation error code
          setError('해당 이름과 생년월일 조합의 아기가 이미 존재합니다. 다른 이름을 사용해주세요.');
        } else {
          setError(error.message);
        }
      } else {
        await fetchBabies();
        handleCloseDialog();
      }
    }
    setLoading(false);
  };

  const handleDeleteBaby = async (babyId: string) => {
    setError(null);
    if (window.confirm('정말로 이 아기 정보를 삭제하시겠습니까?')) {
      setLoading(true);
      const { data: userData, error: userError } = await supabase.auth.getUser();
      if (userError || !userData?.user) {
        setError('User not authenticated.');
        setLoading(false);
        return;
      }
      const userId = userData.user.id;

      const { error } = await supabase
        .from('babies')
        .delete()
        .eq('id', babyId)
        .eq('user_id', userId); // Ensure user can only delete their own baby

      if (error) {
        setError(error.message);
      } else {
        await fetchBabies();
      }
      setLoading(false);
    }
  };

  if (loading && babies.length === 0) {
    return (
      <Container component="main" maxWidth="md" sx={{ mt: 8, textAlign: 'center' }}>
        <CircularProgress />
        <Typography sx={{ mt: 2 }}>Loading baby list...</Typography>
      </Container>
    );
  }

  return (
    <Container component="main" maxWidth="md" sx={{ mt: 4 }}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography component="h1" variant="h4">
          Baby List Management
        </Typography>
        <Button variant="contained" onClick={() => handleOpenDialog()}>
          Add New Baby
        </Button>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      <TableContainer component={Paper}>
        <Table aria-label="baby list table">
          <TableHead>
            <TableRow>
              <TableCell>아기 이름</TableCell>
              <TableCell>생년월일</TableCell>
              <TableCell>아기 ID</TableCell>
              <TableCell>메모</TableCell>
              <TableCell>최초 등록일</TableCell>
              <TableCell>최초 등록자</TableCell>
              <TableCell>최신 수정일</TableCell>
              <TableCell>최신 수정자</TableCell>
              <TableCell align="right">액션</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {babies.length === 0 ? (
              <TableRow>
                <TableCell colSpan={9} align="center">
                  등록된 아기 정보가 없습니다.
                </TableCell>
              </TableRow>
            ) : (
              babies.map((baby) => (
                <TableRow key={baby.id}>
                  <TableCell>{baby.name}</TableCell>
                  <TableCell>{baby.dob}</TableCell>
                  <TableCell>{baby.id}</TableCell>
                  <TableCell>{baby.note}</TableCell>
                  <TableCell>{new Date(baby.created_at).toLocaleString()}</TableCell>
                  <TableCell>{baby.created_by}</TableCell>
                  <TableCell>{new Date(baby.updated_at).toLocaleString()}</TableCell>
                  <TableCell>{baby.updated_by}</TableCell>
                  <TableCell align="right">
                    <IconButton onClick={() => handleOpenDialog(baby)} color="primary">
                      <EditIcon />
                    </IconButton>
                    <IconButton onClick={() => handleDeleteBaby(baby.id)} color="secondary">
                      <DeleteIcon />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      <Dialog open={openDialog} onClose={handleCloseDialog}>
        <DialogTitle>{currentBaby ? '아기 정보 수정' : '새 아기 등록'}</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            id="name"
            label="아기 이름"
            type="text"
            fullWidth
            variant="standard"
            value={babyName}
            onChange={(e) => setBabyName(e.target.value)}
            error={error?.includes('이름') || false}
            helperText={error?.includes('이름') ? error : ''}
          />
          <TextField
            margin="dense"
            id="dob"
            label="생년월일"
            type="date"
            fullWidth
            variant="standard"
            value={babyDob}
            onChange={(e) => setBabyDob(e.target.value)}
            InputLabelProps={{ shrink: true }}
            error={error?.includes('생년월일') || false}
            helperText={error?.includes('생년월일') ? error : ''}
          />
          <TextField
            margin="dense"
            id="note"
            label="메모"
            type="text"
            fullWidth
            multiline
            rows={3}
            variant="standard"
            value={babyNote}
            onChange={(e) => setBabyNote(e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>취소</Button>
          <Button onClick={handleSaveBaby}>{currentBaby ? '수정' : '등록'}</Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default BabyListManagementPage;
