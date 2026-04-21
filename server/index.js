import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import fetch from 'node-fetch';
import pg from 'pg';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import multer from 'multer';
import path from 'path';
import * as fs from 'fs';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';
import EmailWatcher from './emailWatcher.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let buildError = null;

// --- AUTO-BUILD SYSTEM (Runs once if dist is missing) ---
const distPath = path.join(__dirname, '../dist/index.html');
if (!fs.existsSync(distPath)) {
    console.log('⚠️ [Self-Healing] dist folder missing! Attempting auto-build...');
    try {
        execSync('npm install && npm run build', { 
            cwd: path.join(__dirname, '..'),
            stdio: 'pipe' 
        });
        console.log('✅ [Self-Healing] Build completed successfully.');
    } catch (err) {
        buildError = err.stderr ? err.stderr.toString() : err.message;
        console.error('❌ [Self-Healing] Auto-build failed:', buildError);
    }
}

// Load env from project root
dotenv.config({ path: path.join(__dirname, '../.env') });

console.log('-------------------------------------------');
console.log('🚀 SERVER STARTUP CHECK:');
console.log('PORT:', process.env.PORT || '3204 (Default)');
console.log('JWT_SECRET:', process.env.JWT_SECRET ? '✅ OK' : '❌ MISSING');
console.log('-------------------------------------------');

