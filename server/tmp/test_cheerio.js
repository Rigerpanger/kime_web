import * as cheerio from 'cheerio';

const mockHtml = `
<html>
<body>
    <table border="1">
        <tr>
            <th>Номер</th>
            <th>Тип процедуры</th>
            <th>Наименование закупки</th>
            <th>Заказчик</th>
        </tr>
        <tr>
            <td><a href="https://etp.gpb.ru/procedure/GP640411">ГП640411</a></td>
            <td>Попозиционная</td>
            <td>Оказание услуг по разработке электронных учебных курсов по программе Б...</td>
            <td>ОАО "Ямал СПГ"</td>
        </tr>
        <tr>
            <td><a href="https://etp.gpb.ru/procedure/GP123456">ГП123456</a></td>
            <td>Конкурс</td>
            <td>Дизайн сайта для Газпрома</td>
            <td>ООО "Газпром информ"</td>
        </tr>
    </table>
</body>
</html>
`;

function testParse(html) {
    const $ = cheerio.load(html);
    const tendersFound = [];

    $('table tr').each((i, row) => {
        const cells = $(row).find('td');
        if (cells.length >= 4) {
            const idText = $(cells[0]).text().trim();
            const title = $(cells[2]).text().trim();
            const customer = $(cells[3]).text().trim();
            const link = $(cells[0]).find('a').attr('href') || $(row).find('a').attr('href');

            // Regex for ID: ГП followed by digits or just digits
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

    console.log('--- TEST RESULTS ---');
    console.log(`Found ${tendersFound.length} tenders.`);
    tendersFound.forEach((t, i) => {
        console.log(`\n[${i+1}] ID: ${t.externalId}`);
        console.log(`    Title: ${t.title}`);
        console.log(`    Customer: ${t.customer}`);
        console.log(`    Link: ${t.link}`);
    });
}

testParse(mockHtml);
