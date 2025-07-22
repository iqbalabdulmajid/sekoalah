const express = require('express');
const router = express.Router();
const db = require('../db');
const { protect } = require('../middleware/auth'); // Impor middleware untuk proteksi

// Endpoint untuk mengambil data presensi dengan filter
// GET /api/laporan/presensi?guru_id=...
router.get('/presensi', protect, (req, res) => {
  // Ambil query parameter guru_id
  const { guru_id } = req.query;

  let sql = `
    SELECT
      absensi.id,
      absensi.tanggal,
      absensi.waktu_presensi,
      absensi.status,
      guru.nama as nama_guru
    FROM absensi
    JOIN guru ON absensi.guru_id = guru.id
  `;
  
  const params = [];

  // Jika ada filter guru_id dan bukan 'all', tambahkan klausa WHERE
  if (guru_id && guru_id !== 'all') {
    sql += ' WHERE absensi.guru_id = $1';
    params.push(guru_id);
  }

  sql += ' ORDER BY absensi.tanggal DESC, guru.nama ASC';

  db.query(sql, params, (err, results) => {
    if (err) {
      console.error("Error mengambil laporan presensi:", err);
      return res.status(500).json({ error: "Gagal mengambil data laporan." });
    }
    res.status(200).json(results);
  });
});

module.exports = router;
