const express = require('express');
const router = express.Router();
const db = require('../db');
const jwt = require('jsonwebtoken');
const { protect } = require('../middleware/auth');

const JWT_SECRET = 'ini_adalah_kunci_rahasia_sistem_presensi_anda';
const QR_CODE_VALIDITY_SECONDS = 15;

// Endpoint untuk mencatat kehadiran (POST /api/presensi/scan)
router.post('/scan', protect, async (req, res) => {
  const { qrData } = req.body;

  if (!qrData) {
    return res.status(400).json({ error: "Data QR Code tidak ada." });
  }

  try {
    // 1. Verifikasi dan decode token dari QR Code
    const decoded = jwt.verify(qrData, JWT_SECRET);
    
    // 2. Cek waktu kedaluwarsa
    const issuedAt = decoded.iat * 1000;
    const now = Date.now();
    const ageInSeconds = (now - issuedAt) / 1000;

    if (ageInSeconds > QR_CODE_VALIDITY_SECONDS) {
      return res.status(400).json({ message: "QR Code sudah kedaluwarsa." });
    }

    // 3. Jika valid, lanjutkan proses presensi dengan async/await
    const userId = decoded.id;

    // Gunakan blok try...catch baru untuk operasi database
    try {
      // ✅ SQL disesuaikan untuk PostgreSQL
      const checkSql = "SELECT * FROM absensi WHERE guru_id = $1 AND tanggal = CURRENT_DATE";
      const { rows } = await db.query(checkSql, [userId]);

      if (rows.length > 0) {
        return res.status(409).json({ message: "Anda sudah melakukan presensi hari ini." });
      }
      
      const insertSql = "INSERT INTO absensi (guru_id, tanggal, waktu_presensi, status) VALUES ($1, CURRENT_DATE, NOW(), $2)";
      await db.query(insertSql, [userId, 'hadir']);
      
      res.status(201).json({ message: "Presensi berhasil dicatat!" });

    } catch (dbError) {
      console.error("Database error saat scan presensi:", dbError);
      return res.status(500).json({ error: "Gagal mencatat presensi." });
    }

  } catch (error) {
    console.error("Gagal verifikasi QR token:", error);
    return res.status(400).json({ message: "QR Code tidak valid." });
  }
});

// Endpoint untuk cek status presensi hari ini
router.get('/status', protect, async (req, res) => {
  const guruId = req.user.id;
  try {
    // ✅ SQL disesuaikan untuk PostgreSQL
    const sql = "SELECT * FROM absensi WHERE guru_id = $1 AND tanggal = CURRENT_DATE";
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
    // ✅ Logika "Upsert" menggunakan sintaks PostgreSQL ON CONFLICT
    const sql = `
      INSERT INTO absensi (guru_id, tanggal, status, waktu_presensi)
      VALUES ($1, CURRENT_DATE, $2, NULL)
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