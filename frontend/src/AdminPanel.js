import React, { useState, useEffect } from 'react';
import axios from 'axios';

// Import komponen-komponen dari MUI
import { 
  Avatar,
  Box, 
  Card, 
  Typography, 
  Button, 
  Table, 
  TableBody, 
  TableCell, 
  TableContainer, 
  TableHead, 
  TableRow, 
  Paper, 
  IconButton, 
  Dialog,
  LinearProgress,
  DialogActions,
  DialogContent,
  DialogTitle,
  DialogContentText,
  TextField,
  CircularProgress,
  Alert,
  Tooltip,
  Stack // Tambahkan Stack untuk menata ikon
} from '@mui/material';

// Import ikon dari MUI
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import QrCode2Icon from '@mui/icons-material/QrCode2';
import AddIcon from '@mui/icons-material/Add';

// Komponen Form terpisah di dalam file yang sama untuk kerapian
function UserForm({ open, onClose, onSuccess, userToEdit }) {
  const [formData, setFormData] = useState({
    nama: '',
    email: '',
    password: '',
  });
  const [error, setError] = useState('');
  const isEditMode = userToEdit != null;
  

  useEffect(() => {
    // Reset form saat dialog dibuka atau user berubah
    if (open) {
      if (isEditMode) {
        setFormData({
          nama: userToEdit.nama,
          email: userToEdit.email,
          password: '',
        });
      } else {
        setFormData({
          nama: '',
          email: '',
          password: '',
        });
      }
      setError(''); // Bersihkan error sebelumnya
    }
  }, [userToEdit, open, isEditMode]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async () => {
  setError('');
  const token = localStorage.getItem('token');
  const headers = { Authorization: `Bearer ${token}` };

  // ✅ Definisikan URL API secara dinamis
  const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

  // ✅ Gunakan variabel API_URL saat membangun URL
  const url = isEditMode 
    ? `${API_URL}/api/gurus/${userToEdit.id}` 
    : `${API_URL}/api/gurus`;
  
  const method = isEditMode ? 'put' : 'post';

  if (!isEditMode && !formData.password) {
    setError('Password wajib diisi untuk guru baru.');
    return;
  }
  
  const dataToSend = { ...formData };
  if (isEditMode && !dataToSend.password) {
    delete dataToSend.password;
  }

  try {
    await axios[method](url, dataToSend, { headers });
    onSuccess(); // Panggil fungsi callback untuk refresh data
    onClose();   // Tutup modal/dialog
  } catch (err) {
    setError(err.response?.data?.error || 'Terjadi kesalahan.');
  }
};

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>{isEditMode ? 'Edit Data Guru' : 'Tambah Guru Baru'}</DialogTitle>
      <DialogContent>
        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
        <TextField
          autoFocus
          margin="dense"
          name="nama"
          label="Nama Lengkap"
          type="text"
          fullWidth
          variant="outlined"
          value={formData.nama}
          onChange={handleChange}
        />
        <TextField
          margin="dense"
          name="email"
          label="Alamat Email"
          type="email"
          fullWidth
          variant="outlined"
          value={formData.email}
          onChange={handleChange}
        />
        <TextField
          margin="dense"
          name="password"
          label="Password"
          type="password"
          fullWidth
          variant="outlined"
          value={formData.password}
          onChange={handleChange}
          helperText={isEditMode ? 'Kosongkan jika tidak ingin mengganti password' : ''}
        />
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Batal</Button>
        <Button onClick={handleSubmit} variant="contained">{isEditMode ? 'Simpan Perubahan' : 'Tambah Guru'}</Button>
      </DialogActions>
    </Dialog>
  );
}


