const express = require('express');
const router = express.Router();
const db = require('../db');
const { protect } = require('../middleware/auth');

router.get('/presensi', protect, async (req, res) => {
  const { guru_id } = req.query;

  // ✅ FIX: Query diubah untuk mengambil kolom 'waktu_masuk' dan 'waktu_pulang'
  let sql = `
    SELECT
      absensi.id,
      absensi.tanggal,
      absensi.waktu_masuk,
      absensi.waktu_pulang,
      absensi.status,
      guru.nama as nama_guru
    FROM absensi
    JOIN guru ON absensi.guru_id = guru.id
  `;
  
  const params = [];

  // Jika ada filter guru_id dan bukan 'all', tambahkan klausa WHERE
  if (guru_id && guru_id !== 'all') {
    // Gunakan placeholder $1 untuk PostgreSQL
    sql += ' WHERE absensi.guru_id = $1';
    params.push(guru_id);
  }

  sql += ' ORDER BY absensi.tanggal DESC, guru.nama ASC';

  // Tambahkan log ini untuk debugging
  console.log("Executing SQL:", sql);
  console.log("With Params:", params);

  try {
    const { rows } = await db.query(sql, params);
    // 'rows' akan menjadi array kosong [] jika tidak ada data, ini normal.
    res.status(200).json(rows); 
  } catch (err) {
    console.error("Error mengambil laporan presensi:", err);
    return res.status(500).json({ error: "Gagal mengambil data laporan." });
  }
});

module.exports = router;
