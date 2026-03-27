const express = require('express');
const axios = require('axios');
const cheerio = require('cheerio');
const app = express();
const PORT = process.env.PORT || 3000;

app.set('json spaces', 2);

const headers = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36'
};

// --- SEARCH (Google හරහා සයිට් එක ඇතුළේ සර්ච් කිරීම) ---
app.get('/search', async (req, res) => {
    const query = req.query.q;
    if (!query) return res.json({ status: false, msg: "Search query required" });

    try {
        // අපි Google එකට කියනවා cinesubz.lk සයිට් එක ඇතුළේ විතරක් මේ ෆිල්ම් එක හොයන්න කියලා
        const googleUrl = `https://www.google.com/search?q=site:cinesubz.lk+${encodeURIComponent(query)}`;
        const response = await axios.get(googleUrl, { headers });
        const $ = cheerio.load(response.data);
        const results = [];

        // Google සර්ච් රිසල්ට් වලින් ලින්ක්ස් වෙන් කරගැනීම
        $('div.g').each((i, el) => {
            const title = $(el).find('h3').text();
            const url = $(el).find('a').attr('href');

            if (title && url && url.includes('cinesubz.lk')) {
                results.push({
                    title: title.replace(' - Cinesubz.lk', '').trim(),
                    url: url
                });
            }
        });

        res.json({ 
            status: true, 
            total_results: results.length, 
            results: results 
        });

    } catch (e) {
        res.json({ status: false, error: "Google search failed" });
    }
});

// --- GET LINKS (ලින්ක් එක දුන්නම ඩවුන්ලෝඩ් ලින්ක්ස් දෙන එක) ---
app.get('/getlinks', async (req, res) => {
    const movieUrl = req.query.url;
    if (!movieUrl) return res.json({ status: false, msg: "URL required" });

    try {
        const { data } = await axios.get(movieUrl, { headers });
        const $ = cheerio.load(data);
        const title = $('h1').first().text().trim();
        const dlLinks = [];

        // Pixeldrain ලින්ක්ස් ටික අහුලගන්නවා
        $('a[href*="pixeldrain.com"]').each((i, el) => {
            dlLinks.push({
                quality: $(el).text().trim() || "Download",
                link: $(el).attr('href')
            });
        });

        res.json({ status: true, data: { title, dlLinks } });
    } catch (e) {
        res.json({ status: false, error: e.message });
    }
});

app.listen(PORT, () => console.log(`🚀 API Live via Google Search on ${PORT}`));
