import pg from 'pg';
import bcrypt from 'bcryptjs';

const { Pool } = pg;

// Данные подключения из server/index.js
const pool = new Pool({
    user: 'kime_admin',
    host: '127.0.0.1',
    database: 'kime_db',
    password: 'O)1%eFPrk@UfKdpG',
    port: 5432,
});

const email = 'kimeproduction@gmail.com';
const newPassword = 'KimeAdmin2026!';

async function resetPassword() {
    try {
        console.log(`🚀 Начинаю сброс пароля для ${email}...`);
        
        // Хеширование
        const salt = await bcrypt.genSalt(10);
        const hash = await bcrypt.hash(newPassword, salt);
        
        // Обновление или вставка
        const res = await pool.query(
            `INSERT INTO users (email, password_hash) 
             VALUES ($1, $2) 
             ON CONFLICT (email) 
             DO UPDATE SET password_hash = $2 
             RETURNING id`,
            [email, hash]
        );
        
        if (res.rows.length > 0) {
            console.log('✅ Пароль успешно обновлен!');
            console.log(`📧 Email: ${email}`);
            console.log(`🔑 Новый пароль: ${newPassword}`);
            console.log('⚠️ Пожалуйста, удалите этот файл после успешного входа.');
        } else {
            console.error('❌ Ошибка: не удалось обновить пароль.');
        }
        
    } catch (err) {
        console.error('❌ Критическая ошибка:', err.message);
    } finally {
        await pool.end();
    }
}

resetPassword();
