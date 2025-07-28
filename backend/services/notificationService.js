const nodemailer = require('nodemailer');
const cron = require('node-cron');
const db = require('../db'); // Impor koneksi database Anda

// --- Konfigurasi Pengirim Email ---
let transporter;
try {
  // Gunakan kredensial email Anda. Disarankan menggunakan variabel lingkungan (.env)
  // untuk menyimpan informasi sensitif ini.
  transporter = nodemailer.createTransport({
    service: 'gmail', // Contoh menggunakan Gmail
    auth: {
      user: 'geprekerspedas@gmail.com',
      pass: 'dpkb axqi vols oohq' // Gunakan App Password dari Google, bukan password biasa
    }
  });
  console.log('[LOG] Nodemailer transporter berhasil dikonfigurasi.');
} catch (error) {
  console.error('[ERROR] Gagal mengkonfigurasi nodemailer transporter:', error);
}


/**
 * Fungsi untuk mengirim email PENGINGAT JADWAL.
 * @param {string} teacherEmail - Email guru penerima.
 * @param {object} scheduleDetails - Detail jadwal (mata pelajaran, waktu, dll).
 */
const sendReminderEmail = async (teacherEmail, scheduleDetails) => {
  const { mata_pelajaran, waktu_mulai, nama } = scheduleDetails;
  const startTime = new Date(waktu_mulai).toLocaleTimeString('id-ID', {
    hour: '2-digit',
    minute: '2-digit'
  });

  const mailOptions = {
    from: '"Sistem Presensi Sekolah" <geprekerspedas@gmail.com>',
    to: teacherEmail,
    subject: `Pengingat Jadwal Mengajar: ${mata_pelajaran}`,
    html: `
      <p>Yth. Bapak/Ibu ${nama},</p>
      <p>Anda memiliki jadwal mengajar:</p>
      <ul>
        <li><b>Mata Pelajaran:</b> ${mata_pelajaran}</li>
        <li><b>Jam Mulai:</b> ${startTime}</li>
      </ul>
      <p>Silakan lakukan presensi sebelum pelajaran dimulai. Terima kasih.</p>
    `
  };

  try {
    console.log(`[LOG] Mencoba mengirim email pengingat ke: ${teacherEmail} untuk mapel: ${mata_pelajaran}`);
    await transporter.sendMail(mailOptions);
    console.log(`[SUCCESS] Email pengingat berhasil dikirim ke ${teacherEmail}`);
  } catch (error) {
    console.error(`[ERROR] Gagal mengirim email pengingat ke ${teacherEmail}:`, error);
  }
};

/**
 * Fungsi untuk mengirim email PERINGATAN KARENA BELUM ABSEN.
 * @param {string} teacherEmail - Email guru penerima.
 * @param {object} scheduleDetails - Detail jadwal.
 */
const sendAbsenceWarningEmail = async (teacherEmail, scheduleDetails) => {
  const { mata_pelajaran, nama } = scheduleDetails;
  const mailOptions = {
    from: '"Sistem Presensi Sekolah" <geprekerspedas@gmail.com>',
    to: teacherEmail,
    subject: `Peringatan: Anda Belum Melakukan Presensi`,
    html: `
      <p>Yth. Bapak/Ibu ${nama},</p>
      <p>Sistem kami mendeteksi bahwa Anda belum melakukan presensi masuk untuk mata pelajaran:</p>
      <p><b>${mata_pelajaran}</b></p>
      <p>Yang seharusnya sudah dimulai.</p>
      <p>Mohon untuk segera melakukan presensi atau menghubungi admin jika terdapat kendala.</p>
      <p>Terima kasih.</p>
    `
  };

  try {
    console.log(`[LOG] Mencoba mengirim email peringatan absen ke: ${teacherEmail} untuk mapel: ${mata_pelajaran}`);
    await transporter.sendMail(mailOptions);
    console.log(`[SUCCESS] Email peringatan absen berhasil dikirim ke ${teacherEmail}`);
  } catch (error) {
    console.error(`[ERROR] Gagal mengirim email peringatan absen ke ${teacherEmail}:`, error);
  }
};


