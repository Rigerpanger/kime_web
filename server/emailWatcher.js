import { ImapFlow } from 'imapflow';
import { simpleParser } from 'mailparser';
import { convert } from 'html-to-text';
import fetch from 'node-fetch';
import * as cheerio from 'cheerio';

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

    async analyzeHistory(months = 3) {
        console.log(`📚 EmailWatcher: Starting archive scan for the last ${months} months...`);
        const client = await this.createClient();
        try {
            await client.connect();
            let lock = await client.getMailboxLock('INBOX');
            try {
                const sinceDate = new Date();
                sinceDate.setMonth(sinceDate.getMonth() - months);
                
                const messages = await client.search({ 
                    since: sinceDate,
                    from: 'ЭТП ГПБ'
                });
                
                console.log(`📂 Found ${messages.length} messages in search range.`);
                
                let count = 0;
                for (const seq of messages) {
                    let message = await client.fetchOne(seq, { source: true });
                    let parsed = await simpleParser(message.source);
                    await this.processEmail(parsed, false);
                    count++;
                }
                console.log(`✅ Archive scan complete.`);
                this.telegramHelper(`📚 *Синхронизация завершена.* Облачный агрегатор KIME обновил базу. Теперь я вижу актуальную повестку.`);
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
        const $ = cheerio.load(html);
        
        const tendersFound = [];

        // Try to parse ETP GPB tables
        $('table tr').each((i, row) => {
            const cells = $(row).find('td');
            if (cells.length >= 4) {
                const idText = $(cells[0]).text().trim();
                const title = $(cells[2]).text().trim();
                const customer = $(cells[3]).text().trim();
                const link = $(cells[0]).find('a').attr('href') || $(row).find('a').attr('href');

                // Check if it's a real tender row (often starts with ГП or numbers)
                if (idText.match(/^[ГП\d]+$/) && title && customer && link) {
                    tendersFound.push({
                        externalId: idText,
                        title,
                        customer,
                        link,
                        raw: $(row).text().trim()
                    });
                }
            }
        });

        // Fallback to old method if no tables found but it's clearly a tender
        if (tendersFound.length === 0) {
            const text = convert(html, { wordwrap: 130 });
            const id = this.extractTenderId(parsed.subject, text);
            if (id) {
                tendersFound.push({
                    externalId: id,
                    title: parsed.subject,
                    customer: this.extractCustomer(text) || 'Не указан',
                    link: this.extractLinks(html)[0] || '',
                    raw: text.substring(0, 5000)
                });
            }
        }

        // Process each found tender
        for (const tender of tendersFound) {
            const summary = await this.generateSummary(tender.raw);
            
            try {
                await this.pool.query(`
                    INSERT INTO tenders (external_id, title, customer, publish_date, summary, link, raw_text)
                    VALUES ($1, $2, $3, $4, $5, $6, $7)
                    ON CONFLICT (external_id) DO UPDATE SET
                        summary = $5,
                        link = $6,
                        raw_text = $7
                `, [
                    tender.externalId,
                    tender.title,
                    tender.customer,
                    parsed.date,
                    summary,
                    tender.link,
                    tender.raw
                ]);

                if (notify) {
                    const message = `🔔 *Обнаружен новый тендер в агрегаторе*\n\n${summary}\n\n🔗 [Смотреть портал](${tender.link})`;
                    await this.telegramHelper(message);
                }
            } catch (dbErr) {
                console.error('❌ DB Save Error:', dbErr.message);
            }
        }
    }

    extractLinks(html) {
        const linkRegex = /href="([^"]+)"/g;
        const links = [];
        let match;
        while ((match = linkRegex.exec(html)) !== null) {
            if (match[1].startsWith('http') && !match[1].includes('yandex')) {
                links.push(match[1]);
            }
        }
        return links;
    }

    extractTenderId(subject, text) {
        const idMatch = subject.match(/([ГП\d]{6,})/i) || text.match(/([ГП\d]{6,})/i);
        return idMatch ? idMatch[1] : null;
    }

    extractCustomer(text) {
        const custMatch = text.match(/Заказчик:\s*([^\n\r]+)/i);
        return custMatch ? custMatch[1].trim() : null;
    }

    async analyzeHistory(months = 3) {
        if (!this.imap) {
            console.error('❌ IMAP not initialized for history scan.');
            return;
        }

        try {
            const client = this.imap;
            await client.lock();
            
            const sinceDate = new Date();
            sinceDate.setMonth(sinceDate.getMonth() - months);
            
            console.log(`📡 [EMAIL_SCAN] Ищу письма за последние ${months} мес. (начиная с ${sinceDate.toLocaleDateString()})...`);

            const messages = await client.search({ 
                since: sinceDate
            });

            console.log(`📡 [EMAIL_SCAN] Найдено ${messages.length} потенциальных писем.`);

            for (const msgId of messages) {
                const message = await client.fetchOne(msgId, { source: true, envelope: true });
                const parsed = await simpleParser(message.source);
                
                const fromAddress = parsed.from?.text || '';
                const subject = parsed.subject || '';

                // Фильтр по ключевым словам ГПБ или Тендер
                if (fromAddress.includes('ГПБ') || fromAddress.includes('gpb') || 
                    subject.includes('ГПБ') || subject.includes('закуп') || subject.includes('тендер')) {
                    
                    console.log(`🔎 [EMAIL_SCAN] Обрабатываю письмо: "${subject}" от "${fromAddress}"`);
                    await this.processEmail(parsed, false); // false = без уведомлений в ТГ при сканировании истории
                }
            }
            
            await client.unlock();
            console.log(`✅ [EMAIL_SCAN] Синхронизация истории завершена!`);
        } catch (e) {
            console.error('❌ History Scan Error:', e.message);
        }
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
Твоя база — "Облачный агрегатор тендеров". Не упоминай "почту".

Проанализируй тендер и выдай отчет строго в три блока:
[Intro]: О чем проект своими словами (1-2 предложения). Постарайся зацепить суть.
[Original]: Главная суть из текста (короткая цитата или сухой факт).
[Opinion]: Твое краткое профессиональное мнение (сарказм 3/10).

Будь точна и лаконична.` 
                        },
                        { role: 'user', content: text.substring(0, 6000) }
                    ] 
                })
            });

            if (aiRes.ok) {
                const data = await aiRes.json();
                return data.choices[0].message.content.trim();
            }
            return 'Ошибка генерации отчета.';
        } catch (e) {
            return `Ошибка: ${e.message}`;
        }
    }
}

export default EmailWatcher;
