const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../db'); 

const JWT_SECRET = 'ini_adalah_kunci_rahasia_sistem_presensi_anda';

router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: "Email dan password harus diisi." });
  }

  try {
    // ✅ PERUBAHAN DI SINI: Ganti placeholder '?' menjadi '$1' dan '$2'
    const sql = `
      SELECT id, nama, email, password, 'admin' as role FROM admin WHERE email = $1
      UNION
      SELECT id, nama, email, password, 'guru' as role FROM guru WHERE email = $2
    `;
    
    // Array parameter tetap sama, [email, email] akan memetakan ke $1 dan $2
    const { rows } = await db.query(sql, [email, email]);

    // Jika tidak ada hasil sama sekali, berarti email tidak terdaftar
    if (rows.length === 0) {
      return res.status(401).json({ error: "Email atau password salah." });
    }

    const user = rows[0];

    // Bandingkan password yang di-hash
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ error: "Email atau password salah." });
    }

    // Buat payload dan token JWT
    const payload = { 
      id: user.id, 
      nama: user.nama, 
      role: user.role 
    };
    
    const token = jwt.sign(payload, JWT_SECRET, { expiresIn: '1d' });

    // Kirim respons sukses
    return res.status(200).json({ 
      message: `Login sebagai ${user.role.charAt(0).toUpperCase() + user.role.slice(1)} berhasil!`, 
      token 
    });

  } catch (err) {
    console.error("DB ERROR:", err);
    return res.status(500).json({ error: "Kesalahan pada server." });
  }
});

module.exports = router;