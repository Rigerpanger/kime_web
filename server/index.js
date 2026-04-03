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
        const { rows } = await pool.query('SELECT * FROM projects ORDER BY sort_order ASC');
        res.json(rows);
    } catch (err) { res.status(500).json({ error: err.message }); }
});

// --- PARTNERS CRUD ---
app.get(['/partners', '/api/partners'], async (req, res) => {
    try {
        const { rows } = await pool.query('SELECT * FROM partners ORDER BY order_index ASC');
        res.json(rows);
    } catch (err) { res.status(500).json({ error: err.message }); }
});

// --- CERTIFICATES CRUD ---
app.get(['/certificates', '/api/certificates'], async (req, res) => {
    try {
        const { rows } = await pool.query('SELECT * FROM certificates ORDER BY order_index ASC');
        res.json(rows);
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

app.listen(PORT, () => console.log(`🚀 Kime API Server started on port ${PORT}`));
