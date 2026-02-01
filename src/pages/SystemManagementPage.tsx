import React, { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Box,
  Paper,
  Alert,
  CircularProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Button,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import { supabase } from '../supabaseClient';

interface User {
  id: string;
  email: string;
  created_at: string;
  last_sign_in_at: string | null;
  app_metadata: {
    role?: string;
    [key: string]: any; // Allow other properties
  };
  user_metadata: {
    [key: string]: any;
  };
  // Add other fields you might need from auth.users
}

const SystemManagementPage: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState<boolean>(false);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [newRole, setNewRole] = useState<string>('');

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    setLoading(true);
    setError(null);
    // Call the PostgreSQL function to get all users for admin
    const { data, error } = await supabase.rpc('get_all_users_for_admin');

    if (error) {
      setError(error.message);
      setUsers([]);
    } else {
      // Cast data to User[] and ensure app_metadata is correctly parsed if it's a string
      // Note: RPC returns an array of objects, each object should match the User interface.
      // app_metadata will already be an object if it was stored as JSONB.
      const formattedUsers = data.map(user => ({
        ...user,
        app_metadata: typeof user.app_metadata === 'string' ? JSON.parse(user.app_metadata) : user.app_metadata
      }));
      setUsers(formattedUsers as User[]);
    }
    setLoading(false);
  };

  const handleEditUser = (user: User) => {
    setCurrentUser(user);
    setNewRole(user.app_metadata?.role || 'user'); // Default to 'user' if no role
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setCurrentUser(null);
    setNewRole('');
  };

  const handleUpdateRole = async () => {
    if (!currentUser) return;
    setLoading(true);
    setError(null);

    // Call the PostgreSQL function to update the user's role
    const { error: updateError } = await supabase.rpc('update_user_role_by_admin', {
      user_id: currentUser.id,
      new_role: newRole,
    });

    if (updateError) {
      setError(updateError.message);
    } else {
      // Refetch users to update the list
      await fetchUsers();
      handleCloseDialog();
    }
    setLoading(false);
  };

  const handleDeleteUser = async (userId: string) => {
    if (window.confirm('정말로 이 사용자를 삭제하시겠습니까?')) {
      setLoading(true);
      setError(null);
      // Call the PostgreSQL function to delete the user
      const { error: deleteError } = await supabase.rpc('delete_user_by_admin', {
        user_id: userId,
      });

      if (deleteError) {
        setError(deleteError.message);
      } else {
        await fetchUsers();
      }
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Container component="main" maxWidth="lg" sx={{ mt: 8, textAlign: 'center' }}>
        <CircularProgress />
        <Typography sx={{ mt: 2 }}>사용자 목록을 불러오는 중...</Typography>
      </Container>
    );
  }

  return (
    <Container component="main" maxWidth="lg" sx={{ mt: 4 }}>
      <Typography component="h1" variant="h4" mb={3}>
        System Management
      </Typography>

      {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}

      <Paper elevation={3} sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          User Account Management
        </Typography>
        <Typography variant="body2" color="text.secondary" mb={2}>
          모든 시스템 사용자의 계정을 관리합니다. 역할 변경, 비활성화 및 삭제가 가능합니다.
        </Typography>

        <TableContainer component={Paper}>
          <Table aria-label="user list table">
            <TableHead>
              <TableRow>
                <TableCell>ID</TableCell>
                <TableCell>Email</TableCell>
                <TableCell>Role</TableCell>
                <TableCell>Created At</TableCell>
                <TableCell>Last Sign In</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {users.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} align="center">
                    등록된 사용자가 없습니다.
                  </TableCell>
                </TableRow>
              ) : (
                users.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell sx={{ fontSize: '0.75rem' }}>{user.id}</TableCell>
                    <TableCell>{user.email}</TableCell>
                    <TableCell>{user.app_metadata?.role || 'user'}</TableCell>
                    <TableCell>{new Date(user.created_at).toLocaleString()}</TableCell>
                    <TableCell>{user.last_sign_in_at ? new Date(user.last_sign_in_at).toLocaleString() : 'N/A'}</TableCell>
                    <TableCell align="right">
                      <IconButton onClick={() => handleEditUser(user)} color="primary" size="small">
                        <EditIcon />
                      </IconButton>
                      <IconButton onClick={() => handleDeleteUser(user.id)} color="secondary" size="small">
                        <DeleteIcon />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      <Paper elevation={3} sx={{ p: 3 }}>
        <Typography variant="h6" gutterBottom>
          Profile Item Management
        </Typography>
        <Typography variant="body2" color="text.secondary">
          여기에 설문지 항목(질문)을 관리하는 기능이 들어갈 것입니다.
        </Typography>
        <Box sx={{ mt: 2, p: 2, border: '1px dashed grey', borderRadius: 1, minHeight: 100 }}>
          <Typography variant="caption">Questionnaire item management would be here.</Typography>
        </Box>
      </Paper>

      {/* User Role Edit Dialog */}
      <Dialog open={dialogOpen} onClose={handleCloseDialog}>
        <DialogTitle>사용자 역할 변경</DialogTitle>
        <DialogContent>
          <Typography variant="subtitle1" sx={{ mb: 2 }}>사용자: {currentUser?.email}</Typography>
          <FormControl fullWidth>
            <InputLabel id="role-select-label">역할</InputLabel>
            <Select
              labelId="role-select-label"
              id="role-select"
              value={newRole}
              label="역할"
              onChange={(e) => setNewRole(e.target.value as string)}
            >
              <MenuItem value="user">User</MenuItem>
              <MenuItem value="admin">Admin</MenuItem>
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>취소</Button>
          <Button onClick={handleUpdateRole} variant="contained" color="primary">역할 업데이트</Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default SystemManagementPage;