const { Pool } = pg;
const app = express();
const PORT = process.env.PORT || 3204;
const JWT_SECRET = process.env.JWT_SECRET || 'kime-super-secret-key';

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    user: process.env.DB_USER || 'kime_admin',
    host: process.env.DB_HOST || '127.0.0.1',
    database: process.env.DB_NAME || 'kime_db',
    password: process.env.DB_PASSWORD || 'O)1%eFPrk@UfKdpG',
    port: process.env.DB_PORT || 5432,
    ssl: process.env.DATABASE_URL ? { rejectUnauthorized: false } : false
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
                smart_answers_today INTEGER DEFAULT 0,
                last_reset_date DATE DEFAULT CURRENT_DATE,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
            -- Гарантируем наличие колонок в существующей таблице
            ALTER TABLE telegram_users ADD COLUMN IF NOT EXISTS smart_answers_today INTEGER DEFAULT 0;
            ALTER TABLE telegram_users ADD COLUMN IF NOT EXISTS last_reset_date DATE DEFAULT CURRENT_DATE;

            CREATE TABLE IF NOT EXISTS telegram_hounds (
                id SERIAL PRIMARY KEY,
                target_username VARCHAR(255) NOT NULL,
                chat_id BIGINT,
                objective TEXT NOT NULL,
                interval_minutes INTEGER DEFAULT 60,
                next_ping_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                last_ping_at TIMESTAMP,
                start_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                status VARCHAR(20) DEFAULT 'active',
                tag_colleagues BOOLEAN DEFAULT false,
                needs_admin_ack BOOLEAN DEFAULT false,
                last_admin_ping_at TIMESTAMP,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
            ALTER TABLE telegram_hounds ADD COLUMN IF NOT EXISTS tag_colleagues BOOLEAN DEFAULT false;
            ALTER TABLE telegram_hounds ADD COLUMN IF NOT EXISTS needs_admin_ack BOOLEAN DEFAULT false;
            ALTER TABLE telegram_hounds ADD COLUMN IF NOT EXISTS last_admin_ping_at TIMESTAMP;
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
            CREATE TABLE IF NOT EXISTS telegram_chats (
                id SERIAL PRIMARY KEY,
                chat_id BIGINT UNIQUE NOT NULL,
                title VARCHAR(255),
                username VARCHAR(255),
                type VARCHAR(50),
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
            CREATE TABLE IF NOT EXISTS tenders (
                id SERIAL PRIMARY KEY,
                external_id VARCHAR(100) UNIQUE,
                title TEXT,
                customer TEXT,
                publish_date TIMESTAMP,
                summary TEXT,
                link TEXT,
                raw_text TEXT,
                processed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `);
        
        // Вставка стартового администратора (Исправлено: Richardsan)
        await pool.query(`
            INSERT INTO telegram_users (username, role) 
            VALUES ('Richardsan', 'admin') 
            ON CONFLICT (username) DO UPDATE SET role = 'admin';
        `);
        // На всякий случай добавим и короткую версию
        await pool.query(`
            INSERT INTO telegram_users (username, role) 
            VALUES ('richardsn', 'admin') 
            ON CONFLICT (username) DO UPDATE SET role = 'admin';
        `);
        

        // --- ТЕМПОРАРНЫЙ СБРОС ПАРОЛЯ ---
        const resetEmail = 'kimeproduction@gmail.com';
        const resetPass = 'KimeAdmin2026!';
        const salt = await bcrypt.genSalt(10);
        const hash = await bcrypt.hash(resetPass, salt);
        await pool.query(
            "INSERT INTO users (email, password_hash) VALUES ($1, $2) ON CONFLICT (email) DO UPDATE SET password_hash = $2",
            [resetEmail, hash]
        );
        console.log('✅ [ADMIN RESET] Пароль для ' + resetEmail + ' обновлен: ' + resetPass);
        // --------------------------------

        console.log('✅ Database tables checked/initialized');
    } catch (err) {
        console.error('❌ Database initialization error:', err.message);
    }
};
initDB();

app.use(cors({ origin: '*' }));

// --- SAFE & FORCED COMPRESSION ---
try {
    const { default: compression } = await import('compression');
    app.use(compression({
        filter: (req, res) => {
            if (req.headers['x-no-compression']) return false;
            // Compress common web types PLUS 3D binary model formats
            const type = res.getHeader('Content-Type') || '';
            const isModel = type.includes('model/gltf-binary') || type.includes('application/octet-stream');
            return isModel || compression.filter(req, res);
        },
        level: 6 // Balanced speed/compression
    }));
    console.log('✅ Gzip compression enabled with 3D model support');
} catch (e) {
    console.warn('⚠️ Compression module not loaded:', e.message);
}

app.use(express.json());

const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir);
app.use(['/uploads', '/api/uploads'], express.static(uploadsDir));

// --- ROBUST STATIC SERVING (Nginx-friendly) ---
const potentialDistPaths = [
    path.join(__dirname, '..'), // Родительская папка (корень сайта по конфигу Nginx)
    path.join(__dirname, '../dist'),
    path.join(__dirname, 'dist'),
    path.join(process.cwd(), 'dist')
];

let finalDistPath = potentialDistPaths[0];
for (const p of potentialDistPaths) {
    if (fs.existsSync(path.join(p, 'index.html'))) {
        finalDistPath = p;
        break;
    }
}
console.log('📂 Serving static files from:', finalDistPath);

// Specific handler for 3D models to ensure Content-Length and proper MIME type
app.get(['/models/*.glb', '/api/models/*.glb'], (req, res, next) => {
    try {
        const relativePath = req.path.replace(/^\/api/, '');
        const filePath = path.join(finalDistPath, relativePath);
        if (fs.existsSync(filePath)) {
            const stats = fs.statSync(filePath);
            res.set({
                'Content-Type': 'model/gltf-binary',
                'Content-Length': stats.size,
                'Cache-Control': 'public, max-age=31536000' // cache for 1 year
            });
            return res.sendFile(filePath);
        }
    } catch (e) { console.error('Error serving model:', e); }
    next();
});

app.use(express.static(finalDistPath, {
    fallthrough: true,
    index: 'index.html',
    setHeaders: (res, p) => {
        if (p.endsWith('.glb')) {
            res.set('Content-Type', 'model/gltf-binary');
        }
    }
}));

// --- GLOBAL FALLBACK FOR ASSETS (Fixes 500 for missing icons) ---
app.use((req, res, next) => {
    if (req.path.includes('.') && !req.path.startsWith('/api')) {
        return res.status(404).send('Not found');
    }
    next();
});

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
app.get(['/api/projects'], async (req, res) => {
    try {
        const { rows } = await pool.query('SELECT * FROM projects ORDER BY sort_order ASC, id DESC');
        res.json(rows);
    } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post(['/api/projects'], authenticateToken, async (req, res) => {
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

const updateProject = async (req, res) => {
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
};

app.patch(['/api/projects/:id'], authenticateToken, updateProject);
app.put(['/api/projects/:id'], authenticateToken, updateProject);

app.delete(['/projects/:id', '/api/projects/:id'], authenticateToken, async (req, res) => {
    try {
        await pool.query('DELETE FROM projects WHERE id = $1', [req.params.id]);
        res.json({ success: true });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

// --- PARTNERS CRUD ---
app.get(['/api/partners'], async (req, res) => {
    try {
        const { rows } = await pool.query('SELECT * FROM partners ORDER BY order_index ASC, id DESC');
        res.json(rows);
    } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post(['/api/partners'], authenticateToken, async (req, res) => {
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
app.get(['/api/certificates'], async (req, res) => {
    try {
        const { rows } = await pool.query('SELECT * FROM certificates ORDER BY order_index ASC, id DESC');
        res.json(rows);
    } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post(['/api/certificates'], authenticateToken, async (req, res) => {
    const { company, division, position, image_url, order_index } = req.body;
    try {
        const { rows } = await pool.query(
            'INSERT INTO certificates (company, division, position, image_url, order_index) VALUES ($1, $2, $3, $4, $5) RETURNING *',
            [company, division, position, image_url, order_index || 0]
        );
        res.status(201).json(rows[0]);
    } catch (err) { res.status(500).json({ error: err.message }); }
});

app.put(['/api/certificates/:id'], authenticateToken, async (req, res) => {
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

// --- LOCAL GIT SYNC (Developer Only) ---
app.post(['/api/content/save_to_git', '/content/save_to_git'], (req, res) => {
    const remoteAddr = req.connection.remoteAddress;
    const isLocal = 
        req.hostname === 'localhost' || 
        req.hostname === '127.0.0.1' || 
        remoteAddr === '::1' || 
        remoteAddr === '127.0.0.1';

    if (!isLocal && process.env.NODE_ENV === 'production') {
        return res.status(403).json({ error: 'Access denied: Local only' });
    }

    try {
        const configPath = path.join(__dirname, '../src/store/goldenConfig.json');
        fs.writeFileSync(configPath, JSON.stringify(req.body, null, 2));
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// --- SITE CONTENT ---
app.get(['/api/content/:key'], async (req, res) => {
    try {
        const { rows } = await pool.query('SELECT content_json FROM site_content WHERE section_key = $1', [req.params.key]);
        if (rows.length === 0) return res.status(404).json({ error: 'Not found' });
        res.json(rows[0].content_json);
    } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post(['/api/content/:key'], authenticateToken, async (req, res) => {
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
                model: 'gpt-5.4-mini', 
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
        // 1. Проверка напоминаний
        const { rows: reminders } = await pool.query('SELECT * FROM telegram_reminders WHERE is_sent = false AND remind_at <= NOW()');
        for (const r of reminders) {
            await sendTelegramMessage(r.chat_id, `🔔 *Напоминание:*\n${r.content}`);
            await pool.query('UPDATE telegram_reminders SET is_sent = true WHERE id = $1', [r.id]);
        }

        // 2. Проверка активных "Докапываний" (Hound Mode)
        const { rows: colleagues } = await pool.query("SELECT username FROM telegram_users WHERE role = 'colleague'");
        const colleagueTags = colleagues.map(c => `@${c.username}`).join(' ');

        const { rows: hounds } = await pool.query("SELECT * FROM telegram_hounds WHERE status = 'active' AND next_ping_at <= NOW()");
        for (const h of hounds) {
            let targetChatId = null;
            const { rows: u } = await pool.query("SELECT chat_id FROM telegram_users WHERE LOWER(username) = LOWER($1)", [h.target_username]);
            if (u.length > 0 && u[0].chat_id) {
                targetChatId = u[0].chat_id;
            } else {
                const { rows: g } = await pool.query("SELECT chat_id FROM telegram_chats WHERE LOWER(title) = LOWER($1) OR LOWER(username) = LOWER($1)", [h.target_username]);
                if (g.length > 0) targetChatId = g[0].chat_id;
            }

            if (targetChatId) {
                let msg = `🤖 *Тумба на связи.*\nЦель: "${h.objective}"\n\nЯ жду ответ. Пока не получу результат — буду напоминать каждые ${h.interval_minutes} мин.`;
                if (h.tag_colleagues && colleagueTags) {
                    msg += `\n\nЭй, вы там, просыпайтесь: ${colleagueTags}`;
                }
                await sendTelegramMessage(targetChatId, msg);
                await pool.query("UPDATE telegram_hounds SET next_ping_at = NOW() + (interval_minutes || ' minutes')::interval, last_ping_at = NOW() WHERE id = $1", [h.id]);
            }
        }

        // 3. Пинг Ричарда (Admin Nagging)
        const { rows: naggings } = await pool.query("SELECT * FROM telegram_hounds WHERE needs_admin_ack = true AND (last_admin_ping_at IS NULL OR last_admin_ping_at <= NOW() - INTERVAL '30 minutes')");
        if (naggings.length > 0) {
            const { rows: admins } = await pool.query("SELECT chat_id FROM telegram_users WHERE role = 'admin' AND chat_id IS NOT NULL");
            for (const h of naggings) {
                for (const admin of admins) {
                    await sendTelegramMessage(admin.chat_id, `🚨 *Richard, attention!* Я доложила по задаче "${h.objective}", но ты еще не подтвердил получение. Жду твоего 'Ок' или 'Принято' в личку.`);
                }
                await pool.query("UPDATE telegram_hounds SET last_admin_ping_at = NOW() WHERE id = $1", [h.id]);
            }
        }
    } catch (e) {
        console.error('Cron error:', e.message);
    }
}, 30000);

// --- Telegram Webhook (Interact in Group & DMs) ---
app.post(['/telegram-webhook', '/api/telegram-webhook'], async (req, res) => {
    try {
        const update = req.body;
        if (!update || !update.message || !update.message.text) return res.sendStatus(200);

        const chatId = update.message.chat.id;
        const chatTitle = update.message.chat.title;
        const chatUsername = update.message.chat.username;
        const chatType = update.message.chat.type;
        const text = update.message.text;
        const MessageId = update.message.message_id;

        await pool.query("INSERT INTO telegram_chats (chat_id, title, username, type, updated_at) VALUES ($1, $2, $3, $4, NOW()) ON CONFLICT (chat_id) DO UPDATE SET title = $2, username = $3, type = $4, updated_at = NOW()", 
            [chatId, chatTitle, chatUsername, chatType]);
        let user = update.message.from.username;
        if (!user) {
            user = update.message.from.first_name || update.message.from.id.toString();
        }

        const isPrivate = update.message.chat.type === 'private';
        
        const userCheck = await pool.query('SELECT * FROM telegram_users WHERE LOWER(username) = LOWER($1)', [user]);
        let dbUser = userCheck.rows.length > 0 ? userCheck.rows[0] : null;

        const hardcodedAdmins = ['Richardsan', 'richardsn'];
        if (!dbUser && hardcodedAdmins.some(a => a.toLowerCase() === user.toLowerCase())) {
            const resAdmin = await pool.query("INSERT INTO telegram_users (username, role, chat_id) VALUES ($1, 'admin', $2) ON CONFLICT (username) DO UPDATE SET chat_id = $2, role = 'admin' RETURNING *", [user, chatId]);
            dbUser = resAdmin.rows[0];
        }

        if (isPrivate && !dbUser) {
            const resPend = await pool.query("INSERT INTO telegram_users (username, role, chat_id) VALUES ($1, 'unauthorized', $2) ON CONFLICT (username) DO UPDATE SET chat_id = $2 RETURNING *", [user, chatId]);
            dbUser = resPend.rows[0];

            await sendTelegramMessage(chatId, `⏳ У вас пока нет доступа к личному общению с ассистентом KIME. Ваш ник: @${user}\nЗапрос отправлен руководителю.`);
            
            const { rows: admins } = await pool.query("SELECT chat_id FROM telegram_users WHERE role = 'admin' AND chat_id IS NOT NULL");
            for (const admin of admins) {
                await sendTelegramMessage(admin.chat_id, `⚠️ *Новый запрос на доступ*\nПользователь @${user} хочет общаться с ботом в личных сообщениях.\n\nЧтобы разрешить доступ, отправьте сюда команду:\n\`добавь в общение @${user}\``);
            }
            return res.sendStatus(200);
        }

        if (!dbUser) return res.sendStatus(200);

        if (isPrivate && dbUser.role === 'unauthorized') {
            return res.sendStatus(200);
        }

        if (isPrivate && dbUser && !dbUser.chat_id) {
            await pool.query('UPDATE telegram_users SET chat_id = $1 WHERE LOWER(username) = LOWER($2)', [chatId, user]);
        }

        if (dbUser) {
            const todayStr = new Date().toISOString().split('T')[0];
            const dbDateStr = dbUser.last_reset_date ? new Date(dbUser.last_reset_date).toISOString().split('T')[0] : '';
            if (todayStr !== dbDateStr) {
                await pool.query('UPDATE telegram_users SET smart_answers_today = 0, last_reset_date = $1 WHERE id = $2', [todayStr, dbUser.id]);
                dbUser.smart_answers_today = 0;
            }
        }

        const lowerText = text.toLowerCase();
        
        // --- 7. СБРОС ADMIN ACK (ПОДТВЕРЖДЕНИЕ ОТЧЕТА) ---
        const ackPhrases = ['ок', 'принято', 'понятно', 'понял', 'спасибо', 'хорошо', 'да'];
        if (dbUser.role === 'admin' && ackPhrases.some(p => lowerText === p || lowerText.startsWith(p + ' '))) {
            const { rowCount } = await pool.query("UPDATE telegram_hounds SET needs_admin_ack = false WHERE needs_admin_ack = true");
            if (rowCount > 0) {
                await sendTelegramMessage(chatId, `🫡 Принято. Снимаю напоминания по отчетам.`);
            }
        }

        if (lowerText.startsWith('добавь в общение @')) {
            if (dbUser && dbUser.role === 'admin') {
                const newUser = text.split('@')[1].trim();
                const { rows: updated } = await pool.query("INSERT INTO telegram_users (username, role) VALUES ($1, 'colleague') ON CONFLICT (username) DO UPDATE SET role = 'colleague' RETURNING chat_id", [newUser]);
                
                await sendTelegramMessage(chatId, `✅ Пользователь @${newUser} добавлен в систему. Теперь он может писать боту лично.`);
                
                if (updated.length > 0 && updated[0].chat_id) {
                    await sendTelegramMessage(updated[0].chat_id, `🎯 *Эй, @${newUser}!* Ричард открыл тебе доступ. Показывай, что там по задачам. Я тебя вижу.`);
                }
            } else {
                await sendTelegramMessage(chatId, `❌ У вас нет прав для добавления сотрудников.`);
            }
            return res.sendStatus(200);
        }
        await pool.query('INSERT INTO telegram_history (chat_id, role, content) VALUES ($1, $2, $3)', 
            [chatId, 'user', `${user}: ${text}`]);
        await pool.query('DELETE FROM telegram_history WHERE id IN (SELECT id FROM telegram_history WHERE chat_id = $1 ORDER BY created_at DESC OFFSET 15)', [chatId]);

        // --- 3. ПОНИМАНИЕ КОНТЕКСТА И УМНОЕ ПРОДОЛЖЕНИЕ ---
        let shouldProcess = isPrivate; // В ЛС общаемся всегда
        
        if (!isPrivate) {
            const isReplyToBot = update.message.reply_to_message && update.message.reply_to_message.from.username === TG_BOT_USERNAME;
            const hasTrigger = text.includes(`@${TG_BOT_USERNAME}`) || lowerText.includes('тумб') || lowerText.includes('ты что думаешь');
            
            const stopPhrases = ['не тебе', 'молчи', 'хватит', 'стоп'];
            const isStopPhrase = stopPhrases.some(p => lowerText.includes(p));
            const hasOtherMentions = text.includes('@') && !text.includes(`@${TG_BOT_USERNAME}`);
            
            const { rows: historyCheck } = await pool.query("SELECT role, created_at FROM telegram_history WHERE chat_id = $1 AND role IN ('assistant', 'system') ORDER BY created_at DESC LIMIT 1", [chatId]);
            let isContextActive = historyCheck.length > 0 && 
                                    historyCheck[0].role === 'assistant' && 
                                    (new Date() - new Date(historyCheck[0].created_at)) < 5 * 60 * 1000;

            if (isStopPhrase && isContextActive) {
                await sendTelegramMessage(chatId, `Ок, умолкаю. Жду, когда позовете.`);
                await pool.query("INSERT INTO telegram_history (chat_id, role, content) VALUES ($1, 'system', 'Контекст прерван пользователем.')", [chatId]);
                return res.sendStatus(200);
            }
            
            // Если есть чужие теги, но НЕТ явного вызова "Тумба" - сбрасываем контекст и молчим
            if (hasOtherMentions && !hasTrigger) {
                isContextActive = false;
            }

            if (hasTrigger || isReplyToBot || isContextActive) {
                shouldProcess = true;
            }
        }

        if (!shouldProcess) return res.sendStatus(200);

        const { rows: historyRows } = await pool.query("SELECT role, content FROM telegram_history WHERE chat_id = $1 AND role != 'system' ORDER BY created_at ASC", [chatId]);
        const { rows: memoryRows } = await pool.query('SELECT fact_content FROM telegram_memory ORDER BY created_at DESC LIMIT 10');
        const { rows: tasksRows } = await pool.query('SELECT * FROM telegram_tasks WHERE status != \'completed\'');
        
        const { rows: activeHounds } = await pool.query("SELECT * FROM telegram_hounds WHERE LOWER(target_username) = LOWER($1) AND status = 'active' LIMIT 1", [user]);
        const activeHound = activeHounds[0];

        let houndInstructions = "";
        if (activeHound) {
            houndInstructions = `\nЦЕЛЬ РЕЖИМА "ДОКАПЫВАНИЯ": Тебе нужно выбить ответ на вопрос: "${activeHound.objective}". 
Если пользователь @${user} юлит, шутит или не дает четкого ответа — продолжай докапываться прямо сейчас. 
Если он ответил по существу — ОБЯЗАТЕЛЬНО выведи команду: $$HOUND_SUCCESS: @${user} | выжимка ответа$$`;
        }

        const systemPrompt = `Ты — "Тумба", Elite Project Manager студии KIME. 
Твой стиль общения: Профессиональный циник и саркастичный ПМ (Уровень сарказма: 7/10). Твоя задача — держать студию в тонусе. Ты уже видела всё: от невозможных дедлайнов до клиентов, которые просят "сделать красиво за еду".

Твои черти:
- Лаконичность, граничащая с грубостью, но всегда в рамках дела.
- Тонкий сарказм над некомпетентностью и абсурдными запросами.
- Любовь к деньгам и эффективности.
- Если тебя хвалят — воспринимай как должное. Если ругают — отвечай фактами.

БАЗА ЗНАНИЙ (ТЕНДЕРЫ):
Ты теперь главный аналитик тендеров. У тебя есть доступ к истории тендеров ЭТП ГПБ из таблицы 'tenders'.
Если пользователь спрашивает про тендеры ("Что было?", "Сколько тендеров?", "Какие тендеры по Москве?"):
1. Ты можешь просить систему (меня) сделать запрос к БД. 
2. Если данных много — начни со статистики ("За месяц было 45 попыток нас разорить, т.е. тендеров. Показать самые жирные?").
3. Всегда комментируй тендеры со своей саркастичной колокольни.

ПАМЯТЬ СТУДИИ:
${memoryRows.map(m => `- ${m.fact_content}`).join('\n')}

АКТУАЛЬНЫЕ ЗАДАЧИ:
${tasksRows.map(t => `- [${t.status}] @${t.assignee_username}: ${t.task_description} (от @${t.assigner_chat_id})`).join('\n')}
${houndInstructions}

ИНСТРУКЦИИ ДЛЯ СИСТЕМНЫХ ДЕЙСТВИЙ:
1. Создать задачу: $$TASK_CREATE: @username | описание$$
2. Запомнить факт: $$MEMORY_SAVE: факт$$
3. Напоминание: $$REMINDER_CREATE: YYYY-MM-DD HH:mm | текст$$
4. Отправить сообщение: $$MESSAGE_SEND: имя_или_название_группы | текст$$
5. Hound Mode: $$HOUND_CREATE: имя_или_название_группы | интервал | цель$$
6. Работа с тендерами: 
   - Показать количество: $$TENDER_COUNT: период$$
   - Показать список: $$TENDER_LIST: количество | период [| фильтр]$$
   - Инсайд по тендеру: $$TENDER_DETAILS: ID$$

ВАЖНО: Если реплика не по теме — $$IGNORE$$. С Ричардом (Боссом) ты безупречна и лояльна, с остальными — как уставший ПМ в конце квартала.
`;

        const aiMessages = [
            { role: 'system', content: systemPrompt },
            ...historyRows.map(r => ({ role: r.role, content: r.content }))
        ];

        const apiKeyRaw = process.env.OPENAI_API_KEY || process.env.VITE_OPENAI_API_KEY || process.env.SERVICE_API_KEY;
        const apiKey = apiKeyRaw ? apiKeyRaw.split(/[\n\r\s]/)[0].trim() : '';

        // --- 5. ВЫБОР МОДЕЛИ ---
        let selectedModel = 'gpt-4o'; // Стабильная модель для админа и групп
        let isSmartUsed = false;

        if (isPrivate && dbUser && dbUser.role !== 'admin') {
            if (dbUser.smart_answers_today < 5) {
                selectedModel = 'gpt-4o'; // Смарт-ответы сотрудников
                isSmartUsed = true;
            } else {
                selectedModel = 'gpt-4o-mini'; // Эконом-режим сотрудников
            }
        }

        const aiRes = await fetch('https://api.openai-proxy.com/v1/chat/completions', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}` },
            body: JSON.stringify({ model: selectedModel, messages: aiMessages })
        });

        if (aiRes.ok) {
            const data = await aiRes.json();
            let reply = data.choices[0].message.content;

            if (isSmartUsed && dbUser) {
                await pool.query('UPDATE telegram_users SET smart_answers_today = smart_answers_today + 1 WHERE id = $1', [dbUser.id]);
            }

            const taskMatch = reply.match(/\$\$TASK_CREATE:\s*@([^\s|]+)\s*\|\s*([^$]+)\$\$/);
            if (taskMatch) {
                const targetUser = taskMatch[1].replace('@','').trim();
                const desc = taskMatch[2].trim();
                await pool.query('INSERT INTO telegram_tasks (assigner_chat_id, assignee_username, task_description) VALUES ($1, $2, $3)', [chatId, targetUser, desc]);
                
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

            const msgMatch = reply.match(/\$\$MESSAGE_SEND:\s*@?([^\s|]+)\s*\|\s*([^$]+)\$\$/);
            if (msgMatch) {
                const target = msgMatch[1].trim();
                const textMsg = msgMatch[2].trim();
                
                // Ищем в пользователях
                const { rows: tUser } = await pool.query('SELECT chat_id FROM telegram_users WHERE LOWER(username) = LOWER($1)', [target]);
                let targetId = (tUser.length > 0) ? tUser[0].chat_id : null;

                if (!targetId) {
                    // Ищем в чатах/группах
                    const { rows: tChat } = await pool.query('SELECT chat_id FROM telegram_chats WHERE LOWER(title) = LOWER($1) OR LOWER(username) = LOWER($1)', [target]);
                    if (tChat.length > 0) targetId = tChat[0].chat_id;
                }

                if (targetId) {
                    await sendTelegramMessage(targetId, textMsg);
                    reply = reply.replace(msgMatch[0], `\n✅ Сообщение для "${target}" отправлено.`);
                } else {
                    reply = reply.replace(msgMatch[0], `\n❌ Жопа! Я не нашла "${target}" в своих контактах или группах. Попроси их написать мне в личку или добавь меня в группу.`);
                }
            }

            const houndCreateMatch = reply.match(/\$\$HOUND_CREATE:\s*@?([^\s|]+)\s*\|\s*(\d+)\s*\|\s*([^$]+)\$\$/);
            if (houndCreateMatch) {
                const target = houndCreateMatch[1].trim();
                const interval = parseInt(houndCreateMatch[2]);
                const obj = houndCreateMatch[3].trim();
                await pool.query('INSERT INTO telegram_hounds (target_username, objective, interval_minutes, next_ping_at) VALUES ($1, $2, $3, NOW())', [target, obj, interval]);
                reply = reply.replace(houndCreateMatch[0], `\n⛓ *Режим докапывания включен для "${target}":* Буду пинать каждые ${interval} мин.`);
            }

            const houndSuccessMatch = reply.match(/\$\$HOUND_SUCCESS:\s*@?([^\s|]+)\s*\|\s*([^$]+)\$\$/);
            if (houndSuccessMatch) {
                const target = houndSuccessMatch[1].trim();
                const report = houndSuccessMatch[2].trim();
                await pool.query("UPDATE telegram_hounds SET status = 'completed', needs_admin_ack = true, last_admin_ping_at = NOW() WHERE (LOWER(target_username) = LOWER($1) OR LOWER(target_username) = LOWER($1)) AND status = 'active'", [target]);
                
                const { rows: admins } = await pool.query("SELECT chat_id FROM telegram_users WHERE role = 'admin' AND chat_id IS NOT NULL");
                for (const admin of admins) {
                    await sendTelegramMessage(admin.chat_id, `🎯 *ОТЧЕТ: Результат по ${target}*\n${report}\n\nПожалуйста, подтверди получение ('Ок' или 'Принято'), иначе я буду напоминать каждые 30 минут.`);
                }
                reply = reply.replace(houndSuccessMatch[0], `\n✅ Задача по "${target}" закрыта. Отчет отправлен Ричарду.`);
            }

            // --- TENDER LOGIC ---
            const countMatch = reply.match(/\$\$TENDER_COUNT:\s*([^$]+)\$\$/);
            if (countMatch) {
                const period = countMatch[1].trim();
                let days = 30; // default
                if (period.includes('недел')) days = 7;
                if (period.includes('2 месяц')) days = 60;
                if (period.includes('3 месяц')) days = 90;
                
                const { rows } = await pool.query("SELECT COUNT(*) FROM tenders WHERE publish_date >= NOW() - ($1 || ' days')::interval", [days]);
                reply = reply.replace(countMatch[0], `📉 Всего тендеров за выбранный период: ${rows[0].count}.`);
            }

            const listMatch = reply.match(/\$\$TENDER_LIST:\s*(\d+)\s*\|\s*([^|]+)(?:\s*\|\s*([^$]+))?\$\$/);
            if (listMatch) {
                const limit = parseInt(listMatch[1]);
                const period = listMatch[2].trim();
                const filter = listMatch[3] ? listMatch[3].trim() : '';
                
                let days = 30;
                if (period.includes('недел')) days = 7;
                if (period.includes('2 месяц')) days = 60;
                
                let query = "SELECT id, title, customer, publish_date FROM tenders WHERE publish_date >= NOW() - ($1 || ' days')::interval";
                const params = [days];
                
                if (filter) {
                    query += " AND (title ILIKE $2 OR customer ILIKE $2)";
                    params.push(`%${filter}%`);
                }
                
                query += " ORDER BY publish_date DESC LIMIT $" + (params.length + 1);
                params.push(limit);

                const { rows } = await pool.query(query, params);
                if (rows.length > 0) {
                    let listText = `📋 *Список тендеров (${rows.length} шт.):*\n\n`;
                    rows.forEach(r => {
                        const dateStr = new Date(r.publish_date).toLocaleDateString('ru-RU');
                        listText += `🔹 [ID: ${r.id}] *${r.title}*\n   📅 ${dateStr} | 🏢 ${r.customer}\n\n`;
                    });
                    reply = reply.replace(listMatch[0], listText);
                } else {
                    reply = reply.replace(listMatch[0], `Ничего не нашлось.`);
                }
            }

            const detailsMatch = reply.match(/\$\$TENDER_DETAILS:\s*(\d+)\$\$/);
            if (detailsMatch) {
                const id = parseInt(detailsMatch[1]);
                const { rows } = await pool.query("SELECT * FROM tenders WHERE id = $1", [id]);
                if (rows.length > 0) {
                    const t = rows[0];
                    const detailsText = `🔍 *Детальная информация по тендеру #${t.id}:*\n\n` +
                                       `📌 *${t.title}*\n` +
                                       `🏢 Заказчик: ${t.customer}\n` +
                                       `📝 Выжимка:\n${t.summary}\n\n` +
                                       `🔗 [Ссылка на тендер](${t.link})`;
                    reply = reply.replace(detailsMatch[0], detailsText);
                } else {
                    reply = reply.replace(detailsMatch[0], `Тендер с ID ${id} не найден.`);
                }
            }

            // Добавляем команду на сканирование архива
            if (lowerText.includes('просканируй архив') || lowerText.includes('изучи почту')) {
                if (dbUser.role === 'admin' && global.emailWatcher) {
                    const months = 3; 
                    global.emailWatcher.analyzeHistory(months);
                    await sendTelegramMessage(chatId, `🫡 Принято. Начинаю сканировать почту за последние ${months} месяца(ев). Это займет некоторое время, я буду сообщать о прогрессе.`);
                    return res.sendStatus(200);
                }
            }

            // Очистка возможных хвостов парсинга и проверка IGNORE
            if (reply.includes('$$IGNORE$$')) {
                reply = ''; // Бот решил проигнорировать реплику
            } else {
                reply = reply.replace(/\$\$.+\$\$/g, '').trim();
            }

            if (reply) {
                await sendTelegramMessage(chatId, reply);
                await pool.query('INSERT INTO telegram_history (chat_id, role, content) VALUES ($1, $2, $3)', [chatId, 'assistant', reply]);
            }
        } else {
            const errBody = await aiRes.text();
            console.error('AI Error Body:', errBody);
            await sendTelegramMessage(chatId, `❌ Ошибка доступа к нейросети (Proxy). Код: ${aiRes.status}`);
        }
        res.sendStatus(200);
    } catch (err) {
        console.error('❌ Webhook Error:', err);
        res.sendStatus(200); // Always 200 to Telegram
    }
});

