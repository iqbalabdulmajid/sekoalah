const jwt = require('jsonwebtoken');

// Kunci rahasia ini HARUS sama dengan yang Anda gunakan di routes/auth.js
const JWT_SECRET = 'ini_adalah_kunci_rahasia_sistem_presensi_anda';

const protect = (req, res, next) => {
  let token;

  // Cek apakah header authorization ada dan menggunakan format 'Bearer'
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      // Ambil token dari header (setelah kata 'Bearer ')
      token = req.headers.authorization.split(' ')[1];

      // Verifikasi token
      const decoded = jwt.verify(token, JWT_SECRET);

      // Lampirkan data pengguna yang sudah di-decode ke objek request
      // agar bisa digunakan oleh rute selanjutnya
      req.user = decoded;

      next(); // Lanjutkan ke rute yang dituju
    } catch (error) {
      console.error('Token verification failed:', error);
      res.status(401).json({ error: 'Tidak terotorisasi, token gagal' });
    }
  }

  if (!token) {
    res.status(401).json({ error: 'Tidak terotorisasi, tidak ada token' });
  }
};

module.exports = { protect };
