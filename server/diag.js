const { Pool } = require('pg');
const { ImapFlow } = require('imapflow');
require('dotenv').config();

async function diagnose() {
    console.log('🚀 Начинаю диагностику Тумбы...');

    // 1. Проверка БД
    const pool = new Pool({ connectionString: process.env.DATABASE_URL || 'postgres://kime_user:kime_password@localhost/kime_db' });
    try {
        const res = await pool.query('SELECT COUNT(*) FROM tenders');
        console.log(`✅ База данных: OK (Тендеров: ${res.rows[0].count})`);
    } catch (e) {
        console.log(`❌ Ошибка БД: ${e.message}`);
    } finally {
        await pool.end();
    }

    // 2. Проверка IMAP
    console.log('📧 Проверка подключения к почте...');
    const client = new ImapFlow({
        host: process.env.IMAP_HOST || 'imap.mail.ru',
        port: process.env.IMAP_PORT || 993,
        secure: true,
        auth: {
            user: process.env.IMAP_USER,
            pass: process.env.IMAP_PASS
        },
        logger: false
    });

    try {
        await client.connect();
        console.log('✅ IMAP: Подключено успешно');
        await client.logout();
    } catch (e) {
        console.log(`❌ Ошибка IMAP: ${e.message}`);
        console.log('Убедитесь, что пароль приложения (app password) верен.');
    }
}

diagnose();
