const express = require('express');
const router = express.Router();
const db = require('../db');
const { protect } = require('../middleware/auth'); // Impor middleware untuk proteksi

// Endpoint untuk MULAI mengajar
// POST /api/aktivitas/mulai
router.post('/mulai', protect, async (req, res) => {
  const { jadwal_id } = req.body;
  const guru_id = req.user.id; // Ambil ID guru dari token

  if (!jadwal_id) {
    return res.status(400).json({ error: "ID Jadwal dibutuhkan." });
  }

  try {
    const waktu_mulai_aktual = new Date(); // Catat waktu saat ini
    
    // ✅ SQL diubah untuk PostgreSQL
    const sql = "INSERT INTO aktivitas_mengajar (jadwal_id, guru_id, waktu_mulai_aktual, status) VALUES ($1, $2, $3, $4) RETURNING id";
    
    const { rows } = await db.query(sql, [jadwal_id, guru_id, waktu_mulai_aktual, 'berlangsung']);
    
    // Kirim kembali ID dari aktivitas yang baru dibuat
    res.status(201).json({ 
      message: "Aktivitas mengajar berhasil dimulai.", 
      aktivitasId: rows[0].id // 💡 Ambil ID dari 'rows'
    });
  } catch (err) {
    console.error("Error memulai aktivitas:", err);
    return res.status(500).json({ error: "Gagal memulai aktivitas mengajar." });
  }
});

// Endpoint untuk SELESAI mengajar
// PUT /api/aktivitas/selesai/:id
router.put('/selesai/:id', protect, async (req, res) => {
  const aktivitasId = req.params.id;
  const guru_id = req.user.id; // Ambil ID guru dari token untuk verifikasi

  try {
    const waktu_selesai_aktual = new Date();

    // ✅ SQL diubah untuk PostgreSQL
    const sql = "UPDATE aktivitas_mengajar SET waktu_selesai_aktual = $1, status = $2 WHERE id = $3 AND guru_id = $4";
    
    const { rowCount } = await db.query(sql, [waktu_selesai_aktual, 'selesai', aktivitasId, guru_id]);
    
    // 💡 Di pg, kita cek 'rowCount' bukan 'affectedRows'
    if (rowCount === 0) {
      return res.status(404).json({ error: "Aktivitas tidak ditemukan atau Anda tidak berhak menyelesaikannya." });
    }
    
    res.status(200).json({ message: "Aktivitas mengajar berhasil diselesaikan." });
  } catch (err) {
    console.error("Error menyelesaikan aktivitas:", err);
    return res.status(500).json({ error: "Gagal menyelesaikan aktivitas mengajar." });
  }
});

module.exports = router;