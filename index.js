const express = require('express');
const axios = require('axios');
const cheerio = require('cheerio');
const app = express();
const PORT = process.env.PORT || 3000;

app.set('json spaces', 2);

const headers = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.0.0 Safari/537.36'
};

// --- SEARCH ---
app.get('/search', async (req, res) => {
    const query = req.query.q;
    if (!query) return res.json({ status: false, msg: "Add ?q=movie" });

    try {
        const { data } = await axios.get(`https://cinesubz.lk/?s=${encodeURIComponent(query)}`, { headers });
        const $ = cheerio.load(data);
        const results = [];

        $('.result-item').each((i, el) => {
            results.push({
                title: $(el).find('.title a').text().trim(),
                url: $(el).find('.title a').attr('href'),
                img: $(el).find('img').attr('src'),
                rating: $(el).find('.rating').text().trim() || "N/A"
            });
        });

        res.json({ status: true, results });
    } catch (e) {
        res.json({ status: false, error: e.message });
    }
});

// --- LINKS ---
app.get('/getlinks', async (req, res) => {
    const movieUrl = req.query.url;
    if (!movieUrl) return res.json({ status: false, msg: "Add ?url=link" });

    try {
        const { data } = await axios.get(movieUrl, { headers });
        const $ = cheerio.load(data);
        
        const title = $('.data h1').text().trim();
        const dlLinks = [];

        $('a.box_download').each((i, el) => {
            const link = $(el).attr('href');
            if (link.includes('pixeldrain.com')) {
                dlLinks.push({
                    quality: $(el).text().trim(),
                    link: link
                });
            }
        });

        res.json({ status: true, data: { title, dlLinks } });
    } catch (e) {
        res.json({ status: false, error: e.message });
    }
});

app.listen(PORT, () => console.log(`API live on port ${PORT}`));
