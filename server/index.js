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

// Загружаем конфиг из корня проекта
dotenv.config({ path: path.join(__dirname, '../.env') });

console.log('-------------------------------------------');
console.log('🚀 SERVER STARTUP CHECK:');
console.log('DB_USER:', process.env.DB_USER || '❌ MISSING');
console.log('DB_NAME:', process.env.DB_NAME || '❌ MISSING');
console.log('DB_PASSWORD:', process.env.DB_PASSWORD ? '✅ PRESENT (MASKED)' : '❌ MISSING (FATAL)');
console.log('JWT_SECRET:', process.env.JWT_SECRET ? '✅ OK' : '❌ MISSING');
console.log('PORT:', process.env.PORT || '3001 (Default)');
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
        // --- One-time Cleanup: Replace ALL old paths ---
        await pool.query("UPDATE projects SET cover = REPLACE(cover, '/api/uploads/', '/api/m/') WHERE cover LIKE '%/api/uploads/%'");
        await pool.query("UPDATE partners SET logo_url = REPLACE(logo_url, '/api/uploads/', '/api/m/') WHERE logo_url LIKE '%/api/uploads/%'");
        await pool.query("UPDATE certificates SET image_url = REPLACE(image_url, '/api/uploads/', '/api/m/') WHERE image_url LIKE '%/api/uploads/%'");
        
        console.log('✅ Database paths fixed to use Smart Proxy');
    } catch (err) {
        console.error('❌ Database initialization error:', err.message);
    }
};
initDB();

app.use(cors({ origin: '*' }));
app.use(express.json());

const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir);
app.use('/uploads', express.static(uploadsDir));
app.use('/api/uploads', express.static(uploadsDir));

