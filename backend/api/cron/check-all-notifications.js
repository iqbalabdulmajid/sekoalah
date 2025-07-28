// Simpan file ini sebagai: /api/cron/check-all-notifications.js

const db = require('../../db'); // Pastikan path ini benar!
const {
    sendScheduleReminderEmail,
    sendAbsenceWarningEmail,
    sendDailyAbsenceReminderEmail
} = require('../../services/notificationService'); // Pastikan path ini benar!

export default async function handler(request, response) {
    console.log("--- CRON JOB HANDLER STARTED ---");

    // 1. Cek Keamanan
    const cronSecret = process.env.CRON_SECRET;
    if (!cronSecret) {
        console.error("FATAL ERROR: Environment variable CRON_SECRET tidak ditemukan!");
        return response.status(500).json({ message: "Server configuration error: CRON_SECRET is not set." });
    }

    const authHeader = request.headers.authorization;
    if (authHeader !== `Bearer ${cronSecret}`) {
        console.warn(`Unauthorized attempt. Header: ${authHeader}`);
        return response.status(401).json({ message: 'Unauthorized' });
    }
    console.log("Authorization check passed.");

    // 2. Jalankan Tugas-tugas
    try {
        await runTask(checkScheduleReminders, 'Schedule Reminders');
        await runTask(checkScheduleWarnings, 'Schedule Absence Warnings');
        await runTask(checkDailyReminders, 'Daily General Reminders');

        console.log("--- CRON JOB HANDLER FINISHED SUCCESSFULLY ---");
        return response.status(200).json({ status: 'OK' });

    } catch (error) {
        console.error("[HANDLER_CATCH_ALL] An unexpected error occurred in the handler:", error);
        return response.status(500).json({ status: 'Handler Failed', message: error.message });
    }
}

// Helper function untuk menjalankan dan me-log setiap tugas
async function runTask(taskFunction, taskName) {
    console.log(`[TASK START] Running: ${taskName}`);
    try {
        await taskFunction();
        console.log(`[TASK SUCCESS] Finished: ${taskName}`);
    } catch (error) {
        console.error(`[TASK FAILED] Error in ${taskName}:`, error);
        // Melempar error lagi agar bisa ditangkap oleh handler utama jika perlu
        throw error; 
    }
}


// --- Logika dari setiap cron job yang lama dipindahkan ke fungsi terpisah ---

async function checkScheduleReminders() {
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
