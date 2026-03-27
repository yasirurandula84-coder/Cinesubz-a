const express = require('express');
const axios = require('axios');
const cheerio = require('cheerio');
const app = express();
const PORT = process.env.PORT || 3000;

app.set('json spaces', 2);

const headers = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36'
};

// --- SEARCH (රිසල්ට් 10+ එන විදියට හදපු සර්ච් එක) ---
app.get('/search', async (req, res) => {
    const query = req.query.q;
    if (!query) return res.json({ status: false, msg: "ෆිල්ම් එකේ නම ඇතුළත් කරන්න (?q=movie)" });

    try {
        const searchUrl = `https://cinesubz.lk/?s=${encodeURIComponent(query)}`;
        const { data } = await axios.get(searchUrl, { headers });
        const $ = cheerio.load(data);
        const results = [];

        // සයිට් එකේ ෆිල්ම් කාඩ්ස් අල්ලගන්න පුළුවන් හැම selector එකක්ම මෙතන තියෙනවා
        $('article, .result-item, .post-item, .item').each((i, el) => {
            const titleElement = $(el).find('h2.entry-title a, h2.title a, .title a, h3 a').first();
            const title = titleElement.text().trim();
            const url = titleElement.attr('href');
            const img = $(el).find('img').attr('src');

            if (title && url) {
                results.push({
                    title: title,
                    url: url,
                    img: img || "https://dummyimage.com/600x400/000/fff&text=No+Image"
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

// --- GET LINKS (ලින්ක් ගන්න කොටස) ---
app.get('/getlinks', async (req, res) => {
    const movieUrl = req.query.url;
    if (!movieUrl) return res.json({ status: false, msg: "URL එකක් අවශ්‍යයි (?url=link)" });

    try {
        const { data } = await axios.get(movieUrl, { headers });
        const $ = cheerio.load(data);
        const title = $('h1.entry-title, .data h1').first().text().trim();
        const dlLinks = [];

        // Pixeldrain ලින්ක් සහ කොලිටිය හරියටම අල්ලගන්නවා
        $('a').each((i, el) => {
            const link = $(el).attr('href') || "";
            const text = $(el).text().trim();

            if (link.includes('pixeldrain.com')) {
                // සමහර වෙලාවට ලින්ක් එකේ කොලිටිය තියෙන්නේ බටන් එකේ නමේ
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