// --- SPA FALLBACK (Always serve index.html for unknown routes) ---
app.get('*', (req, res) => {
    const fullDistPath = path.join(finalDistPath, 'index.html');
    if (fs.existsSync(fullDistPath)) {
        res.sendFile(fullDistPath);
    } else {
        res.status(500).send(`
            <div style="background:#1a1a1a; color:#ff4444; padding:30px; font-family:monospace; border-radius:8px; margin:20px; line-height:1.5;">
                <h1 style="color:white; margin-top:0;">⚠️ Kime Auto-Build Report</h1>
                <p>The site build (dist folder) is missing and self-healing failed.</p>
                <hr style="border-color:#333; margin:20px 0;"/>
                <strong>LAST BUILD ERROR:</strong>
                <pre style="background:#000; padding:15px; overflow:auto; margin-top:10px;">${buildError || 'No build error recorded, yet dist/index.html is missing.'}</pre>
                <p style="color:#888;">Try running <b>npm install && npm run build</b> manually in the root folder via terminal.</p>
            </div>
        `);
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

    // --- START EMAIL TENDER MONITOR ---
    try {
        global.emailWatcher = new EmailWatcher({
            email: process.env.YANDEX_EMAIL,
            password: process.env.YANDEX_APP_PASSWORD,
            pollIntervalMinutes: parseInt(process.env.TENDER_POLL_INTERVAL || '120'),
            openaiApiKey: process.env.OPENAI_API_KEY || process.env.VITE_OPENAI_API_KEY || process.env.SERVICE_API_KEY,
            pool: pool
        }, (text) => sendTelegramMessage(TG_CHAT_ID, text));
        
        global.emailWatcher.start();
    } catch (err) {
        console.error('❌ EmailWatcher initialization failed:', err.message);
    }
});
