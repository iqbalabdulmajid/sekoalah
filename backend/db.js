// // lewat cpanel

// const mysql = require('mysql2');

// // ✅ Gunakan createPool, bukan createConnection
// const pool = mysql.createPool({
//   host: 'foggia.id.domainesia.com',  // Host database Anda
//   user: 'quickwas_sekolah',          // User database
//   password: 'AkuManusiaBernamaIqbal02',  // Password database
//   database: 'quickwas_absensi_sekolah',// ✅ Nama database tanpa spasi di akhir
  
//   // Opsi untuk pool
//   waitForConnections: true,
//   connectionLimit: 10, // Jumlah koneksi maksimum yang diizinkan
//   queueLimit: 0
// });

// // 💡 Tidak perlu lagi `connection.connect()`
// // Pool akan mengelola koneksi secara otomatis saat ada query pertama.

// // 🚀 Ekspor promise-based pool untuk kemudahan penggunaan dengan async/await
// module.exports = pool.promise();

// db local
// const mysql = require('mysql2');

// // Buat koneksi ke database
// const connection = mysql.createConnection({
//   host: 'foggia.id.domainesia.com',      // Host database Anda
//   user: 'quickwas_sekolah',           // User default XAMPP
//   password: 'AkuManusiaBernamaIqbal02',           // Password default XAMPP adalah kosong
//   database: 'quickwas_absensi_sekolah', // Nama database yang sudah dibuat
//   port: 64000, // Port default MySQL
// });

// // Cek koneksi
// connection.connect(error => {
//   if (error) {
//     console.error('Koneksi ke database gagal:', error);
//     return;
//   }
//   console.log('Berhasil terhubung ke database MySQL.');
// });

// // Ekspor koneksi agar bisa digunakan di file lain
// module.exports = connection;

// db supabase
const { Pool } = require('pg');
require('dotenv').config(); // Untuk membaca file .env

const pool = new Pool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_DATABASE,
  // ssl: false, // <== khusus untuk testing lokal jika Supabase kamu belum support SSL
   ssl: {
    rejectUnauthorized: false, // Tambahkan ini!
   }
});


// Cek koneksi awal
pool.connect((err, client, release) => {
  if (err) {
    return console.error('Koneksi awal ke database Supabase gagal:', err.stack);
  }
  client.release();
  console.log('Berhasil terhubung ke database Supabase.');
});

module.exports = pool;
