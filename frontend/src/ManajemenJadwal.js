import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';

// Import komponen MUI
import {
  Box,
  Typography,
  Button,
  Card,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  TextField,
  MenuItem,
  CircularProgress,
  Alert,
  Tooltip,
  Stack
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';

// Definisikan URL API di satu tempat untuk kemudahan pengelolaan
const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

// Komponen Form terpisah untuk kerapian
function JadwalForm({ open, onClose, onSuccess, gurus }) {
  const [formData, setFormData] = useState({
    guru_id: '',
    mata_pelajaran: '',
    waktu_mulai: '',
    waktu_selesai: ''
  });
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (open) {
      // Reset form setiap kali dialog dibuka
      setFormData({
        guru_id: '',
        mata_pelajaran: '',
        waktu_mulai: '',
        waktu_selesai: ''
      });
      setError('');
    }
  }, [open]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async () => {
    // Validasi sederhana
    if (!formData.guru_id || !formData.mata_pelajaran || !formData.waktu_mulai || !formData.waktu_selesai) {
        setError('Semua kolom wajib diisi.');
        return;
    }

    setError('');
    setIsSubmitting(true);
    const token = localStorage.getItem('token');
    
    // ✅ FIX: Konversi waktu dari input 'datetime-local' ke format ISO UTC.
    // Ini memastikan backend menerima waktu yang benar (dalam UTC) terlepas dari
    // zona waktu server, sehingga saat ditampilkan kembali akan sesuai dengan waktu lokal Indonesia.
    const dataToSend = {
        ...formData,
        waktu_mulai: new Date(formData.waktu_mulai).toISOString(),
        waktu_selesai: new Date(formData.waktu_selesai).toISOString(),
    };

    try {
      await axios.post(`${API_URL}/api/jadwal`, dataToSend, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      onSuccess(); // Panggil fungsi callback untuk refresh data
      onClose();   // Tutup modal/dialog
    } catch (err) {
      setError(err.response?.data?.error || 'Gagal membuat jadwal.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>Buat Jadwal Baru</DialogTitle>
      <DialogContent>
        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
        <Stack spacing={2} sx={{ pt: 1 }}>
          <TextField
            select
            name="guru_id"
            label="Pilih Guru"
            fullWidth
            variant="outlined"
            value={formData.guru_id}
            onChange={handleChange}
          >
            <MenuItem value="">-- Tidak ada yang dipilih --</MenuItem>
            {gurus.map(guru => (
              <MenuItem key={guru.id} value={guru.id}>{guru.nama}</MenuItem>
            ))}
          </TextField>
          <TextField
            name="mata_pelajaran"
            label="Mata Pelajaran"
            type="text"
            fullWidth
            variant="outlined"
            value={formData.mata_pelajaran}
            onChange={handleChange}
          />
          <TextField
            name="waktu_mulai"
            label="Waktu Mulai"
            type="datetime-local"
            fullWidth
            variant="outlined"
            value={formData.waktu_mulai}
            onChange={handleChange}
            InputLabelProps={{ shrink: true }}
          />
          <TextField
            name="waktu_selesai"
            label="Waktu Selesai"
            type="datetime-local"
            fullWidth
            variant="outlined"
            value={formData.waktu_selesai}
            onChange={handleChange}
            InputLabelProps={{ shrink: true }}
          />
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={isSubmitting}>Batal</Button>
        <Button onClick={handleSubmit} variant="contained" disabled={isSubmitting}>
            {isSubmitting ? <CircularProgress size={24} /> : 'Simpan Jadwal'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

// Komponen baru untuk dialog konfirmasi hapus
function ConfirmationDialog({ open, onClose, onConfirm, title, content }) {
    return (
        <Dialog open={open} onClose={onClose}>
            <DialogTitle>{title}</DialogTitle>
            <DialogContent>
                <Typography>{content}</Typography>
            </DialogContent>
            <DialogActions>
                <Button onClick={onClose}>Batal</Button>
                <Button onClick={onConfirm} color="error" autoFocus>
                    Hapus
                </Button>
            </DialogActions>
        </Dialog>
    );
}


function ManajemenJadwal() {
  const [jadwal, setJadwal] = useState([]);
  const [gurus, setGurus] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [formOpen, setFormOpen] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState({ open: false, id: null });
  
  const fetchData = useCallback(async () => {
    setLoading(true);
    setError('');
    const token = localStorage.getItem('token');

    try {
      const headers = { headers: { Authorization: `Bearer ${token}` } };
      
      const [jadwalRes, guruRes] = await Promise.all([
        axios.get(`${API_URL}/api/jadwal`, headers),
        axios.get(`${API_URL}/api/gurus`, headers)
      ]);

      setJadwal(jadwalRes.data);
      setGurus(guruRes.data);
    } catch (err) {
      setError('Gagal memuat data dari server.');
      console.error('Gagal mengambil data', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleDeleteClick = (jadwalId) => {
    setConfirmDelete({ open: true, id: jadwalId });
  };

  const executeDelete = async () => {
    const jadwalId = confirmDelete.id;
    try {
      const token = localStorage.getItem('token');
      await axios.delete(`${API_URL}/api/jadwal/${jadwalId}`, { 
        headers: { Authorization: `Bearer ${token}` } 
      });
      
      setConfirmDelete({ open: false, id: null }); // Tutup dialog
      fetchData(); // Refresh data
    } catch (err) {
      setError('Gagal menghapus jadwal.');
      console.error(err);
    }
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1" sx={{ fontWeight: 'bold', color: '#5a5c69' }}>
          Manajemen Jadwal
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => setFormOpen(true)}
          sx={{ textTransform: 'none', fontWeight: 'bold', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}
        >
          Buat Jadwal
        </Button>
      </Box>
      
      {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>{error}</Alert>}

      <JadwalForm 
        open={formOpen}
        onClose={() => setFormOpen(false)}
        onSuccess={fetchData}
        gurus={gurus}
      />

      <ConfirmationDialog
        open={confirmDelete.open}
        onClose={() => setConfirmDelete({ open: false, id: null })}
        onConfirm={executeDelete}
        title="Konfirmasi Hapus"
        content="Apakah Anda yakin ingin menghapus jadwal ini? Tindakan ini tidak dapat dibatalkan."
      />

      <Card elevation={0} sx={{ borderRadius: '12px', border: '1px solid #e3e6f0' }}>
        <TableContainer>
          <Table sx={{ minWidth: 650 }} aria-label="Tabel Jadwal">
            <TableHead>
              <TableRow sx={{ bgcolor: '#f8f9fc' }}>
                <TableCell sx={{ fontWeight: '600', color: 'text.secondary', border: 0 }}>Nama Guru</TableCell>
                <TableCell sx={{ fontWeight: '600', color: 'text.secondary', border: 0 }}>Mata Pelajaran</TableCell>
                <TableCell sx={{ fontWeight: '600', color: 'text.secondary', border: 0 }}>Waktu Mulai</TableCell>
                <TableCell sx={{ fontWeight: '600', color: 'text.secondary', border: 0 }}>Waktu Selesai</TableCell>
                <TableCell align="center" sx={{ fontWeight: '600', color: 'text.secondary', border: 0 }}>Aksi</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={5} align="center" sx={{ py: 5 }}>
                    <CircularProgress />
                  </TableCell>
                </TableRow>
              ) : (
                jadwal.map((item) => (
                  <TableRow key={item.id} hover>
                    <TableCell>
                      <Typography variant="body1" sx={{ fontWeight: '600' }}>
                        {item.nama_guru}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" color="text.secondary">
                        {item.mata_pelajaran}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" color="text.secondary">
                        {new Date(item.waktu_mulai).toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' })}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" color="text.secondary">
                        {new Date(item.waktu_selesai).toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' })}
                      </Typography>
                    </TableCell>
                    <TableCell align="center">
                      <Tooltip title="Hapus Jadwal">
                        <IconButton size="small" onClick={() => handleDeleteClick(item.id)}>
                          <DeleteIcon color="error" />
                        </IconButton>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Card>
    </Box>
  );
}

export default ManajemenJadwal;
