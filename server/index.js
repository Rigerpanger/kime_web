import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import fetch from 'node-fetch';
import pg from 'pg';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load env from project root
dotenv.config({ path: path.join(__dirname, '../.env') });

console.log('-------------------------------------------');
console.log('🚀 SERVER STARTUP CHECK:');
console.log('PORT:', process.env.PORT || '3001 (Default)');
console.log('JWT_SECRET:', process.env.JWT_SECRET ? '✅ OK' : '❌ MISSING');
console.log('-------------------------------------------');

const { Pool } = pg;
const app = express();
const PORT = process.env.PORT || 3005;
const JWT_SECRET = process.env.JWT_SECRET || 'kime-super-secret-key';

const pool = new Pool({
    user: 'kime_admin',
    host: '127.0.0.1',
    database: 'kime_db',
    password: 'O)1%eFPrk@UfKdpG',
    port: 5432,
});

// --- INITIALIZE DATABASE ---
const initDB = async () => {
    try {
        await pool.query(`
            CREATE TABLE IF NOT EXISTS users (
                id SERIAL PRIMARY KEY,
                email VARCHAR(255) UNIQUE NOT NULL,
                password_hash VARCHAR(255) NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
            CREATE TABLE IF NOT EXISTS site_content (
                section_key VARCHAR(50) PRIMARY KEY,
                content_json JSONB NOT NULL,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
            CREATE TABLE IF NOT EXISTS projects (
                id SERIAL PRIMARY KEY,
                title VARCHAR(255) NOT NULL,
                slug VARCHAR(255) UNIQUE NOT NULL,
                challenge TEXT,
                solution TEXT,
                result TEXT,
                short_description TEXT,
                client VARCHAR(255),
                cover VARCHAR(255),
                video_url VARCHAR(255),
                tags JSONB,
                tech JSONB,
                sort_order INTEGER DEFAULT 0
            );
            CREATE TABLE IF NOT EXISTS certificates (
                id SERIAL PRIMARY KEY,
                company VARCHAR(255),
                division VARCHAR(255),
                position VARCHAR(255),
                image_url VARCHAR(255),
                order_index INTEGER DEFAULT 0
            );
            CREATE TABLE IF NOT EXISTS partners (
                id SERIAL PRIMARY KEY,
                name VARCHAR(255),
                logo_url VARCHAR(255),
                width INTEGER DEFAULT 100,
                order_index INTEGER DEFAULT 0
            );
            CREATE TABLE IF NOT EXISTS telegram_history (
                id SERIAL PRIMARY KEY,
                chat_id BIGINT NOT NULL,
                role VARCHAR(20) NOT NULL,
                content TEXT NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
            CREATE TABLE IF NOT EXISTS telegram_users (
                id SERIAL PRIMARY KEY,
                chat_id BIGINT UNIQUE,
                username VARCHAR(255) UNIQUE NOT NULL,
                role VARCHAR(20) DEFAULT 'colleague',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
            CREATE TABLE IF NOT EXISTS telegram_tasks (
                id SERIAL PRIMARY KEY,
                assigner_chat_id BIGINT,
                assignee_username VARCHAR(255) NOT NULL,
                task_description TEXT NOT NULL,
                status VARCHAR(50) DEFAULT 'pending',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
            CREATE TABLE IF NOT EXISTS telegram_memory (
                id SERIAL PRIMARY KEY,
                fact_content TEXT NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
            CREATE TABLE IF NOT EXISTS telegram_reminders (
                id SERIAL PRIMARY KEY,
                chat_id BIGINT NOT NULL,
                remind_at TIMESTAMP NOT NULL,
                content TEXT NOT NULL,
                is_sent BOOLEAN DEFAULT false,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `);
        
        // Вставка стартового администратора
        await pool.query(`
            INSERT INTO telegram_users (username, role) 
            VALUES ('richardsn', 'admin') 
            ON CONFLICT (username) DO UPDATE SET role = 'admin';
        `);
        
        console.log('✅ Database tables checked/initialized');
    } catch (err) {
        console.error('❌ Database initialization error:', err.message);
    }
};
initDB();

app.use(cors({ origin: '*' }));
app.use(express.json());

