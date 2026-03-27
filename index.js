const express = require('express');
const axios = require('axios');
const cheerio = require('cheerio');
const app = express();
const PORT = process.env.PORT || 3000;

app.set('json spaces', 2);

const getHeaders = () => ({
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
    'Referer': 'https://cinesubz.lk/',
    'Connection': 'keep-alive'
});

// --- SEARCH ---
app.get('/search', async (req, res) => {
    const query = req.query.q;
    if (!query) return res.json({ status: false, msg: "Please add ?q=movie_name" });

    try {
        const searchUrl = `https://cinesubz.lk/?s=${encodeURIComponent(query)}`;
        const { data } = await axios.get(searchUrl, { headers: getHeaders(), timeout: 15000 });
        const $ = cheerio.load(data);
        const results = [];

        // Cinesubz වල search result එකේ තියෙන 'article' tags ඔක්කොම ලූප් කරනවා
        $('article').each((i, el) => {
            const title = $(el).find('h2.entry-title a, .title a').text().trim();
            const url = $(el).find('h2.entry-title a, .title a').attr('href');
            let img = $(el).find('img').attr('src') || $(el).find('img').attr('data-src');

            if (title && url) {
                results.push({
                    title: title,
                    url: url,
                    img: img || "https://dummyimage.com/600x400/000/fff&text=No+Poster"
                });
            }
        });

        res.json({ 
            status: true, 
            total_results: results.length, 
            results: results 
        });

    } catch (e) {
        res.json({ status: false, error: e.message });
    }
});

// --- GET DOWNLOAD LINKS ---
app.get('/getlinks', async (req, res) => {
    const movieUrl = req.query.url;
    if (!movieUrl) return res.json({ status: false, msg: "Please add ?url=movie_link" });

    try {
        const { data } = await axios.get(movieUrl, { headers: getHeaders() });
        const $ = cheerio.load(data);
        const title = $('h1.entry-title, .data h1').first().text().trim();
        const dlLinks = [];

        // Pixeldrain ලින්ක් විතරක් ෆිල්ටර් කරනවා
        $('a').each((i, el) => {
            const link = $(el).attr('href') || "";
            const text = $(el).text().trim();

            if (link.includes('pixeldrain.com')) {
                dlLinks.push({
                    quality: text || "Download",
                    link: link
                });
            }
        });

        res.json({ status: true, data: { title, dlLinks } });
    } catch (e) {
        res.json({ status: false, error: e.message });
    }
});

app.listen(PORT, () => console.log(`🚀 Cinesubz API Live on port ${PORT}`));
