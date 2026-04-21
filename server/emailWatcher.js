import { ImapFlow } from 'imapflow';
import { simpleParser } from 'mailparser';
import { convert } from 'html-to-text';
import fetch from 'node-fetch';

class EmailWatcher {
    constructor(config, telegramHelper) {
        this.config = config;
        this.telegramHelper = telegramHelper;
        this.client = null;
        this.pollInterval = (config.pollIntervalMinutes || 120) * 60 * 1000;
        this.isRunning = false;
        this.apiKey = config.openaiApiKey;
        this.pool = config.pool; // Database connection
    }

    async start() {
        if (this.isRunning) return;
        this.isRunning = true;
        console.log('📬 EmailWatcher: Starting tender monitor (ETP GPB)...');
        
        // Initial check
        this.checkMail();
        
        // Schedule periodic checks
        setInterval(() => this.checkMail(), this.pollInterval);
    }

    async createClient() {
        return new ImapFlow({
            host: 'imap.yandex.ru',
            port: 993,
            secure: true,
            auth: {
                user: this.config.email,
                pass: this.config.password
            },
            authMethod: 'LOGIN',
            logger: false
        });
    }

    async checkMail() {
        console.log('🔄 EmailWatcher: Checking for new tenders...');
        this.client = await this.createClient();

        try {
            await this.client.connect();
            let lock = await this.client.getMailboxLock('INBOX');
            try {
                const messages = await this.client.search({ unseen: true });
                
                for (const seq of messages) {
                    let message = await this.client.fetchOne(seq, { source: true, envelope: true });
                    let parsed = await simpleParser(message.source);
                    
                    const from = parsed.from?.text || '';
                    const subject = parsed.subject || '';
                    
                    if (from.includes('ЭТП ГПБ') || from.includes('etp-gpb.ru')) {
                        console.log(`✨ New tender email found: "${subject}"`);
                        await this.processEmail(parsed, true); // true = notify telegram
                        await this.client.messageFlagsAdd(seq, ['\\Seen']);
                    }
                }
            } finally {
                lock.release();
            }
            await this.client.logout();
        } catch (err) {
            console.error('❌ EmailWatcher Error:', err.message);
            if (this.client) {
                try { await this.client.logout(); } catch (e) {}
            }
        }
    }

    async analyzeHistory(months = 2) {
        console.log(`📚 EmailWatcher: Starting archive scan for the last ${months} months...`);
        const client = await this.createClient();
        try {
            await client.connect();
            let lock = await client.getMailboxLock('INBOX');
            try {
                const sinceDate = new Date();
                sinceDate.setMonth(sinceDate.getMonth() - months);
                
                const messages = await client.search({ since: sinceDate });
                console.log(`📂 Found ${messages.length} messages in search range.`);
                
                let count = 0;
                for (const seq of messages) {
                    let message = await client.fetchOne(seq, { source: true });
                    let parsed = await simpleParser(message.source);
                    
                    const from = parsed.from?.text || '';
                    if (from.includes('ЭТП ГПБ') || from.includes('etp-gpb.ru')) {
                        await this.processEmail(parsed, false); // false = don't notify telegram during bulk Import
                        count++;
                    }
                }
                console.log(`✅ Archive scan complete. Imported/Updated ${count} tenders.`);
                this.telegramHelper(`📚 *Архив изучен.* Я загрузила в базу ${count} тендеров за последние ${months} месяца(ев). Теперь я знаю о них всё.`);
            } finally {
                lock.release();
            }
            await client.logout();
        } catch (err) {
            console.error('❌ Archive Scan Error:', err.message);
        }
    }

    async processEmail(parsed, notify = true) {
        const html = parsed.html || parsed.textAsHtml || '';
        const text = convert(html, {
            wordwrap: 130,
            selectors: [
                { selector: 'a', options: { hideLinkHrefIfSameAsText: true } }
            ]
        });

        // 1. Find links & ID
        const links = this.extractLinks(html);
        const mainLink = links[0] || 'Ссылка не найдена';
        const externalId = this.extractTenderId(parsed.subject, text);

        // 2. Generate AI Summary (Sarcastic personality)
        const summary = await this.generateSummary(text);

        // 3. Save to DB
        try {
            await this.pool.query(`
                INSERT INTO tenders (external_id, title, customer, publish_date, summary, link, raw_text)
                VALUES ($1, $2, $3, $4, $5, $6, $7)
                ON CONFLICT (external_id) DO UPDATE SET
                    summary = $5,
                    link = $6,
                    raw_text = $7
            `, [
                externalId || `mail_${parsed.date.getTime()}`,
                parsed.subject,
                this.extractCustomer(text) || 'Unknown',
                parsed.date,
                summary,
                mainLink,
                text.substring(0, 5000)
            ]);
        } catch (dbErr) {
            console.error('❌ DB Save Error:', dbErr.message);
        }

        // 4. Send to Telegram if needed
        if (notify) {
            const message = `🔔 *Новый тендер: ЭТП ГПБ*\n\n` +
                            `📝 *Выжимка Тумбы:*\n${summary}\n\n` +
                            `🔗 [Перейти к тендеру](${mainLink})\n\n` +
                            `📂 *Оригинал темы:* ${parsed.subject}`;
            await this.telegramHelper(message);
        }
    }

    extractLinks(html) {
        const linkRegex = /href="([^"]+)"/g;
        const links = [];
        let match;
        while ((match = linkRegex.exec(html)) !== null) {
            if (match[1].startsWith('http') && !match[1].includes('yandex') && !match[1].includes('static')) {
                links.push(match[1]);
            }
        }
        return links;
    }

    extractTenderId(subject, text) {
        const idMatch = subject.match(/№\s*(\d+)/) || text.match(/№\s*(\d+)/);
        return idMatch ? idMatch[1] : null;
    }

    extractCustomer(text) {
        const custMatch = text.match(/Заказчик:\s*([^\n\r]+)/i);
        return custMatch ? custMatch[1].trim() : null;
    }

    async generateSummary(text) {
        try {
            const aiRes = await fetch('https://api.openai-proxy.com/v1/chat/completions', {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json', 
                    'Authorization': `Bearer ${this.apiKey}` 
                },
                body: JSON.stringify({ 
                    model: 'gpt-4o', 
                    messages: [
                        { 
                            role: 'system', 
                            content: `Ты — Тумба, Elite PM студии KIME. Сарказм: 3/10.
Проанализируй тендер и выдай отчет строго в три блока:
[Intro]: О чем проект своими словами (1-2 предложения).
[Original]: Главная суть из текста (цитата или сухой факт).
[Opinion]: Твое краткое профессиональное мнение (мягкий сарказм).

Будь точна и не лей воду.` 
                        },
                        { role: 'user', content: text.substring(0, 6000) }
                    ] 
                })
            });

            if (aiRes.ok) {
                const data = await aiRes.json();
                return data.choices[0].message.content.trim();
            }
            return 'Не удалось сгенерировать выжимку (ошибка API).';
        } catch (e) {
            return `Ошибка при анализе: ${e.message}`;
        }
    }
}

export default EmailWatcher;