const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir);
app.use(['/uploads', '/api/uploads'], express.static(uploadsDir));

// --- SMART MEDIA PROXY (Works with /api and without) ---
app.get(['/m/:id', '/api/m/:id'], (req, res) => {
    try {
        let filename = req.params.id;
        if (!filename.includes('.') && filename.includes('_')) {
            filename = filename.replace('_', '.');
        }
        const filePath = path.join(uploadsDir, filename);
        if (fs.existsSync(filePath)) {
            res.sendFile(filePath);
        } else {
            res.status(404).json({ error: 'File not found' });
        }
    } catch (err) { res.status(500).json({ error: err.message }); }
});

const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, uploadsDir),
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, uniqueSuffix + path.extname(file.originalname));
    }
});
const upload = multer({ storage });

const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    if (!token) return res.status(401).json({ error: 'Access denied' });
    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) return res.status(403).json({ error: 'Invalid token' });
        req.user = user;
        next();
    });
};


// --- AUTH ---
app.post(['/auth/login', '/api/auth/login'], async (req, res) => {
    const { email, password } = req.body;
    try {
        const { rows } = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
        if (rows.length === 0) return res.status(401).json({ error: 'Пользователь не найден' });
        
        const user = rows[0];
        const validPassword = await bcrypt.compare(password, user.password_hash);
        if (!validPassword) return res.status(401).json({ error: 'Неверный пароль' });
        
        const token = jwt.sign({ id: user.id, email: user.email }, JWT_SECRET, { expiresIn: '7d' });
        res.json({ token, user: { id: user.id, email: user.email } });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

// --- FILE UPLOAD ---
app.post(['/upload', '/api/upload'], authenticateToken, upload.single('image'), (req, res) => {
    if (!req.file) return res.status(400).json({ error: 'No file' });
    let proxyFilename = req.file.filename;
    const ext = path.extname(req.file.originalname).toLowerCase();
    if (!['.hdr', '.hdri', '.exr'].includes(ext)) {
        proxyFilename = proxyFilename.replace('.', '_');
    }
    res.json({ url: `/m/${proxyFilename}` });
});

// --- PROJECTS CRUD ---
app.get(['/projects', '/api/projects'], async (req, res) => {
    try {
        const { rows } = await pool.query('SELECT * FROM projects ORDER BY sort_order ASC, id DESC');
        res.json(rows);
    } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post(['/projects', '/api/projects'], authenticateToken, async (req, res) => {
    const { title, slug, challenge, solution, result, short_description, client, cover, video_url, tags, tech, sort_order } = req.body;
    try {
        const { rows } = await pool.query(
            `INSERT INTO projects (title, slug, challenge, solution, result, short_description, client, cover, video_url, tags, tech, sort_order)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12) RETURNING *`,
            [title, slug, challenge, solution, result, short_description, client, cover, video_url, tags, tech, sort_order || 0]
        );
        res.status(201).json(rows[0]);
    } catch (err) { res.status(500).json({ error: err.message }); }
});

app.patch(['/projects/:id', '/api/projects/:id'], authenticateToken, async (req, res) => {
    const { id } = req.params;
    const { title, slug, challenge, solution, result, short_description, client, cover, video_url, tags, tech, sort_order } = req.body;
    try {
        const { rows } = await pool.query(
            `UPDATE projects SET 
                title = COALESCE($1, title), 
                slug = COALESCE($2, slug), 
                challenge = COALESCE($3, challenge), 
                solution = COALESCE($4, solution), 
                result = COALESCE($5, result), 
                short_description = COALESCE($6, short_description), 
                client = COALESCE($7, client), 
                cover = COALESCE($8, cover), 
                video_url = COALESCE($9, video_url), 
                tags = COALESCE($10, tags), 
                tech = COALESCE($11, tech), 
                sort_order = COALESCE($12, sort_order)
             WHERE id = $13 RETURNING *`,
            [title, slug, challenge, solution, result, short_description, client, cover, video_url, tags, tech, sort_order, id]
        );
        if (rows.length === 0) return res.status(404).json({ error: 'Project not found' });
        res.json(rows[0]);
    } catch (err) { res.status(500).json({ error: err.message }); }
});

app.delete(['/projects/:id', '/api/projects/:id'], authenticateToken, async (req, res) => {
    try {
        await pool.query('DELETE FROM projects WHERE id = $1', [req.params.id]);
        res.json({ success: true });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

// --- PARTNERS CRUD ---
app.get(['/partners', '/api/partners'], async (req, res) => {
    try {
        const { rows } = await pool.query('SELECT * FROM partners ORDER BY order_index ASC, id DESC');
        res.json(rows);
    } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post(['/partners', '/api/partners'], authenticateToken, async (req, res) => {
    const { name, logo_url, width, order_index } = req.body;
    try {
        const { rows } = await pool.query(
            'INSERT INTO partners (name, logo_url, width, order_index) VALUES ($1, $2, $3, $4) RETURNING *',
            [name, logo_url, width || 100, order_index || 0]
        );
        res.status(201).json(rows[0]);
    } catch (err) { res.status(500).json({ error: err.message }); }
});

app.delete(['/partners/:id', '/api/partners/:id'], authenticateToken, async (req, res) => {
    try {
        await pool.query('DELETE FROM partners WHERE id = $1', [req.params.id]);
        res.json({ success: true });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

// --- CERTIFICATES CRUD ---
app.get(['/certificates', '/api/certificates'], async (req, res) => {
    try {
        const { rows } = await pool.query('SELECT * FROM certificates ORDER BY order_index ASC, id DESC');
        res.json(rows);
    } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post(['/certificates', '/api/certificates'], authenticateToken, async (req, res) => {
    const { company, division, position, image_url, order_index } = req.body;
    try {
        const { rows } = await pool.query(
            'INSERT INTO certificates (company, division, position, image_url, order_index) VALUES ($1, $2, $3, $4, $5) RETURNING *',
            [company, division, position, image_url, order_index || 0]
        );
        res.status(201).json(rows[0]);
    } catch (err) { res.status(500).json({ error: err.message }); }
});

app.put(['/certificates/:id', '/api/certificates/:id'], authenticateToken, async (req, res) => {
    const { id } = req.params;
    const { company, division, position, image_url, order_index } = req.body;
    try {
        const { rows } = await pool.query(
            `UPDATE certificates SET 
                company = COALESCE($1, company), 
                division = COALESCE($2, division), 
                position = COALESCE($3, position), 
                image_url = COALESCE($4, image_url), 
                order_index = COALESCE($5, order_index)
             WHERE id = $6 RETURNING *`,
            [company, division, position, image_url, order_index, id]
        );
        if (rows.length === 0) return res.status(404).json({ error: 'Certificate not found' });
        res.json(rows[0]);
    } catch (err) { res.status(500).json({ error: err.message }); }
});

app.delete(['/certificates/:id', '/api/certificates/:id'], authenticateToken, async (req, res) => {
    try {
        await pool.query('DELETE FROM certificates WHERE id = $1', [req.params.id]);
        res.json({ success: true });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

// --- SITE CONTENT ---
app.get(['/content/:key', '/api/content/:key'], async (req, res) => {
    try {
        const { rows } = await pool.query('SELECT content_json FROM site_content WHERE section_key = $1', [req.params.key]);
        if (rows.length === 0) return res.status(404).json({ error: 'Not found' });
        res.json(rows[0].content_json);
    } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post(['/content/:key', '/api/content/:key'], authenticateToken, async (req, res) => {
    const { key } = req.params;
    const content = req.body;
    try {
        const { rows } = await pool.query(
            `INSERT INTO site_content (section_key, content_json, updated_at)
             VALUES ($1, $2, NOW())
             ON CONFLICT (section_key) 
             DO UPDATE SET content_json = $2, updated_at = NOW()
             RETURNING *`,
            [key, JSON.stringify(content)]
        );
        res.json(rows[0].content_json);
    } catch (err) { res.status(500).json({ error: err.message }); }
});

// --- DEBUG STATUS ---
app.get(['/debug-status', '/api/debug-status'], async (req, res) => {
    try {
        const dbTest = await pool.query('SELECT NOW()');
        const apiKey = process.env.VITE_OPENAI_API_KEY || process.env.OPENAI_API_KEY || process.env.SERVICE_API_KEY;
        
        let proxyPing = 'Not tested';
        const testProxy = process.env.AI_PROXY_URL || 'https://api.openai-proxy.com/v1/chat/completions';
        try {
            const pingRes = await fetch(testProxy, { method: 'OPTIONS' }).catch(e => ({ status: 'FAILED', error: e.message }));
            proxyPing = pingRes.status === 200 || pingRes.status === 204 ? `✅ REACHABLE (${testProxy})` : `❌ ${pingRes.status || 'FAILED'} (${pingRes.error || ''})`;
        } catch (e) { proxyPing = `❌ ERROR: ${e.message}`; }

        res.json({
            status: 'online',
            node_version: process.version,
            db_connected: !!dbTest.rows[0],
            ai_key_found: !!apiKey,
            ai_key_start: apiKey ? apiKey.substring(0, 10) + '...' : 'MISSING',
            proxy_reachable: proxyPing,
            port: PORT,
            available_env_vars: Object.keys(process.env).sort()
        });
    } catch (err) { res.status(500).json({ status: 'error', details: err.message }); }
});

// --- TELEGRAM BOT CONFIG ---
const TG_TOKEN = '8626390056:AAG3GK8Elb2eNcWZIIBjpom2OKzybHvaEms';
const TG_CHAT_ID = '-1003720321085';
const TG_BOT_USERNAME = 'kimeprodbot';

const sendTelegramMessage = async (chatId, text, parseMode = 'Markdown') => {
    try {
        const url = `https://api.telegram.org/bot${TG_TOKEN}/sendMessage`;
        const res = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ chat_id: chatId, text, parse_mode: parseMode })
        });
        return await res.json();
    } catch (err) { console.error('❌ Telegram Send Error:', err.message); }
};

// --- AI Chat ---
app.post(['/chat', '/api/chat'], async (req, res) => {
    try {
        // Priority: 1. FastPanel/System Env, 2. .env file fallback
        const apiKeyRaw = process.env.OPENAI_API_KEY || process.env.VITE_OPENAI_API_KEY || process.env.SERVICE_API_KEY;
        
        if (!apiKeyRaw) {
            return res.status(500).json({ 
                error: 'SERVER_CONFIG_ERROR', 
                details: 'OpenAI API Key is not set on the server environment.' 
            });
        }

        // AGGRESSIVE STRIPPING: remove hidden control characters and split if the panel merged lines
        // We take only the first token (the actual key) and ignore anything that might've merged (like BOT_ADMIN_IDS)
        const apiKey = apiKeyRaw.split(/[\n\r\s]/)[0].trim();

        // Support for older Node versions without AbortController
        let controller;
        let signal;
        try {
            if (global.AbortController) {
                controller = new AbortController();
                signal = controller.signal;
                setTimeout(() => controller.abort(), 20000);
            }
        } catch (e) { console.warn('AbortController not supported'); }

        const proxyUrl = process.env.AI_PROXY_URL || 'https://api.openai-proxy.com/v1/chat/completions';
        console.log(`🤖 Routing AI request via transparent mirror: ${proxyUrl}`);

        const response = await fetch(proxyUrl, {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json', 
                'Authorization': `Bearer ${apiKey}` 
            },
            body: JSON.stringify({ 
                model: 'gpt-4o-mini', 
                messages: [
                    { 
                        role: 'system', 
                        content: `Ты — Elite Creative Estimator студии KIME. Твое общение — это пре-сейл квалификация. Ты должен быть предельно лаконичен, профессионален и техничен. Избегай междометий и "воды".

АЛГОРИТМ (строго по одному вопросу):
1. **Технический стек/Тип**: Узнай, что именно нужно (Сайт, Инсталляция, Приложение, CG).
2. **Масштаб**: Узнай объем (количество экранов, площадь застройки, сложность логики).
3. **Сроки**: Узнай дедлайн.
4. **Результат**: Озвучь рыночную "вилку" цен в рублях (Лендинги: 100-300к, Сложные сервисы: 500к-2м, Инсталляции: 300к-1.5м). 
   - ОБЯЗАТЕЛЬНЫЙ ДИСКЛЕЙМЕР: "Это ориентировочная рыночная вилка. Финальную смету и ТЗ готовит команда KIME после детального брифинга".
   - ЗАПРОС КОНТАКТА: "Оставь свой Telegram (@username), чтобы мы могли обсудить детали".

ПРАВИЛА:
- Никаких "Отлично!", "Круто!", "Давайте погрузимся". Сразу к делу.
- Только один вопрос за раз.
- Если клиент уходит от темы, вежливо возвращай к параметрам проекта.
- В конце каждого сообщения напоминай, что можно нажать кнопку "Отправить диалог менеджеру" для связи.`
                    }, 
                    ...(req.body.messages || [])
                ] 
            }),
            signal: signal
        });
        
        if (!response.ok) {
            const errorText = await response.text();
            return res.status(response.status).json({ 
                error: 'UPSTREAM_API_ERROR', 
                status: response.status,
                details: errorText 
            });
        }
        
        res.json(await response.json());
    } catch (error) { 
        console.error('❌ AI Handler Exception:', error);
        res.status(500).json({ 
            error: 'AI_HANDLER_EXCEPTION', 
            details: error.message,
            type: error.name
        }); 
    }
});

// --- Telegram Notify (Leads from Website) ---
app.post(['/notify', '/api/notify'], async (req, res) => {
    const { messages, contact } = req.body;
    if (!messages || !contact) return res.status(400).json({ error: 'Missing data' });

    let transcript = `🎯 *Новая заявка: KIME Website*\n👤 *Клиент:* ${contact}\n\n📝 *История диалога:*\n`;
    messages.forEach(m => {
        const role = m.role === 'user' ? '👤 Клиент' : '🤖 ИИ';
        transcript += `*${role}:* ${m.content}\n\n`;
    });

    const result = await sendTelegramMessage(TG_CHAT_ID, transcript);
    res.json({ success: !!result.ok });
});

// --- TELEGRAM BACKGROUND SCHEDULER ---
setInterval(async () => {
    try {
        // Проверка напоминаний
        const { rows: reminders } = await pool.query('SELECT * FROM telegram_reminders WHERE is_sent = false AND remind_at <= NOW()');
        for (const r of reminders) {
            await sendTelegramMessage(r.chat_id, `🔔 *Напоминание:*\n${r.content}`);
            await pool.query('UPDATE telegram_reminders SET is_sent = true WHERE id = $1', [r.id]);
        }
    } catch (e) {
        console.error('Cron error:', e.message);
    }
}, 30000); // Check every 30 seconds

// --- Telegram Webhook (Interact in Group & DMs) ---
app.post(['/telegram-webhook', '/api/telegram-webhook'], async (req, res) => {
    try {
        const update = req.body;
        if (!update || !update.message || !update.message.text) return res.sendStatus(200);

        const chatId = update.message.chat.id;
        const text = update.message.text;
        const MessageId = update.message.message_id;
        const user = update.message.from.username;
        if (!user) return res.sendStatus(200); // Требуем, чтобы у сотрудника был @username

        const isPrivate = update.message.chat.type === 'private';
        
        // --- 1. ПРОВЕРКА БЕЛОГО СПИСКА ---
        const userCheck = await pool.query('SELECT * FROM telegram_users WHERE username = $1', [user]);
        if (userCheck.rows.length === 0) {
            if (isPrivate) await sendTelegramMessage(chatId, `❌ У вас нет доступа к корпоративному ассистенту KIME.`);
            return res.sendStatus(200);
        }
        const dbUser = userCheck.rows[0];

        // Запоминаем chat_id для будущих ЛС, если его еще нет
        if (isPrivate && !dbUser.chat_id) {
            await pool.query('UPDATE telegram_users SET chat_id = $1 WHERE username = $2', [chatId, user]);
        }

        // --- 2. АДМИН-КОМАНДЫ (минуя AI) ---
        const lowerText = text.toLowerCase();
        if (lowerText.startsWith('добавь в общение @')) {
            if (dbUser.role === 'admin') {
                const newUser = text.split('@')[1].trim();
                await pool.query('INSERT INTO telegram_users (username) VALUES ($1) ON CONFLICT DO NOTHING', [newUser]);
                await sendTelegramMessage(chatId, `✅ Пользователь @${newUser} добавлен в белый список.`);
            } else {
                await sendTelegramMessage(chatId, `❌ У вас нет прав для добавления сотрудников.`);
            }
            return res.sendStatus(200);
        }
        await pool.query('INSERT INTO telegram_history (chat_id, role, content) VALUES ($1, $2, $3)', 
            [chatId, 'user', `${user}: ${text}`]);
        
        // --- 3. ПОНИМАНИЕ КОНТЕКСТА ---
        let shouldProcess = isPrivate; // В ЛС общаемся всегда
        
        if (!isPrivate) {
            const isReplyToBot = update.message.reply_to_message && update.message.reply_to_message.from.username === TG_BOT_USERNAME;
            const hasTrigger = text.includes(`@${TG_BOT_USERNAME}`) || lowerText.includes('тумб') || lowerText.includes('ты что думаешь');
            
            // Если последнее сообщение от ассистента было менее 3 минут назад - держим контекст
            const { rows: historyCheck } = await pool.query('SELECT role, created_at FROM telegram_history WHERE chat_id = $1 ORDER BY created_at DESC LIMIT 1', [chatId]);
            const isContextActive = historyCheck.length > 0 && 
                                    historyCheck[0].role === 'assistant' && 
                                    (new Date() - new Date(historyCheck[0].created_at)) < 3 * 60 * 1000;
            
            if (hasTrigger || isReplyToBot || isContextActive) {
                shouldProcess = true;
            }
        }

        // Сохраняем в историю
        await pool.query('INSERT INTO telegram_history (chat_id, role, content) VALUES ($1, $2, $3)', 
            [chatId, 'user', `${user}: ${text}`]);
        // Храним последние 15 сообщений
        await pool.query('DELETE FROM telegram_history WHERE id IN (SELECT id FROM telegram_history WHERE chat_id = $1 ORDER BY created_at DESC OFFSET 15)', [chatId]);

        if (!shouldProcess) return res.sendStatus(200);

        // --- 4. ПОДГОТОВКА ИИ-ПРОМПТА ---
        const { rows: historyRows } = await pool.query('SELECT role, content FROM telegram_history WHERE chat_id = $1 ORDER BY created_at ASC', [chatId]);
        const { rows: memoryRows } = await pool.query('SELECT fact_content FROM telegram_memory ORDER BY created_at DESC LIMIT 10');
        const { rows: tasksRows } = await pool.query('SELECT * FROM telegram_tasks WHERE status != \'completed\'');

        let memoryString = memoryRows.map(r => `- ${r.fact_content}`).join('\n');
        let tasksString = tasksRows.map(r => `[ID:${r.id}] @${r.assignee_username}: ${r.task_description} (Статус: ${r.status})`).join('\n');

        const systemPrompt = `Ты — Корпоративный Telegram-ассистент KIME. Твое имя "Тумба". Ты умный Project Manager.
Текущее время на сервере: ${new Date().toISOString()}

ТВОИ ДОЛГОВРЕМЕННЫЕ ЭТАЛОНЫ И ПРАВИЛА (ПАМЯТЬ):
${memoryString || '(Пусто)'}

АКТИВНЫЕ ЗАДАЧИ СОТРУДНИКОВ:
${tasksString || '(Задач нет)'}

ИНСТРУКЦИИ ДЛЯ СИСТЕМНЫХ ДЕЙСТВИЙ (ОБЯЗАТЕЛЬНО ИСПОЛЬЗУЙ ИХ, ЕСЛИ ПРОСЯТ):
1. Если нужно создать задачу сотруднику, строго выведи на новой строке команду:
$$TASK_CREATE: @username | описание задачи$$

2. Если просят запомнить что-то на будущее, выведи на новой строке:
$$MEMORY_SAVE: факт, который нужно выучить$$

3. Если нужно поставить напоминание, выведи строго в формате (YYYY-MM-DD HH:mm):
$$REMINDER_CREATE: 2026-04-05 15:00 | текст напоминания$$

Отвечай профессионально, дружелюбно, но по делу. Если системные команды не нужны - пиши обычный текст.`;

        const aiMessages = [
            { role: 'system', content: systemPrompt },
            ...historyRows.map(r => ({ role: r.role, content: r.content }))
        ];

        const apiKeyRaw = process.env.OPENAI_API_KEY || process.env.VITE_OPENAI_API_KEY || process.env.SERVICE_API_KEY;
            const apiKey = apiKeyRaw ? apiKeyRaw.split(/[\n\r\s]/)[0].trim() : '';

        // --- 5. ВЫЗОВ ФЛАГМАНСКОЙ МОДЕЛИ gpt-4o ---
        const aiRes = await fetch('https://api.openai-proxy.com/v1/chat/completions', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}` },
            body: JSON.stringify({ model: 'gpt-4o', messages: aiMessages })
        });

        if (aiRes.ok) {
            const data = await aiRes.json();
            let reply = data.choices[0].message.content;

            // --- 6. ОБРАБОТКА СИСТЕМНЫХ КОМАНД (ПАРСИНГ) ---
            const taskMatch = reply.match(/\$\$TASK_CREATE:\s*@([^\s|]+)\s*\|\s*([^$]+)\$\$/);
            if (taskMatch) {
                const targetUser = taskMatch[1].replace('@','').trim();
                const desc = taskMatch[2].trim();
                await pool.query('INSERT INTO telegram_tasks (assigner_chat_id, assignee_username, task_description) VALUES ($1, $2, $3)', [chatId, targetUser, desc]);
                
                // Пробуем оповестить в ЛС
                const { rows: tUser } = await pool.query('SELECT chat_id FROM telegram_users WHERE username = $1', [targetUser]);
                if (tUser.length > 0 && tUser[0].chat_id) {
                    await sendTelegramMessage(tUser[0].chat_id, `⚡️ *Новая задача:*\n${desc}`);
                }
                reply = reply.replace(taskMatch[0], `\n✅ Задача для @${targetUser} добавлена в систему!`);
            }

            const memoryMatch = reply.match(/\$\$MEMORY_SAVE:\s*([^$]+)\$\$/);
            if (memoryMatch) {
                await pool.query('INSERT INTO telegram_memory (fact_content) VALUES ($1)', [memoryMatch[1].trim()]);
                reply = reply.replace(memoryMatch[0], `\n✅ Запомнил это как эталон.`);
            }

            const reminderMatch = reply.match(/\$\$REMINDER_CREATE:\s*([\d-]+\s[\d:]+)\s*\|\s*([^$]+)\$\$/);
            if (reminderMatch) {
                const datetime = reminderMatch[1].trim();
                const desc = reminderMatch[2].trim();
                
                // Перевод локального времени во время БД, если нужно. Оставляем пока как передал ИИ.
                await pool.query('INSERT INTO telegram_reminders (chat_id, remind_at, content) VALUES ($1, $2, $3)', [chatId, datetime, desc]);
                reply = reply.replace(reminderMatch[0], `\n⏰ Установлено напоминание на ${datetime}.`);
            }

            // Очистка возможных хвостов парсинга
            reply = reply.replace(/\$\$.+\$\$/g, '').trim();

            if (reply) {
                await sendTelegramMessage(chatId, reply);
                await pool.query('INSERT INTO telegram_history (chat_id, role, content) VALUES ($1, $2, $3)', [chatId, 'assistant', reply]);
            }
        } else {
            const errBody = await aiRes.text();
            console.error('AI Error Body:', errBody);
        }
        res.sendStatus(200);
    } catch (err) {
        console.error('❌ Webhook Error:', err);
        res.sendStatus(200); // Always 200 to Telegram
    }
});

app.listen(PORT, async () => {
    console.log(`🚀 Kime API Server started on port ${PORT}`);
    
    // Auto-register Telegram Webhook
    try {
        const webhookUrl = `https://kimeproduction.ru/api/telegram-webhook`;
        console.log(`🔄 Attempting to register Telegram Webhook: ${webhookUrl}`);
        const res = await fetch(`https://api.telegram.org/bot${TG_TOKEN}/setWebhook?url=${webhookUrl}`);
        const data = await res.json();
        if (data.ok) console.log('✅ Telegram Webhook registered successfully');
        else console.error('❌ Telegram Webhook registration FAILED:', data);
    } catch (err) { console.error('❌ Telegram Webhook critical error:', err.message); }
});
