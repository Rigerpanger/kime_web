import { ImapFlow } from 'imapflow';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '../.env') });

const client = new ImapFlow({
    host: 'imap.yandex.ru',
    port: 993,
    secure: true,
    auth: {
        user: process.env.YANDEX_EMAIL,
        pass: process.env.YANDEX_APP_PASSWORD
    },
    logger: true // Enable logging for testing
});

async function testConnection() {
    console.log(`Connecting to Yandex IMAP for ${process.env.YANDEX_EMAIL}...`);
    try {
        await client.connect();
        console.log('✅ Connection successful!');
        
        const mailboxes = await client.list();
        console.log('Available mailboxes:', mailboxes.map(m => m.path));
        
        await client.logout();
    } catch (err) {
        console.error('❌ Connection failed:', err.message);
    }
}

testConnection();
