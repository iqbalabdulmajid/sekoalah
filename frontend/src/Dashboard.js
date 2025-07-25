import React, { useState, useEffect, useCallback, useRef } from "react";
import axios from "axios";
import { jwtDecode } from "jwt-decode";
import { Html5Qrcode, Html5QrcodeScanner } from "html5-qrcode";

// Import komponen-komponen MUI
import {
  AppBar,
  Alert,
  Box,
  Toolbar,
  Typography,
  Button,
  Card,
  CardContent,
  Grid,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  CircularProgress,
  Chip,
  Stack,
  Paper,
  Container,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Divider,
  LinearProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  IconButton,
  DialogActions,
  Menu,
  MenuItem,
} from "@mui/material";

// Import Ikon
import QrCodeScannerIcon from "@mui/icons-material/QrCodeScanner";
import TodayIcon from "@mui/icons-material/Today";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import EventAvailableIcon from "@mui/icons-material/EventAvailable";
import PersonIcon from "@mui/icons-material/Person";
import AccessTimeIcon from "@mui/icons-material/AccessTime";
import SchoolIcon from "@mui/icons-material/School";
import AssignmentIcon from "@mui/icons-material/Assignment";
import CalendarTodayIcon from "@mui/icons-material/CalendarToday";
import LogoutIcon from "@mui/icons-material/Logout";
import CloseIcon from "@mui/icons-material/Close";
import PhotoCameraIcon from "@mui/icons-material/PhotoCamera";
import UploadFileIcon from "@mui/icons-material/UploadFile";
import NotificationsIcon from "@mui/icons-material/Notifications";
import { Snackbar } from "@mui/material";

// --- STYLED COMPONENTS --- //

const ModernCard = ({ children, sx, ...props }) => (
  <Card
    elevation={0}
    sx={{
      borderRadius: "20px",
      background: "rgba(255, 255, 255, 0.95)",
      backdropFilter: "blur(10px)",
      border: "1px solid rgba(255, 255, 255, 0.2)",
      height: "100%",
      maxWidth: "100%",
      size: "100%",
      display: "flex",
      marginRight: "1rem",
      overflow: "hidden",
    }}
    {...props}
  >
    {children}
  </Card>
);
//buat modern table
const ModernTable = ({ children, sx, ...props }) => (
  <Card
    elevation={3}
    sx={{
      borderRadius: "20px",
      background: "rgba(255, 255, 255, 0.95)",
      backdropFilter: "blur(10px)",
      border: "1px solid rgba(255, 255, 255, 0.2)",
      width: "100%", // ⬅️ Full lebar
      maxWidth: "none", // ⬅️ Tidak dibatasi
      px: { xs: 2, md: 4 }, // ⬅️ Jarak kiri-kanan responsif
      py: 3,
      boxShadow: "0 8px 32px 0 rgba(0, 0, 0, 0.1)",
      ...sx,
    }}
    {...props}
  >
    {children}
  </Card>
);

// --- REFACTORED & NEW COMPONENTS --- //

const StatCard = ({ title, value, icon, gradient }) => (
  <Card
    elevation={0}
    sx={{
      borderRadius: "20px",
      background: gradient,
      color: "white",
      p: 3,
      width: "100%", // ✅ WAJIB: mengikuti lebar Grid item
      height: "130px",
      display: "flex",
      flexDirection: "column",
      justifyContent: "space-between",
      position: "relative",
      overflow: "hidden",
      boxShadow: "0 8px 32px 0 rgba(0, 0, 0, 0.15)",
      "&::before": {
        content: '""',
        position: "absolute",
        top: -20,
        right: -20,
        width: "120px",
        height: "120px",
        background: "rgba(255,255,255,0.1)",
        borderRadius: "50%",
      },
    }}
  >
    <Box
      sx={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "flex-start",
      }}
    >
      <Box>
        <Typography variant="h4" sx={{ fontWeight: "bold" }}>
          {value}
        </Typography>
        <Typography variant="body1" sx={{ opacity: 0.9 }}>
          {title}
        </Typography>
      </Box>
      <Box
        sx={{
          bgcolor: "rgba(255,255,255,0.2)",
          borderRadius: "12px",
          p: 1.5,
          display: "flex",
        }}
      >
        {icon}
      </Box>
    </Box>
  </Card>
);

