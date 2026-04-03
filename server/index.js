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

dotenv.config();

console.log('-------------------------------------------');
console.log('🚀 SERVER STARTUP CHECK:');
console.log('DB_USER:', process.env.DB_USER || '❌ MISSING');
console.log('DB_NAME:', process.env.DB_NAME || '❌ MISSING');
console.log('DB_PASSWORD:', process.env.DB_PASSWORD ? '✅ PRESENT (MASKED)' : '❌ MISSING (FATAL)');
console.log('JWT_SECRET:', process.env.JWT_SECRET ? '✅ OK' : '❌ MISSING');
console.log('PORT:', process.env.PORT || '3001 (Default)');
console.log('-------------------------------------------');

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

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
        // --- One-time Cleanup: Replace ALL old paths (relative, localhost or local /uploads) with new Proxy paths ---
        await pool.query("UPDATE projects SET cover = REPLACE(cover, '/api/uploads/', '/api/m/') WHERE cover LIKE '%/api/uploads/%'");
        await pool.query("UPDATE partners SET logo_url = REPLACE(logo_url, '/api/uploads/', '/api/m/') WHERE logo_url LIKE '%/api/uploads/%'");
        await pool.query("UPDATE certificates SET image_url = REPLACE(image_url, '/api/uploads/', '/api/m/') WHERE image_url LIKE '%/api/uploads/%'");
        
        // Also fix the dot vs underscore in existing filenames in DB
        // (This is a simplified fix, we'll try to guess and replace known extensions)
        await pool.query("UPDATE projects SET cover = REPLACE(cover, '.jpg', '_jpg') WHERE cover LIKE '%.jpg'");
        await pool.query("UPDATE projects SET cover = REPLACE(cover, '.png', '_png') WHERE cover LIKE '%.png'");
        await pool.query("UPDATE partners SET logo_url = REPLACE(logo_url, '.jpg', '_jpg') WHERE logo_url LIKE '%.jpg'");
        await pool.query("UPDATE partners SET logo_url = REPLACE(logo_url, '.png', '_png') WHERE logo_url LIKE '%.png'");
        await pool.query("UPDATE certificates SET image_url = REPLACE(image_url, '.jpg', '_jpg') WHERE image_url LIKE '%.jpg'");
        await pool.query("UPDATE certificates SET image_url = REPLACE(image_url, '.png', '_png') WHERE image_url LIKE '%.png'");

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

// --- SMART MEDIA PROXY (Bypass Nginx static intercept) ---
app.get('/api/m/:id', (req, res) => {
    try {
        let filename = req.params.id;
        // Support legacy underscore bypass ONLY if there's no dot in the filename
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

// --- DEBUG UPLOADS ---
app.get('/api/debug-uploads', (req, res) => {
    try {
        const files = fs.readdirSync(uploadsDir);
        res.json({ 
            exists: fs.existsSync(uploadsDir), 
            path: uploadsDir, 
            files,
            total: files.length 
        });
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
    
    // Only replace dots with underscores for standard web static files to bypass Nginx.
    // We MUST preserve dots for .hdr and .exr because Three.js parsers rely on the exact extension.
    if (!['.hdr', '.hdri', '.exr'].includes(ext)) {
        proxyFilename = proxyFilename.replace('.', '_');
    }
    
    res.json({ url: `/api/m/${proxyFilename}` });
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

// --- CERTIFICATES CRUD ---
app.get('/api/certificates', async (req, res) => {
    try {
        const { rows } = await pool.query('SELECT * FROM certificates ORDER BY order_index ASC');
        res.json(rows);
    } catch (err) { res.status(500).json({ error: err.message }); }
});
app.post('/api/certificates', authenticateToken, async (req, res) => {
    const c = req.body;
    const { rows } = await pool.query(
        'INSERT INTO certificates (company, division, position, image_url, order_index) VALUES ($1, $2, $3, $4, $5) RETURNING *',
        [c.company, c.division, c.position, c.image_url, c.order_index]
    );
    res.json(rows[0]);
});
app.put('/api/certificates/:id', authenticateToken, async (req, res) => {
    const c = req.body;
    const { rows } = await pool.query(
        'UPDATE certificates SET company=$1, division=$2, position=$3, image_url=$4, order_index=$5 WHERE id=$6 RETURNING *',
        [c.company, c.division, c.position, c.image_url, c.order_index, req.params.id]
    );
    res.json(rows[0]);
});
app.delete('/api/certificates/:id', authenticateToken, async (req, res) => {
    await pool.query('DELETE FROM certificates WHERE id = $1', [req.params.id]);
    res.json({ success: true });
});

// --- PARTNERS CRUD ---
app.get('/api/partners', async (req, res) => {
    try {
        const { rows } = await pool.query('SELECT * FROM partners ORDER BY order_index ASC');
        res.json(rows);
    } catch (err) { res.status(500).json({ error: err.message }); }
});
app.post('/api/partners', authenticateToken, async (req, res) => {
    const p = req.body;
    const { rows } = await pool.query(
        'INSERT INTO partners (name, logo_url, width, order_index) VALUES ($1, $2, $3, $4) RETURNING *',
        [p.name, p.logo_url, p.width, p.order_index]
    );
    res.json(rows[0]);
});
app.delete('/api/partners/:id', authenticateToken, async (req, res) => {
    await pool.query('DELETE FROM partners WHERE id = $1', [req.params.id]);
    res.json({ success: true });
});

// --- AUTH ---
app.get('/api/auth/users', async (req, res) => {
    try {
        const { rows } = await pool.query('SELECT id, email FROM users');
        res.json(rows);
    } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/api/auth/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        const { rows } = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
        if (rows.length === 0) return res.status(401).json({ error: 'User not found' });
        const isMatch = await bcrypt.compare(password, rows[0].password_hash);
        if (!isMatch) return res.status(401).json({ error: 'Wrong password' });
        const token = jwt.sign({ id: rows[0].id, email: rows[0].email }, JWT_SECRET, { expiresIn: '72h' });
        res.json({ token, user: { id: rows[0].id, email: rows[0].email } });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/api/auth/setup-admin', async (req, res) => {
    try {
        const { email, password, secret } = req.body;
        if (secret !== 'KIME_SETUP_SECRET') return res.status(403).json({ error: 'Denied' });
        const hash = await bcrypt.hash(password, 10);
        await pool.query('INSERT INTO users (email, password_hash) VALUES ($1, $2)', [email, hash]);
        res.json({ success: true });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

// --- AI Chat ---
app.post('/api/chat', async (req, res) => {
    try {
        const apiKey = process.env.VITE_OPENAI_API_KEY || process.env.OPENAI_API_KEY;
        const response = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}` },
            body: JSON.stringify({ model: 'gpt-4o-mini', messages: [{ role: 'system', content: 'Ты - Нейро-Ассистент топовой IT-студии КИМЭ. Твоя цель - консультировать клиентов, отвечать на вопросы, помогать составлять ТЗ (задавая по одному наводящему вопросу) и оценивать примерную стоимость проектов.' }, ...req.body.messages] })
        });
        res.json(await response.json());
    } catch (error) { res.status(500).json({ error: 'AI failed' }); }
});

app.listen(PORT, () => console.log(`Kime API Server started on port ${PORT}`));
