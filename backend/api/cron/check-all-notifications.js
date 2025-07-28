// Lokasi file: /backend/api/cron/check-all-notifications.js

const db = require('../../db'); // Pastikan path ini benar!
const {
    sendScheduleReminderEmail,
    sendAbsenceWarningEmail,
    sendDailyAbsenceReminderEmail
} = require('../../services/notificationService'); // Pastikan path ini benar!

// Fungsi ini akan dijalankan oleh Vercel setiap menit
export default async function handler(request, response) {
    console.log("--- VERCEL CRON JOB: HANDLER STARTED ---");

    // Keamanan: Pastikan hanya Vercel yang bisa memanggil ini
    if (request.headers.authorization !== `Bearer ${process.env.CRON_SECRET}`) {
        console.warn("Unauthorized cron attempt.");
        return response.status(401).json({ message: 'Unauthorized' });
    }
    console.log("Authorization check passed.");

    try {
        await checkScheduleReminders();
        await checkScheduleWarnings();
        await checkDailyReminders();
        console.log("--- VERCEL CRON JOB: ALL TASKS COMPLETED ---");
        return response.status(200).json({ status: 'OK' });
    } catch (error) {
        console.error("[VERCEL CRON ERROR] An error occurred:", error);
        return response.status(500).json({ status: 'Failed', message: error.message });
    }
}

// --- Fungsi-fungsi pembantu ---

async function checkScheduleReminders() {
    console.log("[TASK] Running: Schedule Reminders...");
    const nowInJakarta = "(NOW() AT TIME ZONE 'Asia/Jakarta')";
    const oneHourFromNow = `(${nowInJakarta} + interval '60 minutes')`;
    const sql = `SELECT j.id, j.mata_pelajaran, j.waktu_mulai, g.email, g.nama FROM jadwal j JOIN guru g ON j.guru_id = g.id WHERE j.waktu_mulai BETWEEN ${nowInJakarta} AND ${oneHourFromNow} AND j.notifikasi_terkirim = false`;
    const { rows } = await db.query(sql);
    if (rows.length > 0) console.log(`  - Found ${rows.length} schedules to remind.`);
    for (const schedule of rows) {
        if (schedule.email) await sendScheduleReminderEmail(schedule.email, schedule);
        await db.query('UPDATE jadwal SET notifikasi_terkirim = true WHERE id = $1', [schedule.id]);
    }
}

async function checkScheduleWarnings() {
    console.log("[TASK] Running: Schedule Absence Warnings...");
    const today = "(NOW() AT TIME ZONE 'Asia/Jakarta')::DATE";
    const nowInJakarta = "(NOW() AT TIME ZONE 'Asia/Jakarta')";
    const sql = `SELECT j.id, j.mata_pelajaran, j.guru_id, g.email, g.nama FROM jadwal j JOIN guru g ON j.guru_id = g.id WHERE DATE(j.waktu_mulai AT TIME ZONE 'Asia/Jakarta') = ${today} AND j.waktu_mulai < ${nowInJakarta} AND j.peringatan_absen_terkirim = false`;
    const { rows: schedules } = await db.query(sql);
    if (schedules.length > 0) console.log(`  - Found ${schedules.length} overdue schedules to check.`);
    for (const schedule of schedules) {
      const { rows: absenceRows } = await db.query(`SELECT id FROM absensi WHERE guru_id = $1 AND tanggal = ${today}`, [schedule.guru_id]);
      if (absenceRows.length === 0 && schedule.email) {
        await sendAbsenceWarningEmail(schedule.email, schedule);
      }
      await db.query('UPDATE jadwal SET peringatan_absen_terkirim = true WHERE id = $1', [schedule.id]);
    }
}

async function checkDailyReminders() {
    console.log("[TASK] Running: Daily General Reminders...");
    const today = "(NOW() AT TIME ZONE 'Asia/Jakarta')::DATE";
    const sql = `SELECT g.id, g.nama, g.email FROM guru g WHERE NOT EXISTS (SELECT 1 FROM absensi a WHERE a.guru_id = g.id AND a.tanggal = ${today}) AND g.notifikasi_harian_terkirim = false;`;
    const { rows: teachers } = await db.query(sql);
    if (teachers.length > 0) console.log(`  - Found ${teachers.length} teachers for daily reminder.`);
    for (const teacher of teachers) {
        if (teacher.email) {
            await sendDailyAbsenceReminderEmail(teacher.email, teacher);
            await db.query('UPDATE guru SET notifikasi_harian_terkirim = true WHERE id = $1', [teacher.id]);
        }
    }
}
