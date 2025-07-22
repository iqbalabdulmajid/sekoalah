// File: backend/createGuru.js
const bcrypt = require('bcryptjs');
const db = require('./db');

const guruEmail = 'guru.budi@sekolah.id';
const guruPassword = 'guru123'; // Password yang ingin kita gunakan

async function createGuru() {
  console.log(`Membuat guru dengan email: ${guruEmail}...`);

  try {
    const hashedPassword = await bcrypt.hash(guruPassword, 10);
    console.log('Password berhasil di-hash.');

    const sql = "INSERT INTO guru (nama, email, password) VALUES (?, ?, ?)";
    const values = ['Budi Hartono, S.Pd.', guruEmail, hashedPassword];

    db.query(sql, values, (err, result) => {
      if (err) {
        console.error('Gagal menyimpan guru ke database:', err);
        return;
      }
      console.log(`===========================================`);
      console.log(`SUKSES! Guru berhasil dibuat.`);
      console.log(`Email: ${guruEmail}`);
      console.log(`Password: ${guruPassword}`);
      console.log(`===========================================`);
      db.end();
    });

  } catch (error) {
    console.error('Terjadi kesalahan:', error);
  }
}

createGuru();