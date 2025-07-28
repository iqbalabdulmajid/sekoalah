// Simpan file ini sebagai: /api/cron/check-all-notifications.js

// Impor koneksi database dan fungsi-fungsi pengirim email
const db = require('../../db'); // Sesuaikan path ke koneksi DB Anda
const {
    sendScheduleReminderEmail,
    sendAbsenceWarningEmail,
    sendDailyAbsenceReminderEmail
} = require('../../services/notificationService'); // Sesuaikan path ke service Anda

// Fungsi ini akan dijalankan setiap kali Vercel memanggil endpoint ini sesuai jadwal
export default async function handler(request, response) {
    console.log("CRON JOB FROM VERCEL STARTED: Running all notification checks...");

    // Untuk melindungi endpoint ini agar tidak bisa dipanggil oleh sembarang orang,
    // periksa 'authorization' header yang dikirim oleh Vercel.
    if (request.headers.authorization !== `Bearer ${process.env.CRON_SECRET}`) {
        return response.status(401).end('Unauthorized');
    }

    try {
        // Jalankan semua tugas pengecekan secara berurutan
        await checkScheduleReminders();
        await checkScheduleWarnings();
        await checkDailyReminders();

        console.log("CRON JOB FROM VERCEL FINISHED: All checks completed successfully.");
        return response.status(200).json({ status: 'OK', message: 'All notification tasks executed.' });
    } catch (error) {
        console.error('[VERCEL_CRON_ERROR]', error);
        return response.status(500).json({ status: 'Failed', message: error.message });
    }
}

// --- Logika dari setiap cron job yang lama dipindahkan ke fungsi terpisah ---

async function checkScheduleReminders() {
    console.log('[TASK] Checking for schedule reminders...');
    const nowInJakarta = "(NOW() AT TIME ZONE 'Asia/Jakarta')";
    const oneHourFromNow = `(${nowInJakarta} + interval '60 minutes')`;
    const sql = `SELECT j.id, j.mata_pelajaran, j.waktu_mulai, g.email, g.nama FROM jadwal j JOIN guru g ON j.guru_id = g.id WHERE j.waktu_mulai BETWEEN ${nowInJakarta} AND ${oneHourFromNow} AND j.notifikasi_terkirim = false`;
    const { rows } = await db.query(sql);
    for (const schedule of rows) {
        if (schedule.email) await sendScheduleReminderEmail(schedule.email, schedule);
        await db.query('UPDATE jadwal SET notifikasi_terkirim = true WHERE id = $1', [schedule.id]);
    }
}

async function checkScheduleWarnings() {
    console.log('[TASK] Checking for schedule-related absence warnings...');
    const today = "(NOW() AT TIME ZONE 'Asia/Jakarta')::DATE";
    const nowInJakarta = "(NOW() AT TIME ZONE 'Asia/Jakarta')";
    const sql = `SELECT j.id, j.mata_pelajaran, j.guru_id, g.email, g.nama FROM jadwal j JOIN guru g ON j.guru_id = g.id WHERE DATE(j.waktu_mulai AT TIME ZONE 'Asia/Jakarta') = ${today} AND j.waktu_mulai < ${nowInJakarta} AND j.peringatan_absen_terkirim = false`;
    const { rows: schedules } = await db.query(sql);
    for (const schedule of schedules) {
      const { rows: absenceRows } = await db.query(`SELECT id FROM absensi WHERE guru_id = $1 AND tanggal = ${today}`, [schedule.guru_id]);
      if (absenceRows.length === 0 && schedule.email) {
        await sendAbsenceWarningEmail(schedule.email, schedule);
      }
      await db.query('UPDATE jadwal SET peringatan_absen_terkirim = true WHERE id = $1', [schedule.id]);
    }
}

async function checkDailyReminders() {
    console.log('[TASK] Checking for general daily absence reminders...');
    const today = "(NOW() AT TIME ZONE 'Asia/Jakarta')::DATE";
    const sql = `SELECT g.id, g.nama, g.email FROM guru g WHERE NOT EXISTS (SELECT 1 FROM absensi a WHERE a.guru_id = g.id AND a.tanggal = ${today}) AND g.notifikasi_harian_terkirim = false;`;
    const { rows: teachers } = await db.query(sql);
    for (const teacher of teachers) {
        if (teacher.email) {
            await sendDailyAbsenceReminderEmail(teacher.email, teacher);
            await db.query('UPDATE guru SET notifikasi_harian_terkirim = true WHERE id = $1', [teacher.id]);
        }
    }
}
