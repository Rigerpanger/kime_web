import { ImapFlow } from 'imapflow';
import { simpleParser } from 'mailparser';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '../../.env') });

const config = {
    host: process.env.IMAP_HOST,
    port: parseInt(process.env.IMAP_PORT),
    secure: true,
    auth: {
        user: process.env.IMAP_USER,
        pass: process.env.IMAP_PASS
    },
    logger: false 
};

async function diagnose() {
    const client = new ImapFlow(config);
    console.log('🚀 Connecting to IMAP...');
    
    try {
        await client.connect();
        console.log('✅ Connected!');

        const lock = await client.getMailboxLock('INBOX');
        try {
            console.log('📂 Scanning INBOX (showing last 50 messages)...');
            
            // Search for last 50 messages
            const messages = await client.search({ all: true });
            const last50 = messages.slice(-50); // Get latest ones

            console.log(`Found ${messages.length} total messages. Analyzing latest ${last50.length}...`);
            console.log('--------------------------------------------------');
            console.log('| Date       | Sender               | Subject');
            console.log('--------------------------------------------------');

            for (const msgId of last50) {
                const message = await client.fetchOne(msgId, { source: true, envelope: true });
                const parsed = await simpleParser(message.source);
                
                const date = parsed.date ? parsed.date.toISOString().split('T')[0] : '????-??-??';
                const from = parsed.from ? parsed.from.text.substring(0, 20).padEnd(20) : 'Unknown'.padEnd(20);
                const subject = (parsed.subject || 'No Subject').substring(0, 50);

                console.log(`| ${date} | ${from} | ${subject}`);
            }
            console.log('--------------------------------------------------');
            console.log('✅ Diagnosis complete. Please provide this output to Antigravity.');

        } finally {
            lock.release();
        }

        await client.logout();
    } catch (err) {
        console.error('❌ IMAP Error:', err.message);
    }
}

diagnose();
