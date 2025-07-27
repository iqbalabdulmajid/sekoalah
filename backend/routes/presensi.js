const express = require('express');
const router = express.Router();
const db = require('../db');
const jwt = require('jsonwebtoken');
const { protect } = require('../middleware/auth');

// Pastikan variabel ini sama dengan yang digunakan saat membuat token
const JWT_SECRET = 'ini_adalah_kunci_rahasia_sistem_presensi_anda'; 
const QR_CODE_VALIDITY_SECONDS = 30;

// Endpoint untuk mencatat kehadiran (POST /api/presensi/scan)
// Logika diubah untuk menangani absen masuk dan absen pulang
router.post('/scan', protect, async (req, res) => {
  const { qrData } = req.body;

  if (!qrData) {
    return res.status(400).json({ error: "Data QR Code tidak ada." });
  }

  try {
    // 1. Verifikasi dan decode token dari QR Code
    const decoded = jwt.verify(qrData, JWT_SECRET);
    
    // ✅ LANGKAH BARU: Pastikan QR code digunakan oleh orang yang benar
    const loggedInUserId = req.user.id; // ID pengguna yang sedang login (dari middleware 'protect')
    const qrUserId = decoded.id;       // ID pengguna yang ada di dalam QR Code

    if (loggedInUserId !== qrUserId) {
      // Jika ID pengguna yang login tidak sama dengan ID di QR code, tolak.
      return res.status(403).json({ message: "Otentikasi gagal. QR Code ini tidak dapat digunakan oleh Anda." });
    }

    // 2. Cek waktu kedaluwarsa (logika ini sudah benar dan aman dari timezone)
    const issuedAt = decoded.iat * 1000;
    const now = Date.now();
    const ageInSeconds = (now - issuedAt) / 1000;

    if (ageInSeconds > QR_CODE_VALIDITY_SECONDS) {
      return res.status(400).json({ message: "QR Code sudah kedaluwarsa." });
    }

    // 3. Lanjutkan proses presensi
    const userId = qrUserId; // Gunakan ID dari QR yang sudah divalidasi
    const today = "(NOW() AT TIME ZONE 'Asia/Jakarta')::DATE";
    const nowInJakarta = "(NOW() AT TIME ZONE 'Asia/Jakarta')";

    // Cek apakah sudah ada catatan absensi untuk hari ini
    const checkSql = `SELECT * FROM absensi WHERE guru_id = $1 AND tanggal = ${today}`;
    const { rows } = await db.query(checkSql, [userId]);
    const existingRecord = rows[0];

    if (!existingRecord) {
      // Belum ada catatan sama sekali: Lakukan ABSEN MASUK
      const insertSql = `
        INSERT INTO absensi (guru_id, tanggal, waktu_masuk, status) 
        VALUES ($1, ${today}, ${nowInJakarta}, 'hadir')
      `;
      await db.query(insertSql, [userId]);
      return res.status(201).json({ message: "Absen masuk berhasil dicatat!" });

    } else if (existingRecord.waktu_masuk && !existingRecord.waktu_pulang) {
      // Sudah absen masuk, tapi belum absen pulang: Lakukan ABSEN PULANG
      const updateSql = `
        UPDATE absensi 
        SET waktu_pulang = ${nowInJakarta} 
        WHERE id = $1
      `;
      await db.query(updateSql, [existingRecord.id]);
      return res.status(200).json({ message: "Absen pulang berhasil dicatat!" });

    } else if (existingRecord.waktu_pulang) {
      // Sudah absen masuk dan pulang
      return res.status(409).json({ message: "Anda sudah lengkap melakukan absensi masuk dan pulang hari ini." });
    
    } else {
      // Kasus lain, misal status 'izin' atau 'sakit'
      return res.status(403).json({ message: `Tidak dapat melakukan scan. Status Anda hari ini adalah '${existingRecord.status}'.` });
    }

  } catch (error) {
    console.error("Error saat scan presensi:", error);
    if (error.name === 'JsonWebTokenError') {
      return res.status(400).json({ message: "QR Code tidak valid." });
    }
    if (error.name === 'TokenExpiredError') {
      return res.status(400).json({ message: "QR Code sudah kedaluwarsa." });
    }
    return res.status(500).json({ error: "Terjadi kesalahan pada server." });
  }
});

// Endpoint untuk cek status presensi hari ini
// Diubah untuk memberikan detail waktu masuk dan pulang
router.get('/status', protect, async (req, res) => {
  const guruId = req.user.id;
  try {
    const today = "(NOW() AT TIME ZONE 'Asia/Jakarta')::DATE";
    const sql = `SELECT status, waktu_masuk, waktu_pulang FROM absensi WHERE guru_id = $1 AND tanggal = ${today}`;
    const { rows } = await db.query(sql, [guruId]);

    if (rows.length === 0) {
      return res.status(200).json({ status: 'belum_absen' });
    }
    
    res.status(200).json(rows[0]); // Mengembalikan { status, waktu_masuk, waktu_pulang }
  } catch (err) {
    console.error("Error cek status presensi:", err);
    return res.status(500).json({ error: "Kesalahan server database." });
  }
});

// Endpoint untuk presensi manual (izin, sakit, alpa)
// Diubah untuk mengosongkan waktu masuk dan pulang
router.post('/manual', protect, async (req, res) => {
  const guruId = req.user.id; 
  const { status } = req.body;

  const allowedStatus = ['izin', 'sakit', 'alpa'];
  if (!status || !allowedStatus.includes(status.toLowerCase())) {
    return res.status(400).json({ error: 'Status yang dikirim tidak valid.' });
  }

  try {
    const today = "(NOW() AT TIME ZONE 'Asia/Jakarta')::DATE";
    const sql = `
      INSERT INTO absensi (guru_id, tanggal, status, waktu_masuk, waktu_pulang)
      VALUES ($1, ${today}, $2, NULL, NULL)
      ON CONFLICT (guru_id, tanggal) DO UPDATE 
      SET status = EXCLUDED.status, waktu_masuk = NULL, waktu_pulang = NULL;
    `;

    await db.query(sql, [guruId, status.toLowerCase()]);
    res.status(200).json({ message: `Status kehadiran berhasil diubah menjadi ${status}.` });
  } catch (err) {
    console.error("Error saat mencatat presensi manual:", err);
    return res.status(500).json({ error: "Gagal memperbarui status." });
  }
});

module.exports = router;
