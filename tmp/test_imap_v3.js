import { ImapFlow } from 'imapflow';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const envPath = path.join(__dirname, '../.env');
const envContent = fs.readFileSync(envPath, 'utf8');
const env = {};
envContent.split('\n').forEach(line => {
    const parts = line.split('=');
    if (parts.length >= 2) {
        env[parts[0].trim()] = parts.slice(1).join('=').trim().replace(/^"(.*)"$/, '$1');
    }
});

async function testConnection(user, pass, host) {
    console.log(`\n🔍 Testing IMAP: User=${user}, Host=${host}...`);
    const client = new ImapFlow({
        host: host,
        port: 993,
        secure: true,
        auth: { user, pass },
        logger: true, // Full verbose output
        connectionTimeout: 15000,
        greetingTimeout: 15000
    });

    try {
        await client.connect();
        console.log(`✅ SUCCESS for ${user} on ${host}!`);
        await client.logout();
        return true;
    } catch (err) {
        console.error(`❌ FAILED for ${user} on ${host}:`, err.message);
        return false;
    }
}

async function runTests() {
    const pass = env.YANDEX_APP_PASSWORD;
    const email = env.YANDEX_EMAIL;
    
    // Try primary with .ru and .com
    if (await testConnection(email, pass, 'imap.yandex.ru')) return;
    if (await testConnection(email, pass, 'imap.yandex.com')) return;
    
    // Try the other account from screenshot
    if (await testConnection('kimeproduction@yandex.ru', pass, 'imap.yandex.ru')) return;
}

runTests();
