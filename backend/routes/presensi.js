const express = require('express');
const router = express.Router();
const db = require('../db');
const jwt = require('jsonwebtoken');
const { protect } = require('../middleware/auth');
const multer = require('multer');
const { createClient } = require('@supabase/supabase-js');

// --- Konfigurasi Kredensial ---
const JWT_SECRET = process.env.JWT_SECRET || 'ini_adalah_kunci_rahasia_sistem_presensi_anda';
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;

// Pastikan environment variables untuk Supabase ada
if (!supabaseUrl || !supabaseAnonKey) {
  console.error("Variabel lingkungan Supabase (SUPABASE_URL dan SUPABASE_ANON_KEY) belum diatur.");
}
const supabase = createClient(supabaseUrl, supabaseAnonKey);


// --- Konfigurasi Multer untuk Supabase (bukan disk storage) ---
const fileFilter = (req, file, cb) => {
    if (file.mimetype === 'application/pdf') {
        cb(null, true);
    } else {
        cb(new Error('Format file tidak didukung. Hanya file PDF yang diizinkan.'), false);
    }
};

const upload = multer({
    storage: multer.memoryStorage(), // ✅ PENTING: Gunakan memoryStorage, bukan diskStorage
    fileFilter: fileFilter,
    limits: {
        fileSize: 5 * 1024 * 1024 // 5MB
    }
});


// --- Rute Presensi (Scan, Status, Manual) ---
// Kode di bagian ini sudah benar dan tidak perlu diubah.
router.post('/scan', protect, async (req, res) => {
  const { qrData } = req.body;
  if (!qrData) return res.status(400).json({ error: "Data QR Code tidak ada." });

  try {
    const decoded = jwt.verify(qrData, JWT_SECRET);
    const loggedInUserId = req.user.id;
    const qrUserId = decoded.id;

    if (loggedInUserId !== qrUserId) {
      return res.status(403).json({ message: "Otentikasi gagal. QR Code ini tidak dapat digunakan oleh Anda." });
    }
    
    // Validasi kedaluwarsa token QR
    if (decoded.exp * 1000 < Date.now()) {
        return res.status(400).json({ message: "QR Code sudah kedaluwarsa." });
    }

    const userId = qrUserId;
    const today = "(NOW() AT TIME ZONE 'Asia/Jakarta')::DATE";
    const nowInJakarta = "(NOW() AT TIME ZONE 'Asia/Jakarta')";

    const checkSql = `SELECT * FROM absensi WHERE guru_id = $1 AND tanggal = ${today}`;
    const { rows } = await db.query(checkSql, [userId]);
    const existingRecord = rows[0];

    if (!existingRecord) {
      const insertSql = `INSERT INTO absensi (guru_id, tanggal, waktu_masuk, status) VALUES ($1, ${today}, ${nowInJakarta}, 'hadir')`;
      await db.query(insertSql, [userId]);
      return res.status(201).json({ message: "Absen masuk berhasil dicatat!" });
    } else if (existingRecord.waktu_masuk && !existingRecord.waktu_pulang) {
      const updateSql = `UPDATE absensi SET waktu_pulang = ${nowInJakarta} WHERE id = $1`;
      await db.query(updateSql, [existingRecord.id]);
      return res.status(200).json({ message: "Absen pulang berhasil dicatat!" });
    } else if (existingRecord.waktu_pulang) {
      return res.status(409).json({ message: "Anda sudah lengkap melakukan absensi masuk dan pulang hari ini." });
    } else {
      return res.status(403).json({ message: `Tidak dapat melakukan scan. Status Anda hari ini adalah '${existingRecord.status}'.` });
    }
  } catch (error) {
    console.error("Error saat scan presensi:", error);
    if (error.name === 'JsonWebTokenError') return res.status(400).json({ message: "QR Code tidak valid." });
    if (error.name === 'TokenExpiredError') return res.status(400).json({ message: "QR Code sudah kedaluwarsa." });
    return res.status(500).json({ error: "Terjadi kesalahan pada server." });
  }
});

router.get('/status', protect, async (req, res) => {
  const guruId = req.user.id;
  try {
    const today = "(NOW() AT TIME ZONE 'Asia/Jakarta')::DATE";
    const sql = `SELECT id, status, waktu_masuk, waktu_pulang FROM absensi WHERE guru_id = $1 AND tanggal = ${today}`;
    const { rows } = await db.query(sql, [guruId]);
    if (rows.length === 0) return res.status(200).json({ status: 'belum_absen' });
    res.status(200).json(rows[0]);
  } catch (err) {
    console.error("Error cek status presensi:", err);
    return res.status(500).json({ error: "Kesalahan server database." });
  }
});

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


// --- ENDPOINT LAPORAN --- //

// ✅ FIX: Rute POST untuk laporan diubah untuk mengunggah file ke Supabase
router.post('/laporan', protect, upload.single('materiFile'), async (req, res) => {
    const { guru_id, absensi_id, tanggal, laporan } = req.body;
    const file = req.file;

    if (!guru_id || !absensi_id || !tanggal || !laporan) {
        return res.status(400).json({ message: 'Semua field wajib diisi.' });
    }

    let materiFileData = null;

    try {
        // Langkah 1: Unggah file ke Supabase Storage jika ada
        if (file) {
            const fileName = `materi/${guru_id}-${Date.now()}-${file.originalname}`;
            const { data: uploadData, error: uploadError } = await supabase.storage
                .from('materi-mengajar') // Ganti dengan nama bucket Anda
                .upload(fileName, file.buffer, { contentType: file.mimetype });

            if (uploadError) throw uploadError;

            const { data: publicUrlData } = supabase.storage
                .from('materi-mengajar') // Ganti dengan nama bucket Anda
                .getPublicUrl(uploadData.path);

            materiFileData = {
                url: publicUrlData.publicUrl,
                filename: file.originalname
            };
        }

        let laporanData = typeof laporan === 'string' ? JSON.parse(laporan) : laporan;
        if (materiFileData) {
            laporanData.materiFile = materiFileData;
        }

        // Langkah 2: Simpan URL dan data lain ke database PostgreSQL
        const query = `
            INSERT INTO laporan_mengajar (guru_id, absensi_id, tanggal, laporan)
            VALUES ($1, $2, $3, $4)
            ON CONFLICT (absensi_id) DO UPDATE 
            SET laporan = $4
            RETURNING *;
        `;
        const values = [guru_id, absensi_id, tanggal, JSON.stringify(laporanData)];
        const result = await db.query(query, values);

        res.status(201).json({
            message: 'Laporan berhasil disimpan.',
            data: result.rows[0]
        });

    } catch (error) {
        console.error('Error saat menyimpan laporan mengajar:', error);
        res.status(500).json({ message: 'Terjadi kesalahan pada server.' });
    }
});

// Rute GET untuk laporan tidak perlu diubah, hanya pastikan tabelnya ada
router.get('/laporan/semua', protect, async (req, res) => {
    try {
        const query = `
            SELECT 
                lm.id, lm.tanggal, lm.laporan, g.nama as guru_nama
            FROM laporan_mengajar lm
            JOIN guru g ON lm.guru_id = g.id
            ORDER BY lm.tanggal DESC;
        `;
        const result = await db.query(query);
        res.json(result.rows);
    } catch (error) {
        console.error('Error saat mengambil laporan mengajar:', error);
        res.status(500).json({ 
            message: 'Terjadi kesalahan saat mengambil data laporan.',
            detail: error.message 
        });
    }
});

module.exports = router;
