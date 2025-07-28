// File: /api/cron/reset-daily-flags.js
const db = require('../../db'); // Sesuaikan path ke koneksi DB Anda

export default async function handler(request, response) {
    if (request.headers.authorization !== `Bearer ${process.env.CRON_SECRET}`) {
        return response.status(401).end('Unauthorized');
    }

    console.log('[CRON-RESET] Resetting daily notification flags for all teachers...');
    try {
        await db.query('UPDATE guru SET notifikasi_harian_terkirim = false');
        console.log('[CRON-RESET] Flags reset successfully.');
        return response.status(200).send('Daily flags have been reset.');
    } catch (error) {
        console.error('[VERCEL_CRON_RESET_ERROR]', error);
        return response.status(500).json({ message: 'Failed to reset flags' });
    }
}