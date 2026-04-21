import { ImapFlow } from 'imapflow';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Manual env parsing since dotenv is being tricky with paths
const envPath = path.join(__dirname, '../.env');
const envContent = fs.readFileSync(envPath, 'utf8');
const env = {};
envContent.split('\n').forEach(line => {
    const parts = line.split('=');
    if (parts.length === 2) {
        env[parts[0].trim()] = parts[1].trim().replace(/^"(.*)"$/, '$1');
    }
});

async function testConnection(user, pass) {
    console.log(`\n🔍 Testing IMAP for: ${user}...`);
    const client = new ImapFlow({
        host: 'imap.yandex.ru',
        port: 993,
        secure: true,
        auth: { user, pass },
        logger: false,
        connectionTimeout: 10000
    });

    try {
        await client.connect();
        console.log(`✅ SUCCESS for ${user}!`);
        await client.logout();
        return true;
    } catch (err) {
        console.error(`❌ FAILED for ${user}:`, err.message);
        return false;
    }
}

async function runTests() {
    const pass = env.YANDEX_APP_PASSWORD;
    
    // Try primary
    const res1 = await testConnection(env.YANDEX_EMAIL, pass);
    
    // If failed, try the second account from screenshot
    if (!res1) {
        await testConnection('kimeproduction@yandex.ru', pass);
    }
}

runTests();
