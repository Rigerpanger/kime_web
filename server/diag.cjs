const { Pool } = require('pg');
const { ImapFlow } = require('imapflow');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

async function diagnose() {
    console.log('🚀 [REMOTE] Диагностика Тумбы на удаленном сервере...');
    
    // 1. Проверка Базы Данных (Удаленная)
    const dbConfig = {
        user: process.env.DB_USER,
        host: process.env.DB_HOST, // 5.101.113.67
        database: process.env.DB_NAME,
        password: process.env.DB_PASSWORD,
        port: parseInt(process.env.DB_PORT || '5432'),
    };
    
    console.log(`📡 Попытка подключения к БД: ${dbConfig.host} (Пользователь: ${dbConfig.user})`);
    
    if (!dbConfig.password || dbConfig.password.includes('ПАРОЛЬ')) {
        console.log('❌ Ошибка: Вы не вписали пароль в .env файл!');
        return;
    }

    const pool = new Pool(dbConfig);
    
    try {
        console.log('⏳ Соединяемся с сервером...');
        const client = await pool.connect();
        console.log('✅ УДАЧА! Подключено к боевой базе данных.');
        
        const res = await client.query('SELECT COUNT(*) FROM tenders');
        console.log(`📈 Статистика: В таблице tenders сейчас ${res.rows[0].count} записей.`);
        client.release();
    } catch (e) {
        console.log('❌ Ошибка подключения:');
        console.error(e.message);
        if (e.message.includes('timeout')) {
            console.log('💡 СОВЕТ: Похоже, хостинг блокирует внешние подключения. Нужно открыть порт 5432 в фаерволе сервера.');
        }
    } finally {
        await pool.end();
    }

    // 2. Почта
    console.log('\n📧 Проверка связи с почтой Яндекса...');
    const client = new ImapFlow({
        host: 'imap.yandex.ru',
        port: 993,
        secure: true,
        auth: { user: process.env.YANDEX_EMAIL, pass: process.env.YANDEX_APP_PASSWORD },
        authMethod: 'LOGIN',
        logger: false
    });

    try {
        await client.connect();
        console.log('✅ IMAP: OK. Можем забирать тендеры.');
        await client.logout();
    } catch (e) {
        console.log('❌ Ошибка IMAP:', e.message);
    }
}

diagnose();
