const { Pool } = require('pg');
const { ImapFlow } = require('imapflow');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

async function diagnose() {
    console.log('🚀 [VERBOSE] Глубокая диагностика Тумбы...');
    console.log('📂 Путь к .env:', path.join(__dirname, '../.env'));
    
    // 1. Проверка Базы Данных
    console.log('🛠 Проверка БД...');
    const dbConfig = {
        user: process.env.DB_USER,
        host: process.env.DB_HOST,
        database: process.env.DB_NAME,
        password: process.env.DB_PASSWORD,
        port: parseInt(process.env.DB_PORT || '5432'),
    };
    
    console.log('📊 Конфиг (скрытый):', { ...dbConfig, password: '***' });
    
    const pool = new Pool(dbConfig);
    
    try {
        console.log('⏳ Попытка подключения к Pool...');
        const client = await pool.connect();
        console.log('🛰 Соединение установлено!');
        const res = await client.query('SELECT COUNT(*) FROM tenders');
        console.log(`✅ База данных: OK (Тендеров: ${res.rows[0].count})`);
        client.release();
    } catch (e) {
        console.log('❌ ОШИБКА БД (ПОЛНАЯ):');
        console.dir(e);
        if (e.code === 'ECONNREFUSED') console.log('💡 СОВЕТ: База данных PostgreSQL не запущена на этом порту/хосте.');
    } finally {
        await pool.end();
    }

    // 2. Почта
    console.log('\n📧 Проверка IMAP...');
    const email = process.env.YANDEX_EMAIL;
    if (!email) {
        console.log('❌ Ошибка: YANDEX_EMAIL не найден в .env');
        return;
    }

    const client = new ImapFlow({
        host: 'imap.yandex.ru',
        port: 993,
        secure: true,
        auth: {
            user: email,
            pass: process.env.YANDEX_APP_PASSWORD
        },
        authMethod: 'LOGIN',
        logger: false
    });

    try {
        await client.connect();
        console.log('✅ IMAP: Подключено (rp@kimeproduction.ru)');
        await client.logout();
    } catch (e) {
        console.log('❌ Ошибка IMAP:', e.message);
    }
}

diagnose();