function AdminPanel() {
  const [gurus, setGurus] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [formOpen, setFormOpen] = useState(false);
  const [editingGuru, setEditingGuru] = useState(null);
  
  // State untuk dialog QR Code
  const [qrDialogOpen, setQrDialogOpen] = useState(false);
  const [qrCodeImage, setQrCodeImage] = useState('');
  const [qrUser, setQrUser] = useState('');
  const [countdown, setCountdown] = useState(5);


  const fetchGurus = async () => {
  setLoading(true);
  setError('');
  try {
    // ✅ Definisikan URL API secara dinamis
    const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';
    const token = localStorage.getItem('token');
    
    // ✅ Gunakan variabel API_URL saat memanggil axios
    const response = await axios.get(`${API_URL}/api/gurus`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    setGurus(response.data);
  } catch (err) {
    setError('Gagal memuat data guru.');
    console.error("Gagal mengambil data guru:", err);
  } finally {
    setLoading(false);
  }
};

  useEffect(() => {
    fetchGurus();
  }, []);

  const handleOpenForm = (guru = null) => {
    setEditingGuru(guru);
    setFormOpen(true);
  };

  const handleCloseForm = () => {
    setFormOpen(false);
    setEditingGuru(null);
  };

  const handleSuccess = () => {
    fetchGurus();
  };

  const handleDelete = async (guruId) => {
  if (window.confirm('Apakah Anda yakin ingin menghapus data guru ini?')) {
    try {
      // ✅ Definisikan URL API secara dinamis
      const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';
      const token = localStorage.getItem('token');
      
      // ✅ Gunakan variabel API_URL saat memanggil axios
      await axios.delete(`${API_URL}/api/gurus/${guruId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      // Panggil fetchGurus untuk memperbarui daftar setelah hapus
      fetchGurus();
    } catch (err) {
      setError('Gagal menghapus data guru.');
      console.error("Gagal menghapus guru:", err);
    }
  }
};

  const handleGenerateQr = async (guru) => {
  if (!guru) return;
  try {
    // ✅ Definisikan URL API secara dinamis
    const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';
    const token = localStorage.getItem('token');
    
    // ✅ Gunakan variabel API_URL saat memanggil axios
    const response = await axios.post(
      `${API_URL}/api/qrcode/generate`, 
      { userId: guru.id, userName: guru.nama },
      { headers: { Authorization: `Bearer ${token}` } }
    );
    
    setQrCodeImage(response.data.qrCodeImage);
    setQrUser(guru);
    setQrDialogOpen(true);
  } catch (error) {
    console.error("Gagal generate QR Code:", error);
    setError("Gagal membuat QR Code.");
  }
};

  // useEffect untuk menangani countdown dan refresh QR code
  useEffect(() => {
    if (!qrDialogOpen || !qrUser) return;

    // Set countdown awal
    setCountdown(10);

    // Timer untuk mengurangi countdown setiap detik
    const countdownInterval = setInterval(() => {
      setCountdown(prev => (prev > 0 ? prev - 1 : 0));
    }, 1000);

    // Timer untuk me-refresh QR code setiap 10 detik
    const refreshInterval = setInterval(() => {
      handleGenerateQr(qrUser);
      setCountdown(10); // Reset countdown
    }, 10000);

    // Cleanup: Hapus interval saat dialog ditutup
    return () => {
      clearInterval(countdownInterval);
      clearInterval(refreshInterval);
    };
  }, [qrDialogOpen, qrUser]);

  // Helper function untuk mendapatkan warna dari nama (untuk Avatar)
  function stringToColor(string) {
    let hash = 0;
    let i;
    for (i = 0; i < string.length; i += 1) {
      hash = string.charCodeAt(i) + ((hash << 5) - hash);
    }
    let color = '#';
    for (i = 0; i < 3; i += 1) {
      const value = (hash >> (i * 8)) & 0xff;
      color += `00${value.toString(16)}`.slice(-2);
    }
    return color;
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1" sx={{ fontWeight: 'bold', color: '#5a5c69' }}>
          Manajemen Guru
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => handleOpenForm()}
          sx={{ textTransform: 'none', fontWeight: 'bold', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}
        >
          Tambah Guru
        </Button>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      <UserForm 
        open={formOpen}
        onClose={handleCloseForm}
        onSuccess={handleSuccess}
        userToEdit={editingGuru}
      />
      
      <Card elevation={0} sx={{ borderRadius: '12px', border: '1px solid #e3e6f0' }}>
        <TableContainer>
          <Table sx={{ minWidth: 650 }} aria-label="Tabel Guru">
            <TableHead>
              {/* PERBAIKAN: Gaya header yang lebih bersih */}
              <TableRow sx={{ bgcolor: '#f8f9fc' }}>
                <TableCell sx={{ fontWeight: '600', color: 'text.secondary', border: 0 }}>Nama</TableCell>
                <TableCell sx={{ fontWeight: '600', color: 'text.secondary', border: 0 }}>Email</TableCell>
                <TableCell align="center" sx={{ fontWeight: '600', color: 'text.secondary', border: 0 }}>Aksi</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={3} align="center">
                    <CircularProgress />
                  </TableCell>
                </TableRow>
              ) : (
                gurus.map((guru) => (
                  <TableRow 
                    key={guru.id} 
                    hover 
                    // PERBAIKAN: Menghapus sx yang menghilangkan border bawah
                  >
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <Avatar sx={{ bgcolor: stringToColor(guru.nama), width: 40, height: 40, mr: 2 }}>
                          {guru.nama.charAt(0)}
                        </Avatar>
                        <Box>
                          <Typography variant="body1" sx={{ fontWeight: '600' }}>
                            {guru.nama}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            ID: {guru.id}
                          </Typography>
                        </Box>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body1" color="text.secondary">
                        {guru.email}
                      </Typography>
                    </TableCell>
                    <TableCell align="center">
                      <Stack direction="row" spacing={1} justifyContent="center">
                        <Tooltip title="Generate QR Code">
                          <IconButton size="small" onClick={() => handleGenerateQr(guru)}>
                            <QrCode2Icon color="info" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Edit Guru">
                          <IconButton size="small" onClick={() => handleOpenForm(guru)}>
                            <EditIcon color="warning" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Hapus Guru">
                          <IconButton size="small" onClick={() => handleDelete(guru.id)}>
                            <DeleteIcon color="error" />
                          </IconButton>
                        </Tooltip>
                      </Stack>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Card>

      {/* Dialog untuk menampilkan QR Code */}
      <Dialog open={qrDialogOpen} onClose={() => setQrDialogOpen(false)}>
        <DialogTitle>QR Code untuk: {qrUser?.nama}</DialogTitle>
        <DialogContent sx={{ textAlign: 'center' }}>
          {qrCodeImage ? (
            <img src={qrCodeImage} alt={`QR Code for ${qrUser?.nama}`} />
          ) : (
            <CircularProgress />
          )}
          <DialogContentText sx={{ mt: 2 }}>
            QR Code ini akan diperbarui secara otomatis.
          </DialogContentText>
          <Box sx={{ width: '100%', mt: 2 }}>
            <LinearProgress variant="determinate" value={countdown * 10} />
            <Typography variant="caption">
              Memperbarui dalam {countdown} detik...
            </Typography>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setQrDialogOpen(false)}>Tutup</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

export default AdminPanel;