const UserProfileCard = ({ user, currentTime }) => (
  <ModernCard>
    <CardContent
      sx={{
        p: { xs: 2, sm: 3 },
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        height: "100%",
        textAlign: "center",
      }}
    >
      <Box
        sx={{
          background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
          borderRadius: "50%",
          width: { xs: 80, md: 100 },
          height: { xs: 80, md: 100 },
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          mx: "auto",
          mb: 2,
          boxShadow: "0 8px 24px rgba(102, 126, 234, 0.4)",
        }}
      >
        <PersonIcon sx={{ fontSize: { xs: 40, md: 48 }, color: "white" }} />
      </Box>
      <Typography
        variant="h5"
        component="h2"
        sx={{
          mb: 1,
          fontWeight: "bold",
          color: "#333",
          fontSize: { xs: "1.1rem", sm: "1.25rem" },
        }}
      >
        {user?.nama}
      </Typography>
      <Typography
        sx={{
          color: "#666",
          fontWeight: 500,
          mb: 2,
          fontSize: { xs: "0.9rem", sm: "1rem" },
        }}
      >
        Guru / Pengajar
      </Typography>
      <Typography variant="body2" sx={{ color: "#888", fontSize: "0.8rem" }}>
        {currentTime.toLocaleDateString("id-ID", {
          weekday: "long",
          year: "numeric",
          month: "long",
          day: "numeric",
        })}
      </Typography>
    </CardContent>
  </ModernCard>
);

const PresenceCard = ({ onOpenModal }) => (
  <ModernCard>
    <CardContent
      sx={{
        p: 3,
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        height: "100%",
        textAlign: "center",
      }}
    >
      <Typography
        variant="h6"
        component="h2"
        sx={{ mb: 2, fontWeight: "bold", color: "#333" }}
      >
        Presensi Kehadiran
      </Typography>
      <Typography variant="body2" sx={{ mb: 3, color: "#666" }}>
        Pindai atau unggah QR Code untuk mencatat kehadiran Anda.
      </Typography>
      <Button
        variant="contained"
        size="large"
        startIcon={<QrCodeScannerIcon />}
        onClick={onOpenModal}
        sx={{
          background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
          borderRadius: "12px",
          py: 1.5,
          px: 3,
          fontSize: "0.9rem",
          textTransform: "none",
          boxShadow: "0 8px 24px rgba(102, 126, 234, 0.3)",
          "&:hover": {
            background: "linear-gradient(135deg, #5a67d8 0%, #6b5b95 100%)",
            boxShadow: "0 12px 32px rgba(102, 126, 234, 0.5)",
          },
        }}
      >
        Pindai QR
      </Button>
    </CardContent>
  </ModernCard>
);

