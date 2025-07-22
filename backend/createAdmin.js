// File: backend/createAdmin.js
const bcrypt = require('bcryptjs');
const db = require('./db'); // Menggunakan koneksi database yang sudah ada

const adminEmail = 'admin@sekolah.id';
const adminPassword = 'admin123'; // Password yang ingin kita gunakan

async function createAdmin() {
  console.log(`Membuat admin dengan email: ${adminEmail}...`);

  try {
    // Hash password
    const hashedPassword = await bcrypt.hash(adminPassword, 10);
    console.log('Password berhasil di-hash.');

    // Simpan ke database
    const sql = "INSERT INTO admin (nama, email, password) VALUES (?, ?, ?)";
    const values = ['Admin Utama', adminEmail, hashedPassword];

    db.query(sql, values, (err, result) => {
      if (err) {
        console.error('Gagal menyimpan admin ke database:', err);
        return;
      }
      console.log(`===========================================`);
      console.log(`SUKSES! Admin berhasil dibuat.`);
      console.log(`Email: ${adminEmail}`);
      console.log(`Password: ${adminPassword}`);
      console.log(`===========================================`);
      db.end(); // Tutup koneksi setelah selesai
    });

  } catch (error) {
    console.error('Terjadi kesalahan:', error);
  }
}

createAdmin();