// --- Penjadwal Otomatis (Cron Job) untuk PENGINGAT SEBELUM KELAS ---
cron.schedule('* * * * *', async () => {
  console.log('[CRON-REMINDER] Menjalankan pengecekan jadwal untuk notifikasi...');
  
  try {
    // ✅ DIUBAH: Semua perhitungan waktu dilakukan di dalam SQL untuk konsistensi timezone.
    const sql = `
      SELECT 
        j.id, j.mata_pelajaran, j.waktu_mulai, g.email, g.nama
      FROM jadwal j
      JOIN guru g ON j.guru_id = g.id
      WHERE 
        j.waktu_mulai BETWEEN (NOW() AT TIME ZONE 'Asia/Jakarta') AND (NOW() AT TIME ZONE 'Asia/Jakarta' + interval '60 minutes')
        AND j.notifikasi_terkirim = false 
    `;
    const { rows } = await db.query(sql); // Tidak perlu parameter lagi

    if (rows.length === 0) {
      console.log('[CRON-REMINDER] Tidak ada jadwal yang akan datang dalam 60 menit ke depan.');
      return;
    }

    for (const schedule of rows) {
      console.log(`[CRON-REMINDER] Menemukan jadwal untuk ${schedule.nama}, mengirim email pengingat...`);
      await sendReminderEmail(schedule.email, schedule);
      await db.query('UPDATE jadwal SET notifikasi_terkirim = true WHERE id = $1', [schedule.id]);
    }

  } catch (error) {
    console.error('[ERROR][CRON-REMINDER] Error saat menjalankan cron job notifikasi:', error);
  }
});


// --- PENJADWAL BARU: Cron Job untuk PERINGATAN JIKA BELUM ABSEN ---
cron.schedule('* * * * *', async () => {
  const now = new Date();
  const hour = now.getUTCHours() + 7; // Konversi ke jam WIB
  if (hour < 8 || hour >= 17) return;

  console.log('[CRON-WARNING] Menjalankan pengecekan keterlambatan absensi...');
  
  // ✅ DIUBAH: Menggunakan fungsi SQL yang sadar timezone
  const today = "(NOW() AT TIME ZONE 'Asia/Jakarta')::DATE";
  const nowInJakarta = "(NOW() AT TIME ZONE 'Asia/Jakarta')";

  try {
    const scheduleSql = `
      SELECT 
        j.id, j.mata_pelajaran, j.guru_id, g.email, g.nama
      FROM jadwal j
      JOIN guru g ON j.guru_id = g.id
      WHERE 
        DATE(j.waktu_mulai) = ${today}
        AND j.waktu_mulai < ${nowInJakarta}
        AND j.peringatan_absen_terkirim = false
    `;
    const { rows: schedulesToCheck } = await db.query(scheduleSql);

    if (schedulesToCheck.length === 0) {
        console.log('[CRON-WARNING] Tidak ada jadwal terlewat yang perlu dicek saat ini.');
        return;
    }

    for (const schedule of schedulesToCheck) {
      console.log(`[CRON-WARNING] Mengecek status absensi untuk: ${schedule.nama} - Mapel: ${schedule.mata_pelajaran}`);
      const checkAbsenceSql = `
        SELECT id FROM absensi 
        WHERE guru_id = $1 AND tanggal = ${today} AND waktu_masuk IS NOT NULL
      `;
      const { rows: absenceRows } = await db.query(checkAbsenceSql, [schedule.guru_id]);

      if (absenceRows.length === 0) {
        console.log(`[CRON-WARNING] Guru ${schedule.nama} belum absen. Mengirim email peringatan...`);
        await sendAbsenceWarningEmail(schedule.email, schedule);
      } else {
        console.log(`[CRON-WARNING] Guru ${schedule.nama} sudah absen.`);
      }
      
      await db.query('UPDATE jadwal SET peringatan_absen_terkirim = true WHERE id = $1', [schedule.id]);
    }

  } catch (error) {
    console.error('[ERROR][CRON-WARNING] Error saat menjalankan cron job peringatan absen:', error);
  }
});


console.log('[INFO] Layanan notifikasi email berhasil dijalankan.');

module.exports = {
  sendReminderEmail,
  sendAbsenceWarningEmail,
};