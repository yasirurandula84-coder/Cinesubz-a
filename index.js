const express = require('express');
const puppeteer = require('puppeteer');
const app = express();

// Render eken dena Port eka hari 3000 hari gannawa
const PORT = process.env.PORT || 3000;

app.set('json spaces', 2);

// --- SEARCH ENDPOINT ---
app.get('/search', async (req, res) => {
    const query = req.query.q;
    if (!query) return res.status(400).json({ status: false, msg: "Please provide a search query (?q=movie)" });

    let browser;
    try {
        browser = await puppeteer.launch({
            headless: "new",
            args: [
                "--no-sandbox",
                "--disable-setuid-sandbox",
                "--disable-dev-shm-usage",
                "--single-process",
                "--no-zygote"
            ],
            // Render wala Chrome thiyena path eka (Auto detect)
            executablePath: process.env.PUPPETEER_EXECUTABLE_PATH || '/usr/bin/google-chrome'
        });

        const page = await browser.newPage();
        await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.0.0 Safari/537.36');
        
        const searchUrl = `https://cinesubz.lk/?s=${encodeURIComponent(query)}`;
        await page.goto(searchUrl, { waitUntil: 'networkidle2', timeout: 60000 });

        const results = await page.$$eval(".result-item", (items) => {
            return items.map(item => ({
                title: item.querySelector(".title a")?.innerText.trim(),
                movieUrl: item.querySelector(".title a")?.href,
                img: item.querySelector("img")?.src,
                rating: item.querySelector(".rating")?.innerText.trim() || "N/A"
            }));
        });

        await browser.close();
        res.json({ status: true, count: results.length, results });

    } catch (e) {
        if (browser) await browser.close();
        res.status(500).json({ status: false, error: e.message });
    }
});

// --- GET LINKS ENDPOINT ---
app.get('/getlinks', async (req, res) => {
    const movieUrl = req.query.url;
    if (!movieUrl) return res.status(400).json({ status: false, msg: "Movie URL is required" });

    let browser;
    try {
        browser = await puppeteer.launch({
            headless: "new",
            args: ["--no-sandbox", "--disable-setuid-sandbox", "--disable-dev-shm-usage"],
            executablePath: process.env.PUPPETEER_EXECUTABLE_PATH || '/usr/bin/google-chrome'
        });

        const page = await browser.newPage();
        await page.goto(movieUrl, { waitUntil: 'networkidle2', timeout: 60000 });

        const data = await page.evaluate(() => {
            const title = document.querySelector(".data h1")?.innerText.trim();
            const dlLinks = Array.from(document.querySelectorAll("a.box_download"))
                .map(a => ({
                    quality: a.innerText.trim(),
                    link: a.href
                }))
                .filter(l => l.link.includes("pixeldrain.com"));

            return { title, dlLinks };
        });

        await browser.close();
        res.json({ status: true, data });

    } catch (e) {
        if (browser) await browser.close();
        res.status(500).json({ status: false, error: e.message });
    }
});

app.listen(PORT, () => {
    console.log(`🚀 Cinesubz API is live on port ${PORT}`);
});
