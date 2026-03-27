const express = require('express');
const puppeteer = require('puppeteer');
const app = express();
const PORT = process.env.PORT || 3000;

app.set('json spaces', 2);

app.get('/search', async (req, res) => {
    const query = req.query.q;
    if (!query) return res.json({ status: false, msg: "Search query required" });

    let browser;
    try {
        browser = await puppeteer.launch({
            args: ["--no-sandbox", "--disable-setuid-sandbox"],
            headless: "new"
        });
        const page = await browser.newPage();
        await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.0.0 Safari/537.36');
        
        await page.goto(`https://cinesubz.lk/?s=${encodeURIComponent(query)}`, { waitUntil: 'networkidle2' });

        const results = await page.evaluate(() => {
            return Array.from(document.querySelectorAll('article')).map(el => ({
                title: el.querySelector('h2.entry-title a')?.innerText.trim(),
                url: el.querySelector('h2.entry-title a')?.href,
                img: el.querySelector('img')?.src
            }));
        });

        await browser.close();
        res.json({ status: true, total: results.length, results });
    } catch (e) {
        if (browser) await browser.close();
        res.json({ status: false, error: e.message });
    }
});

// Episode Details සහ Download Links ගන්න කොටස
app.get('/details', async (req, res) => {
    const url = req.query.url;
    if (!url) return res.json({ status: false, msg: "URL required" });

    let browser;
    try {
        browser = await puppeteer.launch({
            args: ["--no-sandbox", "--disable-setuid-sandbox"],
            headless: "new"
        });
        const page = await browser.newPage();
        await page.goto(url, { waitUntil: 'networkidle2' });

        const details = await page.evaluate(() => {
            const title = document.querySelector('h1.entry-title')?.innerText.trim();
            const links = Array.from(document.querySelectorAll('a[href*="pixeldrain.com"]')).map(a => ({
                quality: a.innerText.trim(),
                link: a.href
            }));
            return { title, links };
        });

        await browser.close();
        res.json({ status: true, data: details });
    } catch (e) {
        if (browser) await browser.close();
        res.json({ status: false, error: e.message });
    }
});

app.listen(PORT, () => console.log(`API is live on ${PORT}`));
