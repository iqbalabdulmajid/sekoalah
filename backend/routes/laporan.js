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

// GET /api/laporan/kinerja
router.get('/kinerja', async (req, res) => {
    try {
        // Query ini menggabungkan data absensi dengan laporan mengajar
        // LEFT JOIN digunakan agar data absensi tetap muncul meskipun guru belum input laporan
        const query = `
            SELECT 
                a.id,
                a.tanggal,
                a.waktu_masuk,
                a.waktu_pulang,
                a.status,
                g.nama AS nama_guru,
                lm.laporan AS laporan_mengajar
            FROM absensi a
            JOIN guru g ON a.guru_id = g.id
            LEFT JOIN laporan_mengajar lm ON a.id = lm.absensi_id
            ORDER BY a.tanggal DESC, g.nama ASC;
        `;
        const { rows } = await db.query(query);
        res.status(200).json(rows);
    } catch (error) {
        console.error('Error saat mengambil laporan kinerja:', error);
        res.status(500).json({ message: 'Terjadi kesalahan pada server.' });
    }
});

// POST /api/laporan/mengajar
router.post('/mengajar', protect, async (req, res) => {
    const { guru_id, absensi_id, tanggal, laporan } = req.body;

    try {
        // Validasi input
        if (!guru_id || !absensi_id || !tanggal || !Array.isArray(laporan) || laporan.length === 0) {
            return res.status(400).json({ 
                message: 'Data tidak lengkap. Harap isi semua field yang diperlukan.' 
            });
        }

        // Validasi format laporan
        for (const item of laporan) {
            if (!item.kelas || !item.materi) {
                return res.status(400).json({ 
                    message: 'Format laporan tidak valid. Setiap item harus memiliki kelas dan materi.' 
                });
            }
        }

        // Insert ke database
        const query = `
            INSERT INTO laporan_mengajar (guru_id, absensi_id, tanggal, laporan)
            VALUES ($1, $2, $3, $4)
            ON CONFLICT (absensi_id) 
            DO UPDATE SET laporan = $4
            RETURNING id;
        `;

        const { rows } = await db.query(query, [
            guru_id,
            absensi_id,
            tanggal,
            JSON.stringify(laporan)
        ]);

        res.status(201).json({ 
            message: 'Laporan berhasil disimpan',
            id: rows[0].id 
        });

    } catch (error) {
        console.error('Error saat menyimpan laporan mengajar:', error);
        res.status(500).json({ message: 'Terjadi kesalahan pada server.' });
    }
});

router.get('/mengajar', protect, async (req, res) => {
  try {
    // Contoh query untuk mengambil data aktivitas mengajar
    // Anda perlu menyesuaikan ini dengan struktur tabel Anda
    const sql = `
      SELECT 
        g.nama as nama_guru, 
        j.mata_pelajaran, 
        a.waktu_mulai_mengajar, -- Asumsi ada kolom ini
        a.waktu_selesai_mengajar -- Asumsi ada kolom ini
      FROM aktivitas_mengajar a -- Asumsi ada tabel ini
      JOIN guru g ON a.guru_id = g.id
      JOIN jadwal j ON a.jadwal_id = j.id
      ORDER BY a.waktu_mulai_mengajar DESC
    `;
    
    const { rows } = await db.query(sql);
    res.status(200).json(rows);

  } catch (err) {
    console.error("Error mengambil laporan mengajar:", err);
    res.status(500).json({ error: "Gagal mengambil data laporan mengajar." });
  }
});

module.exports = router;
