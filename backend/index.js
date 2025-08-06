require('dotenv').config(); // Harus paling atas

const express = require('express');
const cors = require('cors');
const db = require('./db'); // Impor untuk cek koneksi saat start
const path = require('path');


// 1. Impor semua rute
const userRoutes = require('./routes/gurus');
const authRoutes = require('./routes/auth');
const qrCodeRoutes = require('./routes/qrcode');
const jadwalRoutes = require('./routes/jadwal');
const presensiRoutes = require('./routes/presensi');
const aktivitasRoutes = require('./routes/aktivitas');
const laporanRoutes = require('./routes/laporan');

const app = express();
const port = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// 2. Gunakan semua rute
app.use('/api/gurus', userRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/qrcode', qrCodeRoutes);
app.use('/api/jadwal', jadwalRoutes);
app.use('/api/presensi', presensiRoutes);
app.use('/api/aktivitas', aktivitasRoutes);
app.use('/api/laporan', laporanRoutes);

// Rute default
app.get('/', (req, res) => {
  res.send('Selamat datang di API Sistem Presensi!');
});
app.use('/uploads/materi', express.static(path.join(__dirname, 'uploads', 'materi')));


// Jalankan server
app.listen(port, () => {
  console.log(`Server berjalan di http://localhost:${port}`);
});

// [✅ Tambahkan ini agar cron & notifikasi aktif otomatis]
require('./services/notificationService');

// (Opsional) Debug env
// console.log("DB_PASSWORD type:", typeof process.env.DB_PASSWORD);
// console.log("DB_PASSWORD value:", process.env.DB_PASSWORD);
