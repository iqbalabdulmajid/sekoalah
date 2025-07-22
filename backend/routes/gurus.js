const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const db = require('../db');

// GET semua guru
router.get('/', async (req, res) => {
  try {
    const sql = "SELECT id, nama, email FROM guru";
    // Untuk pg, hasil query ada di property 'rows'
    const { rows } = await db.query(sql);
    res.status(200).json(rows);
  } catch (err) {
    console.error("ERROR GET GURUS:", err);
    res.status(500).json({ error: "Kesalahan server database." });
  }
});

// POST guru baru
router.post('/', async (req, res) => {
  const { nama, email, password } = req.body;

  if (!nama || !email || !password) {
    return res.status(400).json({ error: "Nama, email, dan password wajib diisi." });
  }

  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    // ✅ Placeholder diubah ke $1, $2, $3
    const sql = "INSERT INTO guru (nama, email, password) VALUES ($1, $2, $3) RETURNING id";
    const { rows } = await db.query(sql, [nama, email, hashedPassword]);
    
    res.status(201).json({ message: "Guru berhasil dibuat.", guruId: rows[0].id });
  } catch (err) {
    console.error("ERROR SQL SAAT MEMBUAT GURU:", err);
    // '23505' adalah kode error untuk unique violation di PostgreSQL
    if (err.code === '23505') { 
      return res.status(409).json({ error: "Email sudah terdaftar." });
    }
    return res.status(500).json({ error: "Gagal menyimpan guru ke database." });
  }
});

// PUT (Update) guru
router.put('/:id', async (req, res) => {
  const { id } = req.params;
  const { nama, email } = req.body;

  if (!nama || !email) {
    return res.status(400).json({ error: "Nama dan email wajib diisi." });
  }

  try {
    // ✅ Placeholder diubah ke $1, $2, $3
    const sql = "UPDATE guru SET nama = $1, email = $2 WHERE id = $3";
    const { rowCount } = await db.query(sql, [nama, email, id]);

    // 💡 Di pg, kita cek 'rowCount' bukan 'affectedRows'
    if (rowCount === 0) {
      return res.status(404).json({ error: "Guru dengan ID tersebut tidak ditemukan." });
    }
    
    res.status(200).json({ message: "Guru berhasil diupdate." });
  } catch (err) {
    console.error("ERROR UPDATE GURU:", err);
    if (err.code === '23505') {
      return res.status(409).json({ error: "Email sudah digunakan oleh guru lain." });
    }
    res.status(500).json({ error: "Gagal update guru." });
  }
});

// DELETE guru
router.delete('/:id', async (req, res) => {
  const { id } = req.params;
  try {
    // ✅ Placeholder diubah ke $1
    const sql = "DELETE FROM guru WHERE id = $1";
    const { rowCount } = await db.query(sql, [id]);

    // 💡 Di pg, kita cek 'rowCount'
    if (rowCount === 0) {
      return res.status(404).json({ error: "Guru dengan ID tersebut tidak ditemukan." });
    }

    res.status(200).json({ message: "Guru berhasil dihapus." });
  } catch (err) {
    console.error("ERROR DELETE GURU:", err);
    res.status(500).json({ error: "Gagal hapus guru." });
  }
});

module.exports = router;