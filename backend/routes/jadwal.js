const express = require('express');
const router = express.Router();
const db = require('../db');
const { protect } = require('../middleware/auth');

// --- Rute untuk Admin (diubah ke async/await) ---

// GET semua jadwal
router.get('/', async (req, res) => {
  const sql = `
    SELECT jadwal.id, jadwal.mata_pelajaran, jadwal.waktu_mulai, jadwal.waktu_selesai, guru.nama as nama_guru
    FROM jadwal
    JOIN guru ON jadwal.guru_id = guru.id
    ORDER BY jadwal.waktu_mulai DESC
  `;
  try {
    // Di pg, hasil query ada di property 'rows'
    const { rows } = await db.query(sql);
    res.status(200).json(rows);
  } catch (err) {
    console.error("Error mengambil data jadwal:", err);
    res.status(500).json({ error: "Error mengambil data jadwal." });
  }
});

// POST jadwal baru
router.post('/', async (req, res) => {
  const { guru_id, mata_pelajaran, waktu_mulai, waktu_selesai } = req.body;
  if (!guru_id || !mata_pelajaran || !waktu_mulai || !waktu_selesai) {
    return res.status(400).json({ error: "Semua field wajib diisi." });
  }

  try {
    // ✅ Placeholder diubah ke $1, $2, dst.
    const sql = "INSERT INTO jadwal (guru_id, mata_pelajaran, waktu_mulai, waktu_selesai) VALUES ($1, $2, $3, $4) RETURNING id";
    const { rows } = await db.query(sql, [guru_id, mata_pelajaran, waktu_mulai, waktu_selesai]);
    res.status(201).json({ message: "Jadwal berhasil dibuat.", jadwalId: rows[0].id });
  } catch (err) {
    console.error("Error membuat jadwal:", err);
    res.status(500).json({ error: "Gagal membuat jadwal." });
  }
});

// DELETE jadwal
router.delete('/:id', async (req, res) => {
  const { id } = req.params;
  try {
    // ✅ Placeholder diubah ke $1
    const sql = "DELETE FROM jadwal WHERE id = $1";
    const { rowCount } = await db.query(sql, [id]);

    // 💡 Di pg, kita cek 'rowCount'
    if (rowCount === 0) {
      return res.status(404).json({ message: "Jadwal tidak ditemukan." });
    }
    res.status(200).json({ message: "Jadwal berhasil dihapus." });
  } catch (err) {
    console.error("Error menghapus jadwal:", err);
    res.status(500).json({ error: "Gagal menghapus jadwal." });
  }
});


// --- Rute Guru '/saya' DIPERBARUI & DIPERBAIKI ---
router.get('/saya', protect, async (req, res) => {
  const guruId = req.user.id; 

  // ✅ Sintaks SQL diperbaiki untuk PostgreSQL
  const sql = `
    SELECT
      j.id,
      j.mata_pelajaran,
      j.waktu_mulai,
      j.waktu_selesai,
      a.id as "aktivitasId", 
      a.status
    FROM
      jadwal j
    LEFT JOIN
      aktivitas_mengajar a ON j.id = a.jadwal_id
    WHERE
      j.guru_id = $1 AND j.waktu_mulai::date = CURRENT_DATE
    ORDER BY
      j.waktu_mulai ASC
  `;
  
  try {
    const { rows } = await db.query(sql, [guruId]);
    res.status(200).json(rows);
  } catch (err) {
    console.error("Error mengambil jadwal saya:", err);
    res.status(500).json({ error: "Error mengambil data jadwal." });
  }
});


module.exports = router;