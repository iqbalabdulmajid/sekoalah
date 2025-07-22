const express = require('express');
const router = express.Router();
const qrcode = require('qrcode');
const jwt = require('jsonwebtoken'); // Kita butuh JWT

// Kunci rahasia ini HARUS sama dengan yang Anda gunakan di middleware/auth.js
const JWT_SECRET = 'ini_adalah_kunci_rahasia_sistem_presensi_anda';

// Endpoint untuk generate QR Code dinamis
// POST /api/qrcode/generate
router.post('/generate', async (req, res) => {
  const { userId, userName } = req.body;

  if (!userId || !userName) {
    return res.status(400).json({ error: "User ID dan User Name dibutuhkan." });
  }

  try {
    // 1. Buat payload dengan data user dan waktu pembuatan (iat: issued at)
    const payload = {
      id: userId,
      nama: userName,
      // iat ditambahkan secara otomatis oleh jwt.sign()
    };

    // 2. Buat token yang hanya berlaku singkat. Kita akan validasi manual, jadi tidak perlu `expiresIn`.
    const qrToken = jwt.sign(payload, JWT_SECRET);

    // 3. Generate QR code dari string token tersebut
    const qrCodeDataURL = await qrcode.toDataURL(qrToken);
    
    // Kirim data URL gambar QR Code ke frontend
    res.status(200).json({ qrCodeImage: qrCodeDataURL });

  } catch (error) {
    console.error("Gagal generate QR Code:", error);
    res.status(500).json({ error: "Gagal membuat QR Code." });
  }
});

module.exports = router;
