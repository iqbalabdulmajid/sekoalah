require('dotenv').config();

const express = require('express');
const cors = require('cors');
const db = require('./db'); 

// 1. Impor semua rute (sudah benar)
const userRoutes = require('./routes/gurus');
const authRoutes = require('./routes/auth');
const qrCodeRoutes = require('./routes/qrcode');
const jadwalRoutes = require('./routes/jadwal');
const presensiRoutes = require('./routes/presensi');
const aktivitasRoutes = require('./routes/aktivitas');
const laporanRoutes = require('./routes/laporan');

const app = express();

// ✅ PERBAIKAN: Gunakan port dari environment, atau 5000 jika tidak ada
const port = process.env.PORT || 5000;

// Middleware
// ✅ PRAKTIK TERBAIK: Batasi CORS hanya untuk domain frontend Anda di produksi
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000' 
}));
app.use(express.json());

// 2. Gunakan semua rute (sudah benar)
app.use('/api/gurus', userRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/qrcode', qrCodeRoutes);
app.use('/api/jadwal', jadwalRoutes);
app.use('/api/presensi', presensiRoutes);
app.use('/api/aktivitas', aktivitasRoutes);
app.use('/api/laporan', laporanRoutes);

// Rute default (sudah benar)
app.get('/', (req, res) => {
  res.send('Selamat datang di API Sistem Presensi!');
});

// Jalankan server (sudah benar)
app.listen(port, () => {
  // ✅ Sedikit perbaikan pada log agar lebih jelas
  console.log(`Server berjalan di port ${port}`);
});

// ❌ HAPUS INI DI PRODUKSI: Jangan pernah menampilkan password di log
// console.log("DB_PASSWORD type:", typeof process.env.DB_PASSWORD);
// console.log("DB_PASSWORD value:", process.env.DB_PASSWORD);