const QrScannerModal = ({
  open,
  handleClose,
  handleScanResult,
  setInfoMessage,
}) => {
  const [scanMode, setScanMode] = useState("select"); // 'select', 'camera'
  const fileInputRef = useRef(null);
  const scannerRef = useRef(null);

  const onModalClose = () => {
    if (scannerRef.current && scannerRef.current.getState() === 2) {
      scannerRef.current
        .clear()
        .catch((err) => console.error("Gagal membersihkan scanner.", err));
    }
    scannerRef.current = null;
    setScanMode("select");
    handleClose();
  };

  useEffect(() => {
    if (open && scanMode === "camera" && !scannerRef.current) {
      const scanner = new Html5QrcodeScanner(
        "qr-reader-modal",
        { fps: 10, qrbox: { width: 250, height: 250 }, supportedScanTypes: [] },
        false
      );

      const onScanSuccess = (decodedText, decodedResult) => {
        if (scanner.getState() === 2) {
          scanner.clear();
          scannerRef.current = null;
          handleScanResult(decodedText);
        }
      };

      scanner.render(onScanSuccess);
      scannerRef.current = scanner;
    }
  }, [open, scanMode, handleScanResult]);

  const handleFileChange = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const html5QrCode = new Html5Qrcode("qr-reader-modal");
      const result = await html5QrCode.scanFile(file, false);
      handleScanResult(result);
    } catch (err) {
      setInfoMessage(
        "Gagal memindai QR code dari gambar. Pastikan gambar jelas."
      );
      onModalClose();
    }
  };

  return (
    <Dialog open={open} onClose={onModalClose} maxWidth="sm" fullWidth>
      <DialogTitle
        sx={{
          fontWeight: "bold",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        Pindai Presensi
        <IconButton onClick={onModalClose}>
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      <DialogContent dividers>
        {scanMode === "select" && (
          <Stack spacing={2} sx={{ p: 2 }}>
            <Button
              variant="outlined"
              size="large"
              startIcon={<PhotoCameraIcon />}
              onClick={() => setScanMode("camera")}
            >
              Pindai dengan Kamera
            </Button>
            <Button
              variant="outlined"
              size="large"
              startIcon={<UploadFileIcon />}
              onClick={() => fileInputRef.current?.click()}
            >
              Unggah Gambar QR
            </Button>
            <input
              type="file"
              accept="image/*"
              ref={fileInputRef}
              onChange={handleFileChange}
              style={{ display: "none" }}
            />
          </Stack>
        )}
        <Box
          id="qr-reader-modal"
          sx={{
            width: "100%",
            mx: "auto",
            "& > div": {
              border: "none !important",
              borderRadius: "12px !important",
            },
            display: scanMode === "camera" ? "block" : "none",
          }}
        />
      </DialogContent>
      {scanMode === "camera" && (
        <DialogActions>
          <Button onClick={() => setScanMode("select")}>Kembali</Button>
        </DialogActions>
      )}
    </Dialog>
  );
};

const QuickStats = ({ jadwal, isPresent, currentTime, onStatusChange }) => {
  const currentSchedule = jadwal.find((j) => {
    const startTime = new Date(j.waktu_mulai);
    const endTime = new Date(j.waktu_selesai);
    return currentTime >= startTime && currentTime < endTime;
  });

  const [anchorEl, setAnchorEl] = useState(null);
  const handleChipClick = (event) => setAnchorEl(event.currentTarget);
  const handleMenuClose = () => setAnchorEl(null);

  const handleStatusSelect = (status) => {
    onStatusChange(status);
    setAnchorEl(null);
  };

  return (
    <ModernCard>
      <CardContent sx={{ p: 3 }}>
        <Typography
          variant="h6"
          sx={{
            mb: 2,
            fontWeight: "bold",
            color: "#333",
            display: "flex",
            alignItems: "center",
            gap: 1,
          }}
        >
          <AssignmentIcon color="primary" /> Info Cepat
        </Typography>
        <List sx={{ p: 0, "& .MuiListItem-root": { px: 0 } }}>
          <ListItem>
            <ListItemIcon>
              <AccessTimeIcon color="primary" />
            </ListItemIcon>
            <ListItemText
              primary="Waktu Sekarang"
              secondary={currentTime.toLocaleTimeString("id-ID", {
                hour: "2-digit",
                minute: "2-digit",
                second: "2-digit",
              })}
            />
          </ListItem>
          <Divider component="li" />
          <ListItem>
            <ListItemIcon>
              <SchoolIcon color={currentSchedule ? "success" : "action"} />
            </ListItemIcon>
            <ListItemText
              primary="Kelas Berlangsung"
              secondary={
                currentSchedule ? currentSchedule.mata_pelajaran : "Tidak ada"
              }
            />
          </ListItem>
          <Divider component="li" />
          <ListItem>
            <ListItemIcon>
              <EventAvailableIcon color={isPresent ? "success" : "warning"} />
            </ListItemIcon>
            <ListItemText primary="Status Kehadiran" />
            <Chip
              label={isPresent ? "Sudah Tercatat" : "Belum Hadir"}
              color={isPresent ? "success" : "warning"}
              size="small"
              onClick={handleChipClick}
              style={{ cursor: "pointer" }}
            />
            <Menu
              anchorEl={anchorEl}
              open={Boolean(anchorEl)}
              onClose={handleMenuClose}
            >
              <MenuItem onClick={() => handleStatusSelect("Izin")}>
                Izin
              </MenuItem>
              <MenuItem onClick={() => handleStatusSelect("Sakit")}>
                Sakit
              </MenuItem>
            </Menu>
          </ListItem>
        </List>
      </CardContent>
    </ModernCard>
  );
};

const DailyProgress = ({ jadwal }) => {
  const totalJadwal = jadwal.length;
  const selesaiCount = jadwal.filter((j) => j.status === "selesai").length;
  const berlangsungCount = jadwal.filter(
    (j) => j.status === "berlangsung"
  ).length;
  const progressPercentage =
    totalJadwal > 0 ? (selesaiCount / totalJadwal) * 100 : 0;

  return (
    <ModernCard>
      <CardContent sx={{ p: 3 }}>
        <Typography
          variant="h6"
          sx={{ mb: 2, fontWeight: "bold", color: "#333" }}
        >
          Progress Mengajar
        </Typography>
        <Box sx={{ mb: 2 }}>
          <Box sx={{ display: "flex", justifyContent: "space-between", mb: 1 }}>
            <Typography variant="body2" color="text.secondary">
              Kemajuan
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {Math.round(progressPercentage)}%
            </Typography>
          </Box>
          <LinearProgress
            variant="determinate"
            value={progressPercentage}
            sx={{
              height: 10,
              borderRadius: 5,
              bgcolor: "rgba(102, 126, 234, 0.1)",
              "& .MuiLinearProgress-bar": {
                borderRadius: 5,
                background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
              },
            }}
          />
        </Box>
        <Grid container spacing={3} sx={{ textAlign: "center" }}>
          <Grid item xs={4}>
            <Typography
              variant="h5"
              sx={{ fontWeight: "bold", color: "#667eea" }}
            >
              {totalJadwal}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Total
            </Typography>
          </Grid>
          <Grid item xs={4}>
            <Typography
              variant="h5"
              sx={{ fontWeight: "bold", color: "#f39c12" }}
            >
              {berlangsungCount}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Berlangsung
            </Typography>
          </Grid>
          <Grid item xs={4}>
            <Typography
              variant="h5"
              sx={{ fontWeight: "bold", color: "#27ae60" }}
            >
              {selesaiCount}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Selesai
            </Typography>
          </Grid>
        </Grid>
      </CardContent>
    </ModernCard>
  );
};

// --- MAIN DASHBOARD COMPONENT --- //

function Dashboard() {
  const [message, setMessage] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [jadwal, setJadwal] = useState([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [isPresent, setIsPresent] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [notification, setNotification] = useState({
    open: false,
    message: "",
  });
  const [notifiedJadwalIds, setNotifiedJadwalIds] = useState([]);

  const token = localStorage.getItem("token");

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const checkUpcomingSchedule = () => {
      const now = new Date();

      jadwal.forEach((item) => {
        const startTime = new Date(item.waktu_mulai);
        const timeDiffMinutes =
          (startTime.getTime() - now.getTime()) / 1000 / 60;

        // Cek jika jadwal akan datang dalam 60 menit dan belum pernah dinotifikasi
        if (
          timeDiffMinutes > 59 &&
          timeDiffMinutes <= 60 &&
          !notifiedJadwalIds.includes(item.id)
        ) {
          setNotification({
            open: true,
            message: `Pelajaran "${item.mata_pelajaran}" akan dimulai dalam 1 jam!`,
          });
          // Tambahkan ID jadwal ke daftar yang sudah dinotifikasi
          setNotifiedJadwalIds((prev) => [...prev, item.id]);
        }
      });
    };

    // Jalankan pengecekan setiap menit
    const notificationInterval = setInterval(checkUpcomingSchedule, 60000);

    // Bersihkan interval saat komponen ditutup
    return () => clearInterval(notificationInterval);
  }, [jadwal, notifiedJadwalIds]); // Dijalankan ulang jika jadwal berubah

  const handleCloseNotification = (event, reason) => {
    if (reason === "clickaway") {
      return;
    }
    setNotification({ ...notification, open: false });
  };

  const fetchInitialData = useCallback(async () => {
  if (!token) return;
  setLoading(true);
  
  // ✅ Definisikan URL API secara dinamis
  const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

  try {
    const headers = { headers: { Authorization: `Bearer ${token}` } };
    
    // ✅ Gunakan variabel API_URL di kedua panggilan
    const [jadwalRes, presensiRes] = await Promise.all([
      axios.get(`${API_URL}/api/jadwal/saya`, headers),
      axios.get(`${API_URL}/api/presensi/status`, headers),
    ]);
    
    setJadwal(jadwalRes.data);
    setIsPresent(presensiRes.data.isPresent);
  } catch (error) {
    console.error("Gagal mengambil data awal:", error);
    setMessage("Gagal memuat data. Periksa koneksi Anda.");
  } finally {
    setLoading(false);
  }
}, [token]); // Dependency array sudah benar

  useEffect(() => {
    if (token) {
      setUser(jwtDecode(token));
      fetchInitialData();
    }
  }, [token, fetchInitialData]);

  const handleScanResult = useCallback(
  async (scannedData) => { // ✅ Jadikan fungsi ini async
    setIsModalOpen(false);

    // ✅ Definisikan URL API secara dinamis
    const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

    // ✅ Gunakan try...catch untuk penanganan error yang lebih bersih
    try {
      const response = await axios.post(
        `${API_URL}/api/presensi/scan`, // ✅ Gunakan variabel API_URL
        { qrData: scannedData },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      // Logika sukses di dalam try
      setMessage(response.data.message);
      alert(response.data.message);
      setIsPresent(true);

    } catch (err) {
      // Logika error di dalam catch
      const errorMessage =
        err.response?.data?.message || "Gagal melakukan presensi.";
      setMessage(errorMessage);
      alert(errorMessage);
      if (err.response?.status === 409) {
        setIsPresent(true); // 409 = Conflict (sudah absen)
      }
    }
  },
  [token] // Dependency array sudah benar
);

  // useEffect untuk scanner tidak berubah
  useEffect(() => {
    let scanner;
    if (isModalOpen) {
      // Logika untuk scanner di dalam modal
    }
    return () => {
      // Cleanup
    };
  }, [isModalOpen, handleScanResult]);

  const handleAction = async (action, payload) => {
    // ✅ Definisikan URL API secara dinamis
    const API_URL = process.env.REACT_APP_API_URL || "http://localhost:5000";

    const endpoints = {
      mulai: {
        method: "post",
        // ✅ Gunakan variabel API_URL
        url: `${API_URL}/api/aktivitas/mulai`,
        data: { jadwal_id: payload },
      },
      selesai: {
        method: "put",
        // ✅ Gunakan variabel API_URL
        url: `${API_URL}/api/aktivitas/selesai/${payload}`,
        data: {},
      },
    };
    const messages = {
      mulai: {
        success: "Aktivitas mengajar berhasil dimulai.",
        fail: "Gagal memulai aktivitas.",
      },
      selesai: {
        success: "Aktivitas mengajar berhasil diselesaikan.",
        fail: "Gagal menyelesaikan aktivitas.",
      },
    };

    try {
      const { method, url, data } = endpoints[action];
      await axios[method](url, data, {
        headers: { Authorization: `Bearer ${token}` },
      });
      alert(messages[action].success);
      fetchInitialData(); // Refresh data
    } catch (error) {
      alert(messages[action].fail);
      console.error(error);
    }
  };
  // Fungsi BARU untuk menangani perubahan status manual
  const handleManualPresence = async (status) => {
  try {
    // ✅ Definisikan URL API secara dinamis
    const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';
    
    // ✅ Gunakan variabel API_URL saat memanggil axios
    const response = await axios.post(
      `${API_URL}/api/presensi/manual`,
      { status },
      { headers: { Authorization: `Bearer ${token}` } }
    );
    
    alert(response.data.message);
    fetchInitialData(); // Ambil ulang data untuk memperbarui dasbor
  } catch (error) {
    alert(error.response?.data?.error || "Gagal memperbarui status.");
  }
};
  const handleLogout = () => {
    localStorage.removeItem("token");
    window.location.href = "/login";
  };

  return (
    <Box
      sx={{
        minHeight: "100vh",
        background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
      }}
    >
      <AppBar
        position="static"
        sx={{
          background: "rgba(255, 255, 255, 0.95)",
          backdropFilter: "blur(10px)",
          color: "#333",
          boxShadow: "0 8px 32px rgba(0,0,0,0.1)",
          borderBottom: "1px solid rgba(255,255,255,0.2)",
        }}
      >
        <Container maxWidth="xl">
          <Toolbar sx={{ py: 1 }}>
            <Typography
              variant="h5"
              component="div"
              sx={{
                flexGrow: 1,
                fontWeight: "bold",
                background: "linear-gradient(45deg, #667eea, #764ba2)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
              }}
            >
              Dashboard Guru
            </Typography>
            <Typography
              sx={{
                mr: 3,
                color: "#666",
                display: { xs: "none", sm: "block" },
              }}
            >
              Selamat datang,{" "}
              <strong style={{ color: "#333" }}>{user?.nama}</strong>
            </Typography>
            <Button
              onClick={handleLogout}
              variant="outlined"
              startIcon={<LogoutIcon />}
              sx={{
                borderColor: "#667eea",
                color: "#667eea",
                borderRadius: "12px",
                "&:hover": {
                  borderColor: "#764ba2",
                  backgroundColor: "rgba(102, 126, 234, 0.04)",
                },
              }}
            >
              Logout
            </Button>
          </Toolbar>
        </Container>
      </AppBar>

      {/* Konten Utama */}
      <Container maxWidth="xl" sx={{ flexGrow: 1, py: 4 }}>
        {/* Menggunakan Stack untuk memberi jarak vertikal antar bagian */}
        <Stack spacing={4}>
          {/* --- Baris Pertama: Kartu Statistik Utama --- */}
          {/* --- Baris Pertama: Kartu Statistik Utama --- */}
          <Box sx={{ display: "flex", justifyContent: "center" }}>
            <Grid container spacing={3}>
              <Grid item xs={12} sm={6} md={4} sx={{ px: 3 }}>
                <StatCard
                  title="Total Jadwal Hari Ini"
                  value={
                    loading ? (
                      <CircularProgress size={24} color="inherit" />
                    ) : (
                      jadwal.length
                    )
                  }
                  icon={<TodayIcon sx={{ fontSize: 32 }} />}
                  gradient="linear-gradient(135deg, #667eea 0%, #764ba2 100%)"
                />
              </Grid>

              <Grid item xs={12} sm={6} md={4} sx={{ px: 3 }}>
                <StatCard
                  title="Jadwal Selesai"
                  value={
                    loading ? (
                      <CircularProgress size={24} color="inherit" />
                    ) : (
                      jadwal.filter((j) => j.status === "selesai").length
                    )
                  }
                  icon={<CheckCircleIcon sx={{ fontSize: 32 }} />}
                  gradient="linear-gradient(135deg, #11998e 0%, #38ef7d 100%)"
                />
              </Grid>

              <Grid item xs={12} sm={6} md={4} sx={{ px: 3 }}>
                <StatCard
                  title="Status Presensi"
                  value={isPresent ? "Hadir" : "Belum Hadir"}
                  icon={<EventAvailableIcon sx={{ fontSize: 32 }} />}
                  gradient={
                    isPresent
                      ? "linear-gradient(135deg, #11998e 0%, #38ef7d 100%)"
                      : "linear-gradient(135deg, #f093fb 0%, #f5576c 100%)"
                  }
                />
              </Grid>
            </Grid>
          </Box>

          {/* --- Baris Kedua: Profil, Presensi, Progress, dan Info Cepat --- */}
          <Grid container spacing={3}>
            <Grid item xs={12} sm={6} md={3}>
              <UserProfileCard user={user} currentTime={currentTime} />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <PresenceCard onOpenModal={() => setIsModalOpen(true)} />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <DailyProgress jadwal={jadwal} />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <QuickStats
                jadwal={jadwal}
                isPresent={isPresent}
                currentTime={currentTime}
                onStatusChange={handleManualPresence}
              />
            </Grid>
          </Grid>

          {/* --- Baris Ketiga: Jadwal Full Lebar --- */}
          <Container maxWidth="xl" sx={{ py: 3 }}>
            <Card
              elevation={3}
              sx={{
                borderRadius: "20px",
                background: "rgba(255, 255, 255, 0.95)",
                backdropFilter: "blur(10px)",
                border: "1px solid rgba(255, 255, 255, 0.2)",
                width: "95%",
                boxShadow: "0 8px 32px 0 rgba(0, 0, 0, 0.1)",
                p: { xs: 2, sm: 4 },
              }}
            >
              <Typography
                variant="h5"
                component="h2"
                sx={{
                  mb: 3,
                  fontWeight: "bold",
                  color: "#333",
                  textAlign: "center",
                }}
              >
                Jadwal Mengajar Hari Ini
              </Typography>

              <TableContainer
                component={Paper}
                elevation={0}
                sx={{
                  borderRadius: "16px",
                  border: "1px solid rgba(0,0,0,0.05)",
                }}
              >
                <Table>
                  <TableHead>
                    <TableRow
                      sx={{
                        background:
                          "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                      }}
                    >
                      <TableCell
                        sx={{ color: "black", fontWeight: "bold", py: 2 }}
                      >
                        Mata Pelajaran
                      </TableCell>
                      <TableCell
                        sx={{ color: "black", fontWeight: "bold", py: 2 }}
                      >
                        Waktu
                      </TableCell>
                      <TableCell
                        align="center"
                        sx={{ color: "black", fontWeight: "bold", py: 2 }}
                      >
                        Aksi
                      </TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {loading ? (
                      <TableRow>
                        <TableCell colSpan={3} align="center" sx={{ py: 5 }}>
                          <CircularProgress />
                        </TableCell>
                      </TableRow>
                    ) : jadwal.length > 0 ? (
                      jadwal.map((item) => (
                        <TableRow key={item.id} hover>
                          <TableCell sx={{ fontWeight: 500 }}>
                            {item.mata_pelajaran}
                          </TableCell>
                          <TableCell>
                            {`${new Date(item.waktu_mulai).toLocaleTimeString(
                              "id-ID",
                              {
                                hour: "2-digit",
                                minute: "2-digit",
                              }
                            )} - ${new Date(
                              item.waktu_selesai
                            ).toLocaleTimeString("id-ID", {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}`}
                          </TableCell>
                          <TableCell align="center">
                            {item.status === "selesai" ? (
                              <Chip
                                label="Selesai"
                                color="success"
                                variant="filled"
                                sx={{ fontWeight: "bold" }}
                              />
                            ) : item.status === "berlangsung" ? (
                              <Button
                                variant="contained"
                                color="error"
                                onClick={() =>
                                  handleAction("selesai", item.aktivitasId)
                                }
                              >
                                Selesai
                              </Button>
                            ) : (
                              <Button
                                variant="contained"
                                color="primary"
                                onClick={() => handleAction("mulai", item.id)}
                              >
                                Mulai
                              </Button>
                            )}
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={3} align="center" sx={{ py: 5 }}>
                          Tidak ada jadwal mengajar hari ini.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
            </Card>
          </Container>
        </Stack>
      </Container>

      {/* --- Modal untuk Pindai QR --- */}
      <QrScannerModal
        open={isModalOpen}
        handleClose={() => setIsModalOpen(false)}
        handleScanResult={handleScanResult}
        setInfoMessage={(msg) => {
          setMessage(msg);
          alert(msg);
        }}
      />
      {/* Komponen Snackbar BARU untuk Notifikasi */}
      <Snackbar
        open={notification.open}
        autoHideDuration={10000} // Notifikasi hilang setelah 10 detik
        onClose={handleCloseNotification}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
      >
        <Alert
          onClose={handleCloseNotification}
          severity="info"
          variant="filled"
          sx={{ width: "100%", boxShadow: 6 }}
        >
          <Box sx={{ display: "flex", alignItems: "center" }}>
            <NotificationsIcon sx={{ mr: 1.5 }} />
            {notification.message}
          </Box>
        </Alert>
      </Snackbar>
    </Box>
  );
}

export default Dashboard;
