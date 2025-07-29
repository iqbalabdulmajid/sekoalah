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
    const sql = `SELECT id, status, waktu_masuk, waktu_pulang FROM absensi WHERE guru_id = $1 AND tanggal = ${today}`;
    const { rows } = await db.query(sql, [guruId]);

    if (rows.length === 0) {
      return res.status(200).json({ status: 'belum_absen' });
    }
    
    res.status(200).json(rows[0]); // Mengembalikan { id, status, waktu_masuk, waktu_pulang }
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

// --- MULTER SETUP --- //
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Buat direktori uploads jika belum ada
const uploadDir = path.join(__dirname, '..', 'uploads', 'materi');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, uploadDir);
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
    }
});

const fileFilter = (req, file, cb) => {
    if (file.mimetype === 'application/pdf') {
        cb(null, true);
    } else {
        cb(new Error('Format file tidak didukung. Hanya file PDF yang diizinkan.'), false);
    }
};

const upload = multer({
    storage: storage,
    fileFilter: fileFilter,
    limits: {
        fileSize: 5 * 1024 * 1024 // 5MB
    }
});

// --- ENDPOINT LAPORAN --- //
// Endpoint untuk mengambil semua laporan mengajar
router.get('/laporan/semua', protect, async (req, res) => {
    try {
        // Periksa apakah tabel laporan_mengajar ada
        const checkTableQuery = `
            SELECT EXISTS (
                SELECT FROM information_schema.tables 
                WHERE table_schema = 'public' 
                AND table_name = 'laporan_mengajar'
            );
        `;
        const tableCheck = await db.query(checkTableQuery);
        
        if (!tableCheck.rows[0].exists) {
            // Jika tabel belum ada, buat tabelnya
            const createTableQuery = `
                CREATE TABLE IF NOT EXISTS laporan_mengajar (
                    id SERIAL PRIMARY KEY,
                    guru_id INTEGER NOT NULL REFERENCES gurus(id),
                    absensi_id INTEGER NOT NULL UNIQUE REFERENCES absensi(id),
                    tanggal DATE NOT NULL,
                    laporan JSONB NOT NULL,
                    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
                );
            `;
            await db.query(createTableQuery);
        }

        // Ambil data laporan
        const query = `
            SELECT 
                lm.id,
                lm.tanggal,
                lm.laporan,
                g.nama as guru_nama
            FROM laporan_mengajar lm
            JOIN guru g ON lm.guru_id = g.id
            ORDER BY lm.tanggal DESC;
        `;
        
        const result = await db.query(query);
        console.log('Jumlah laporan yang ditemukan:', result.rows.length);
        res.json(result.rows);
    } catch (error) {
        console.error('Error saat mengambil laporan mengajar:', error);
        console.error('Detail error:', error.message);
        console.error('Stack trace:', error.stack);
        res.status(500).json({ 
            message: 'Terjadi kesalahan saat mengambil data laporan.',
            detail: error.message 
        });
    }
});

router.post('/laporan', protect, upload.single('materiFile'), async (req, res) => {
    try {
        const { guru_id, absensi_id, tanggal, laporan } = req.body;
        
        if (!guru_id || !absensi_id || !tanggal || !laporan) {
            // Hapus file yang diupload jika validasi gagal
            if (req.file) {
                fs.unlinkSync(req.file.path);
            }
            return res.status(400).json({ message: 'Semua field wajib diisi.' });
        }

        let laporanData = typeof laporan === 'string' ? JSON.parse(laporan) : laporan;
        
        // Tambahkan informasi file jika ada
        if (req.file) {
            laporanData = {
                ...laporanData,
                materiFile: {
                    filename: req.file.filename,
                    path: req.file.path,
                    originalName: req.file.originalname
                }
            };
        }

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
        
        // Hapus file jika ada error
        if (req.file) {
            fs.unlinkSync(req.file.path);
        }

        if (error.code === '23505') {
            return res.status(409).json({ 
                message: 'Laporan untuk sesi absensi ini sudah ada.' 
            });
        }

        res.status(500).json({ 
            message: 'Terjadi kesalahan pada server.' 
        });
    }
});

module.exports = router;
