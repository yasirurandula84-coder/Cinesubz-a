const express = require('express');
const puppeteer = require('puppeteer');
const app = express();
const PORT = process.env.PORT || 3000;

app.get('/search', async (req, res) => {
    const query = req.query.q;
    if (!query) return res.json({ status: false, msg: "Add ?q=movie" });

    const browser = await puppeteer.launch({ 
        headless: "new", 
        args: ["--no-sandbox", "--disable-setuid-sandbox"] 
    });
    const page = await browser.newPage();
    try {
        await page.goto(`https://cinesubz.lk/?s=${encodeURIComponent(query)}`, { waitUntil: 'networkidle2' });
        const results = await page.$$eval(".result-item", items => 
            items.map(item => ({
                title: item.querySelector(".title a")?.innerText,
                url: item.querySelector(".title a")?.href,
                img: item.querySelector("img")?.src
            }))
        );
        await browser.close();
        res.json({ results });
    } catch (e) {
        await browser.close();
        res.json({ error: e.message });
    }
});

app.listen(PORT, () => console.log(`Live on ${PORT}`));
