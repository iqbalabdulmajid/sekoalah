import React, { useState, useEffect } from "react";
import axios from "axios";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import timezone from "dayjs/plugin/timezone";
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
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import DeleteIcon from "@mui/icons-material/Delete";

// Extend dayjs with UTC and timezone
dayjs.extend(utc);
dayjs.extend(timezone);

// ✅ Format waktu tergantung environment (local vs vercel)
const formatTimeManual = (waktu) => {
  if (!waktu) return "-";
  const isLocalhost =
    typeof window !== "undefined" && window.location.hostname === "localhost";

  let time = dayjs.utc(waktu);
  if (isLocalhost) {
    time = time.add(7, "hour");
  }

  return time.format("HH:mm");
};



// Komponen Form
function JadwalForm({ open, onClose, onSuccess, gurus }) {
  const [formData, setFormData] = useState({
    guru_id: "",
    mata_pelajaran: "",
    waktu_mulai: "",
    waktu_selesai: "",
  });
  const [error, setError] = useState("");

  useEffect(() => {
    if (open) {
      setFormData({
        guru_id: "",
        mata_pelajaran: "",
        waktu_mulai: "",
        waktu_selesai: "",
      });
      setError("");
    }
  }, [open]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async () => {
    setError("");
    const token = localStorage.getItem("token");
    const API_URL = process.env.REACT_APP_API_URL || "http://localhost:5000";

    try {
      await axios.post(`${API_URL}/api/jadwal`, formData, {
        headers: { Authorization: `Bearer ${token}` },
      });
      onSuccess();
      onClose();
    } catch (err) {
      setError(err.response?.data?.error || "Gagal membuat jadwal.");
    }
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>Buat Jadwal Baru</DialogTitle>
      <DialogContent>
        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
        <TextField
          select
          margin="dense"
          name="guru_id"
          label="Pilih Guru"
          fullWidth
          variant="outlined"
          value={formData.guru_id}
          onChange={handleChange}
        >
          <MenuItem value="">-- Tidak ada yang dipilih --</MenuItem>
          {gurus.map((guru) => (
            <MenuItem key={guru.id} value={guru.id}>{guru.nama}</MenuItem>
          ))}
        </TextField>
        <TextField
          margin="dense"
          name="mata_pelajaran"
          label="Mata Pelajaran"
          type="text"
          fullWidth
          variant="outlined"
          value={formData.mata_pelajaran}
          onChange={handleChange}
        />
        <TextField
          margin="dense"
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
          margin="dense"
          name="waktu_selesai"
          label="Waktu Selesai"
          type="datetime-local"
          fullWidth
          variant="outlined"
          value={formData.waktu_selesai}
          onChange={handleChange}
          InputLabelProps={{ shrink: true }}
        />
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Batal</Button>
        <Button onClick={handleSubmit} variant="contained">Simpan Jadwal</Button>
      </DialogActions>
    </Dialog>
  );
}

function ManajemenJadwal() {
  const [jadwal, setJadwal] = useState([]);
  const [gurus, setGurus] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [formOpen, setFormOpen] = useState(false);
  const token = localStorage.getItem("token");

  const fetchData = async () => {
    setLoading(true);
    setError("");

    try {
      const API_URL = process.env.REACT_APP_API_URL || "http://localhost:5000";
      const headers = { headers: { Authorization: `Bearer ${token}` } };

      const [jadwalRes, guruRes] = await Promise.all([
        axios.get(`${API_URL}/api/jadwal`, headers),
        axios.get(`${API_URL}/api/gurus`, headers),
      ]);

      setJadwal(jadwalRes.data);
      setGurus(guruRes.data);
    } catch (err) {
      setError("Gagal memuat data dari server.");
      console.error("Gagal mengambil data", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleDelete = async (jadwalId) => {
    if (window.confirm("Apakah Anda yakin ingin menghapus jadwal ini?")) {
      try {
        const API_URL = process.env.REACT_APP_API_URL || "http://localhost:5000";
        await axios.delete(`${API_URL}/api/jadwal/${jadwalId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        fetchData();
      } catch (err) {
        setError("Gagal menghapus jadwal.");
        console.error(err);
      }
    }
  };

  return (
    <Box>
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 3 }}>
        <Typography variant="h4" component="h1" sx={{ fontWeight: "bold", color: "#5a5c69" }}>
          Manajemen Jadwal
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => setFormOpen(true)}
          sx={{ textTransform: "none", fontWeight: "bold", boxShadow: "0 4px 6px rgba(0,0,0,0.1)" }}
        >
          Buat Jadwal
        </Button>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      <JadwalForm open={formOpen} onClose={() => setFormOpen(false)} onSuccess={fetchData} gurus={gurus} />

      <Card elevation={0} sx={{ borderRadius: "12px", border: "1px solid #e3e6f0" }}>
        <TableContainer>
          <Table sx={{ minWidth: 650 }} aria-label="Tabel Jadwal">
            <TableHead>
              <TableRow sx={{ bgcolor: "#f8f9fc" }}>
                <TableCell sx={{ fontWeight: "600", color: "text.secondary", border: 0 }}>Nama Guru</TableCell>
                <TableCell sx={{ fontWeight: "600", color: "text.secondary", border: 0 }}>Mata Pelajaran</TableCell>
                <TableCell sx={{ fontWeight: "600", color: "text.secondary", border: 0 }}>Waktu Mulai</TableCell>
                <TableCell sx={{ fontWeight: "600", color: "text.secondary", border: 0 }}>Waktu Selesai</TableCell>
                <TableCell align="center" sx={{ fontWeight: "600", color: "text.secondary", border: 0 }}>Aksi</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={5} align="center">
                    <CircularProgress />
                  </TableCell>
                </TableRow>
              ) : (
                jadwal.map((item) => (
                  <TableRow key={item.id} hover>
                    <TableCell>
                      <Typography variant="body1" sx={{ fontWeight: "600" }}>{item.nama_guru}</Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" color="text.secondary">{item.mata_pelajaran}</Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" color="text.secondary">{formatTimeManual(item.waktu_mulai)}</Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" color="text.secondary">{formatTimeManual(item.waktu_selesai)}</Typography>
                    </TableCell>
                    <TableCell align="center">
                      <Tooltip title="Hapus Jadwal">
                        <IconButton size="small" onClick={() => handleDelete(item.id)}>
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
