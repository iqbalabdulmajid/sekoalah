// Simpan file ini sebagai: /backend/services/notificationService.js

const nodemailer = require('nodemailer');
const db = require('../db'); // Pastikan path ini benar

// --- Konfigurasi Pengirim Email ---
let transporter;
try {
  transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER || 'geprekerspedas@gmail.com',
      pass: process.env.EMAIL_PASS || 'dpkb axqi vols oohq'
    }
  });
  console.log('[LOG] Nodemailer transporter berhasil dikonfigurasi.');
} catch (error) {
  console.error('[ERROR] Gagal mengkonfigurasi nodemailer transporter:', error);
  process.exit(1);
}

// --- FUNGSI-FUNGSI PENGIRIM EMAIL (LENGKAP) ---

const sendScheduleReminderEmail = async (teacherEmail, scheduleDetails) => {
  const { mata_pelajaran, waktu_mulai, nama } = scheduleDetails;
  const startTime = new Date(waktu_mulai).toLocaleTimeString('id-ID', {
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'Asia/Jakarta'
  });
  const mailOptions = {
    from: '"Sistem Presensi Sekolah" <geprekerspedas@gmail.com>',
    to: teacherEmail,
    subject: `Pengingat Jadwal Mengajar: ${mata_pelajaran}`,
    html: `<p>Yth. Bapak/Ibu ${nama},</p><p>Ini adalah pengingat bahwa Anda memiliki jadwal mengajar sebentar lagi:</p><ul><li><b>Mata Pelajaran:</b> ${mata_pelajaran}</li><li><b>Jam Mulai:</b> ${startTime} WIB</li></ul><p>Mohon untuk mempersiapkan diri dan melakukan presensi sebelum pelajaran dimulai. Terima kasih.</p>`
  };
  try {
    console.log(`[REMINDER] Mengirim email pengingat ke: ${teacherEmail} untuk mapel: ${mata_pelajaran}`);
    await transporter.sendMail(mailOptions);
    console.log(`[SUCCESS] Email pengingat berhasil dikirim ke ${teacherEmail}`);
  } catch (error) {
    console.error(`[ERROR] Gagal mengirim email pengingat ke ${teacherEmail}:`, error);
  }
};

const sendAbsenceWarningEmail = async (teacherEmail, scheduleDetails) => {
    const { mata_pelajaran, nama } = scheduleDetails;
    const mailOptions = {
        from: '"Sistem Presensi Sekolah" <geprekerspedas@gmail.com>',
        to: teacherEmail,
        subject: `Peringatan: Anda Belum Melakukan Presensi untuk ${mata_pelajaran}`,
        html: `<div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;"><h2 style="color: #d9534f;">Peringatan Keterlambatan Presensi</h2><p>Yth. Bapak/Ibu <strong>${nama}</strong>,</p><p>Sistem kami mendeteksi bahwa jadwal mengajar Anda untuk mata pelajaran <strong>${mata_pelajaran}</strong> telah dimulai, namun Anda <strong>belum melakukan presensi masuk</strong>.</p><p>Mohon untuk segera melakukan presensi. Jika Anda berhalangan hadir atau mengalami kendala, silakan hubungi pihak administrasi sekolah.</p><p>Terima kasih atas perhatiannya.</p><hr><p style="font-size: 0.8em; color: #888;">Email ini dibuat secara otomatis.</p></div>`
    };
    try {
        console.log(`[WARNING] Mengirim email peringatan absen ke: ${teacherEmail} untuk mapel: ${mata_pelajaran}`);
        await transporter.sendMail(mailOptions);
        console.log(`[SUCCESS] Email peringatan absen berhasil dikirim ke ${teacherEmail}`);
    } catch (error) {
        console.error(`[ERROR] Gagal mengirim email peringatan absen ke ${teacherEmail}:`, error);
    }
};

const sendDailyAbsenceReminderEmail = async (teacherEmail, teacherDetails) => {
    const { nama } = teacherDetails;
    const dateString = new Date().toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric', timeZone: 'Asia/Jakarta' });
    const mailOptions = {
        from: '"Sistem Presensi Sekolah" <geprekerspedas@gmail.com>',
        to: teacherEmail,
        subject: `Pengingat Presensi Harian - ${dateString}`,
        html: `<div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;"><h2 style="color: #f0ad4e;">Pengingat Presensi Harian</h2><p>Yth. Bapak/Ibu <strong>${nama}</strong>,</p><p>Sistem kami mencatat bahwa Anda belum melakukan presensi masuk untuk hari ini, <strong>${dateString}</strong>.</p><p>Mohon untuk segera melakukan presensi harian Anda. Abaikan email ini jika Anda sudah melakukan presensi atau telah mengajukan izin/sakit.</p><p>Terima kasih.</p><hr><p style="font-size: 0.8em; color: #888;">Email ini dibuat secara otomatis.</p></div>`
    };
    try {
        console.log(`[DAILY-REMINDER] Mengirim email pengingat harian ke: ${teacherEmail}`);
        await transporter.sendMail(mailOptions);
        console.log(`[SUCCESS] Email pengingat harian berhasil dikirim ke ${teacherEmail}`);
    } catch (error) {
        console.error(`[ERROR] Gagal mengirim email pengingat harian ke ${teacherEmail}:`, error);
    }
};


