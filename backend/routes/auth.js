const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../db'); 

const JWT_SECRET = process.env.JWT_SECRET || 'ini_adalah_kunci_rahasia_sistem_presensi_anda';

// --- RUTE LOGIN (Tidak Berubah) ---
router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: "Email dan password harus diisi." });
  }
  try {
    const sql = `
      SELECT id, nama, email, password, 'admin' as role FROM admin WHERE email = $1
      UNION
      SELECT id, nama, email, password, 'guru' as role FROM guru WHERE email = $2
    `;
    const { rows } = await db.query(sql, [email, email]);
    if (rows.length === 0) {
      return res.status(401).json({ error: "Email atau password salah." });
    }
    const user = rows[0];
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ error: "Email atau password salah." });
    }
    const payload = { id: user.id, nama: user.nama, role: user.role };
    const token = jwt.sign(payload, JWT_SECRET, { expiresIn: '1d' });
    return res.status(200).json({ 
      message: `Login sebagai ${user.role.charAt(0).toUpperCase() + user.role.slice(1)} berhasil!`, 
      token 
    });
  } catch (err) {
    console.error("DB ERROR:", err);
    return res.status(500).json({ error: "Kesalahan pada server." });
  }
});


// --- RUTE BARU UNTUK LUPA PASSWORD (TANPA EMAIL) ---

// Langkah 1: Cek apakah email ada di database
router.post('/check-email', async (req, res) => {
    const { email } = req.body;
    if (!email) {
        return res.status(400).json({ error: "Email harus diisi." });
    }
    try {
        const sql = `
            SELECT email FROM admin WHERE email = $1
            UNION
            SELECT email FROM guru WHERE email = $2
        `;
        const { rows } = await db.query(sql, [email, email]);

        if (rows.length > 0) {
            // Email ditemukan
            res.status(200).json({ message: "Email ditemukan." });
        } else {
            // Email tidak ditemukan
            res.status(404).json({ error: "Email tidak terdaftar di sistem." });
        }
    } catch (err) {
        console.error("DB ERROR saat cek email:", err);
        res.status(500).json({ error: "Kesalahan pada server." });
    }
});

// Langkah 2: Update password berdasarkan email
router.post('/update-password-by-email', async (req, res) => {
    const { email, newPassword } = req.body;
    if (!email || !newPassword) {
        return res.status(400).json({ error: "Email dan password baru harus diisi." });
    }

    try {
        // Cari tahu apakah email milik admin atau guru
        const adminCheck = await db.query("SELECT id FROM admin WHERE email = $1", [email]);
        const guruCheck = await db.query("SELECT id FROM guru WHERE email = $1", [email]);

        let targetTable = '';
        if (adminCheck.rows.length > 0) {
            targetTable = 'admin';
        } else if (guruCheck.rows.length > 0) {
            targetTable = 'guru';
        } else {
            return res.status(404).json({ error: "Email tidak ditemukan." });
        }

        // Hash password baru
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(newPassword, salt);

        // Update password di tabel yang benar
        const updateSql = `UPDATE ${targetTable} SET password = $1 WHERE email = $2`;
        await db.query(updateSql, [hashedPassword, email]);

        res.status(200).json({ message: "Password berhasil diperbarui. Silakan login." });

    } catch (err) {
        console.error("DB ERROR saat update password:", err);
        res.status(500).json({ error: "Kesalahan pada server." });
    }
});


module.exports = router;

