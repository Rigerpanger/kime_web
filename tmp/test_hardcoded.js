import { ImapFlow } from 'imapflow';

async function testConnection(user, pass) {
    console.log(`\n🚀 TESTING NEW KEY: User=${user}...`);
    const client = new ImapFlow({
        host: 'imap.yandex.ru',
        port: 993,
        secure: true,
        auth: { user, pass },
        authMethod: 'LOGIN',
        logger: true,
        connectionTimeout: 15000
    });

    try {
        await client.connect();
        console.log(`✅ SUCCESS! Connection established for ${user}`);
        
        const mailboxes = await client.list();
        console.log('Available folders:', mailboxes.map(m => m.path));
        
        await client.logout();
        return true;
    } catch (err) {
        console.error(`❌ FAILED:`, err.message);
        return false;
    }
}

// Прямо вставляем значения
testConnection('rp@kimeproduction.ru', 'dartodriqdvjxfpk');