// === INI ADALAH LOGIKA KONDISIONALNYA ===
if (process.env.VERCEL_ENV) {
    // JIKA KODE BERJALAN DI VERCEL:
    // Jangan jalankan node-cron. Cukup cetak pesan bahwa cron akan ditangani oleh vercel.json.
    // Fungsi-fungsi di atas akan dipanggil oleh API endpoint (/api/cron/check-all-notifications.js).
    console.log('[INFO] Berjalan di lingkungan Vercel. Penjadwalan Cron ditangani oleh Vercel.');

} else {
    // JIKA KODE BERJALAN DI LOKAL (BUKAN VERCEL):
    // Jalankan semua cron job menggunakan node-cron seperti biasa.
    console.log('[INFO] Berjalan di lingkungan lokal. Menjalankan node-cron...');
    const cron = require('node-cron');

    // --- CRON JOB 1: PENGINGAT JADWAL (LOKAL) ---
    cron.schedule('* * * * *', async () => {
        console.log('[LOCAL CRON-REMINDER] Menjalankan pengecekan jadwal untuk pengingat...');
        const nowInJakarta = "(NOW() AT TIME ZONE 'Asia/Jakarta')";
        const oneHourFromNow = "(NOW() AT TIME ZONE 'Asia/Jakarta' + interval '60 minutes')";
        try {
            const findSchedulesSql = `SELECT j.id, j.mata_pelajaran, j.waktu_mulai, g.email, g.nama FROM jadwal j JOIN guru g ON j.guru_id = g.id WHERE j.waktu_mulai BETWEEN ${nowInJakarta} AND ${oneHourFromNow} AND j.notifikasi_terkirim = false`;
            const { rows } = await db.query(findSchedulesSql);
            for (const schedule of rows) {
                if (schedule.email) await sendScheduleReminderEmail(schedule.email, schedule);
                await db.query('UPDATE jadwal SET notifikasi_terkirim = true WHERE id = $1', [schedule.id]);
            }
        } catch (error) {
            console.error('[ERROR][LOCAL CRON-REMINDER]', error);
        }
    });

    // --- CRON JOB 2: PERINGATAN ABSEN JADWAL (LOKAL) ---
    cron.schedule('* * * * *', async () => {
        console.log('[LOCAL CRON-WARNING] Menjalankan pengecekan keterlambatan absensi terkait jadwal...');
        const today = "(NOW() AT TIME ZONE 'Asia/Jakarta')::DATE";
        const nowInJakarta = "(NOW() AT TIME ZONE 'Asia/Jakarta')";
        try {
            const findOverdueSchedulesSql = `SELECT j.id, j.mata_pelajaran, j.guru_id, g.email, g.nama FROM jadwal j JOIN guru g ON j.guru_id = g.id WHERE DATE(j.waktu_mulai AT TIME ZONE 'Asia/Jakarta') = ${today} AND j.waktu_mulai < ${nowInJakarta} AND j.peringatan_absen_terkirim = false`;
            const { rows: schedulesToCheck } = await db.query(findOverdueSchedulesSql);
            for (const schedule of schedulesToCheck) {
                const checkAbsenceSql = `SELECT id FROM absensi WHERE guru_id = $1 AND tanggal = ${today}`;
                const { rows: absenceRows } = await db.query(checkAbsenceSql, [schedule.guru_id]);
                if (absenceRows.length === 0 && schedule.email) {
                    await sendAbsenceWarningEmail(schedule.email, schedule);
                }
                await db.query('UPDATE jadwal SET peringatan_absen_terkirim = true WHERE id = $1', [schedule.id]);
            }
        } catch (error) {
            console.error('[ERROR][LOCAL CRON-WARNING]', error);
        }
    });

    // --- CRON JOB 3: PENGINGAT HARIAN (LOKAL) ---
    cron.schedule('*/2 * * * *', async () => {
        console.log('[LOCAL CRON-DAILY] Menjalankan pengecekan absensi harian untuk semua guru...');
        const today = "(NOW() AT TIME ZONE 'Asia/Jakarta')::DATE";
        try {
            const findMissingTeachersSql = `SELECT g.id, g.nama, g.email FROM guru g WHERE NOT EXISTS (SELECT 1 FROM absensi a WHERE a.guru_id = g.id AND a.tanggal = ${today}) AND g.notifikasi_harian_terkirim = false;`;
            const { rows: missingTeachers } = await db.query(findMissingTeachersSql);
            for (const teacher of missingTeachers) {
                if (teacher.email) {
                    await sendDailyAbsenceReminderEmail(teacher.email, teacher);
                    await db.query('UPDATE guru SET notifikasi_harian_terkirim = true WHERE id = $1', [teacher.id]);
                }
            }
        } catch (error) {
            console.error('[ERROR][LOCAL CRON-DAILY]', error);
        }
    });

    // --- CRON JOB 4: RESET FLAG (LOKAL) ---
    cron.schedule('1 0 * * *', async () => {
        console.log('[LOCAL CRON-RESET] Mereset flag notifikasi harian untuk semua guru...');
        try {
            await db.query('UPDATE guru SET notifikasi_harian_terkirim = false');
            console.log('[LOCAL CRON-RESET] Semua flag notifikasi harian berhasil direset.');
        } catch (error) {
            console.error('[ERROR][LOCAL CRON-RESET]', error);
        }
    });
}

// Ekspor fungsi-fungsi agar bisa digunakan oleh API endpoint di Vercel
module.exports = {
    sendScheduleReminderEmail,
    sendAbsenceWarningEmail,
    sendDailyAbsenceReminderEmail
};
