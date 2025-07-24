const express = require('express');
const router = express.Router();
const db = require('../db');
const jwt = require('jsonwebtoken');
const { protect } = require('../middleware/auth');

// Pastikan variabel ini sama dengan yang digunakan saat membuat token
const JWT_SECRET = 'ini_adalah_kunci_rahasia_sistem_presensi_anda'; 
const QR_CODE_VALIDITY_SECONDS = 30;

// Endpoint untuk mencatat kehadiran (POST /api/presensi/scan)
router.post('/scan', protect, async (req, res) => {
  const { qrData } = req.body;

  if (!qrData) {
    return res.status(400).json({ error: "Data QR Code tidak ada." });
  }

  try {
    // 1. Verifikasi dan decode token dari QR Code
    // Catatan: Sebaiknya gunakan opsi 'expiresIn' saat membuat token, 
    // maka jwt.verify() akan otomatis menangani error kedaluwarsa.
    const decoded = jwt.verify(qrData, JWT_SECRET);
    
    // 2. Cek waktu kedaluwarsa secara manual (metode ini sudah benar dan aman dari timezone)
    const issuedAt = decoded.iat * 1000; // iat selalu dalam format UTC
    const now = Date.now(); // Date.now() juga selalu dalam format UTC
    const ageInSeconds = (now - issuedAt) / 1000;

    if (ageInSeconds > QR_CODE_VALIDITY_SECONDS) {
      return res.status(400).json({ message: "QR Code sudah kedaluwarsa." });
    }

    // 3. Jika valid, lanjutkan proses presensi
    const userId = decoded.id;

    // Gunakan blok try...catch baru untuk operasi database
    try {
      // ✅ SQL diperbaiki untuk menggunakan zona waktu 'Asia/Jakarta'
      const today = "(NOW() AT TIME ZONE 'Asia/Jakarta')::DATE";
      const checkSql = `SELECT * FROM absensi WHERE guru_id = $1 AND tanggal = ${today}`;
      const { rows } = await db.query(checkSql, [userId]);

      if (rows.length > 0) {
        return res.status(409).json({ message: "Anda sudah melakukan presensi hari ini." });
      }
      
      // ✅ SQL diperbaiki untuk menggunakan zona waktu 'Asia/Jakarta'
      const nowInJakarta = "(NOW() AT TIME ZONE 'Asia/Jakarta')";
      const insertSql = `INSERT INTO absensi (guru_id, tanggal, waktu_presensi, status) VALUES ($1, ${today}, ${nowInJakarta}, $2)`;
      await db.query(insertSql, [userId, 'hadir']);
      
      res.status(201).json({ message: "Presensi berhasil dicatat!" });

    } catch (dbError) {
      console.error("Database error saat scan presensi:", dbError);
      return res.status(500).json({ error: "Gagal mencatat presensi." });
    }

  } catch (error) {
    // Error ini akan ditangkap jika token tidak valid atau sudah kedaluwarsa (jika pakai expiresIn)
    console.error("Gagal verifikasi QR token:", error);
    return res.status(400).json({ message: "QR Code tidak valid atau kedaluwarsa." });
  }
});

// Endpoint untuk cek status presensi hari ini
router.get('/status', protect, async (req, res) => {
  const guruId = req.user.id;
  try {
    // ✅ SQL diperbaiki untuk menggunakan zona waktu 'Asia/Jakarta'
    const today = "(NOW() AT TIME ZONE 'Asia/Jakarta')::DATE";
    const sql = `SELECT * FROM absensi WHERE guru_id = $1 AND tanggal = ${today}`;
    const { rows } = await db.query(sql, [guruId]);
    res.status(200).json({ isPresent: rows.length > 0 });
  } catch (err) {
    console.error("Error cek status presensi:", err);
    return res.status(500).json({ error: "Kesalahan server database." });
  }
});

// Endpoint untuk presensi manual (izin, sakit, alpa)
router.post('/manual', protect, async (req, res) => {
  // Diasumsikan yang bisa akses ini adalah admin, req.user.id mungkin perlu disesuaikan
  // Jika ini untuk guru itu sendiri, maka req.user.id sudah benar.
  const guruId = req.user.id; 
  const { status } = req.body;

  const allowedStatus = ['izin', 'sakit', 'alpa'];
  if (!status || !allowedStatus.includes(status.toLowerCase())) {
    return res.status(400).json({ error: 'Status yang dikirim tidak valid.' });
  }

  try {
    // ✅ SQL diperbaiki untuk menggunakan zona waktu 'Asia/Jakarta'
    const today = "(NOW() AT TIME ZONE 'Asia/Jakarta')::DATE";
    const sql = `
      INSERT INTO absensi (guru_id, tanggal, status, waktu_presensi)
      VALUES ($1, ${today}, $2, NULL)
      ON CONFLICT (guru_id, tanggal) DO UPDATE 
      SET status = EXCLUDED.status, waktu_presensi = NULL;
    `;

    await db.query(sql, [guruId, status.toLowerCase()]);
    res.status(200).json({ message: `Status kehadiran berhasil diubah menjadi ${status}.` });
  } catch (err) {
    console.error("Error saat mencatat presensi manual:", err);
    return res.status(500).json({ error: "Gagal memperbarui status." });
  }
});

module.exports = router;