// --- SMART MEDIA PROXY ---
app.get('/api/m/:id', (req, res) => {
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
app.post('/api/upload', authenticateToken, upload.single('image'), (req, res) => {
    if (!req.file) return res.status(400).json({ error: 'No file' });
    let proxyFilename = req.file.filename;
    const ext = path.extname(req.file.originalname).toLowerCase();
    if (!['.hdr', '.hdri', '.exr'].includes(ext)) {
        proxyFilename = proxyFilename.replace('.', '_');
    }
    res.json({ url: `/m/${proxyFilename}` });
});

// --- PROJECTS CRUD ---
app.get('/api/projects', async (req, res) => {
    try {
        const { rows } = await pool.query('SELECT * FROM projects ORDER BY sort_order ASC');
        res.json(rows);
    } catch (err) { res.status(500).json({ error: err.message }); }
});
app.post('/api/projects', authenticateToken, async (req, res) => {
    const p = req.body;
    const { rows } = await pool.query(
        'INSERT INTO projects (title, slug, challenge, solution, result, short_description, client, cover, video_url, tags, tech, sort_order) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12) RETURNING *',
        [p.title, p.slug, p.challenge, p.solution, p.result, p.short_description, p.client, p.cover, p.video_url, p.tags, p.tech, p.sort_order]
    );
    res.json(rows[0]);
});
app.put('/api/projects/:id', authenticateToken, async (req, res) => {
    const p = req.body;
    const { rows } = await pool.query(
        'UPDATE projects SET title=$1, slug=$2, challenge=$3, solution=$4, result=$5, short_description=$6, client=$7, cover=$8, video_url=$9, tags=$10, tech=$11, sort_order=$12 WHERE id=$13 RETURNING *',
        [p.title, p.slug, p.challenge, p.solution, p.result, p.short_description, p.client, p.cover, p.video_url, p.tags, p.tech, p.sort_order, req.params.id]
    );
    res.json(rows[0]);
});
app.delete('/api/projects/:id', authenticateToken, async (req, res) => {
    await pool.query('DELETE FROM projects WHERE id = $1', [req.params.id]);
    res.json({ success: true });
});

// --- PARTNERS CRUD ---
app.get('/api/partners', async (req, res) => {
    try {
        const { rows } = await pool.query('SELECT * FROM partners ORDER BY order_index ASC');
        res.json(rows);
    } catch (err) { res.status(500).json({ error: err.message }); }
});

// --- CERTIFICATES CRUD ---
app.get('/api/certificates', async (req, res) => {
    try {
        const { rows } = await pool.query('SELECT * FROM certificates ORDER BY order_index ASC');
        res.json(rows);
    } catch (err) { res.status(500).json({ error: err.message }); }
});

// --- SITE CONTENT ---
app.get('/api/content/:key', async (req, res) => {
    try {
        const { rows } = await pool.query('SELECT content_json FROM site_content WHERE section_key = $1', [req.params.key]);
        if (rows.length === 0) return res.status(404).json({ error: 'Not found' });
        res.json(rows[0].content_json);
    } catch (err) { res.status(500).json({ error: err.message }); }
});
app.post('/api/content/:key', authenticateToken, async (req, res) => {
    const { rows } = await pool.query(
        'INSERT INTO site_content (section_key, content_json) VALUES ($1, $2) ON CONFLICT (section_key) DO UPDATE SET content_json = $2, updated_at = NOW() RETURNING *',
        [req.params.key, req.body]
    );
    res.json(rows[0]);
});

// --- DEBUG STATUS (FOR ADMIN ONLY) ---
app.get('/api/debug-status', async (req, res) => {
    try {
        const dbTest = await pool.query('SELECT NOW()');
        const apiKey = process.env.VITE_OPENAI_API_KEY || process.env.OPENAI_API_KEY || process.env.SERVICE_API_KEY;
        res.json({
            status: 'online',
            db: 'connected',
            time: dbTest.rows[0].now,
            ai_key_present: !!apiKey,
            ai_key_preview: apiKey ? `${apiKey.substring(0, 5)}...` : 'NONE',
            env_keys: Object.keys(process.env).filter(k => k.includes('KEY') || k.includes('API') || k.includes('PORT'))
        });
    } catch (err) { res.status(500).json({ status: 'error', error: err.message }); }
});

// --- AI Chat ---
app.post('/api/chat', async (req, res) => {
    try {
        const apiKey = process.env.VITE_OPENAI_API_KEY || process.env.OPENAI_API_KEY || process.env.SERVICE_API_KEY;
        
        if (!apiKey) {
            console.error('❌ AI ERROR: API Key missing in environment.');
            return res.status(500).json({ 
                error: 'SERVER_CONFIG_ERROR', 
                details: 'OpenAI API Key is not set in Environment. Add OPENAI_API_KEY to your control panel.' 
            });
        }

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 20000);

        const response = await fetch('https://api.openai-proxy.org/v1/chat/completions', {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json', 
                'Authorization': `Bearer ${apiKey}` 
            },
            body: JSON.stringify({ 
                model: 'gpt-4o-mini', 
                messages: [
                    { role: 'system', content: 'Ты - Нейро-Ассистент топовой IT-студии КИМЭ. Твоя цель - консультировать клиентов, помогать составлять ТЗ и оценивать стоимость.' }, 
                    ...req.body.messages
                ] 
            }),
            signal: controller.signal
        });
        
        clearTimeout(timeoutId);

        if (!response.ok) {
            const errorText = await response.text();
            console.error(`❌ Proxy error (${response.status}):`, errorText);
            return res.status(response.status).json({ 
                error: 'UPSTREAM_API_ERROR', 
                status: response.status,
                details: errorText 
            });
        }
        
        res.json(await response.json());
    } catch (error) { 
        console.error('❌ AI Handler Exception:', error.message);
        res.status(500).json({ 
            error: 'AI_HANDLER_EXCEPTION', 
            details: error.name === 'AbortError' ? 'AI request timed out' : error.message 
        }); 
    }
});

app.listen(PORT, () => console.log(`Kime API Server started on port ${PORT}`));
