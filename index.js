const express = require('express');
const axios = require('axios');
const cheerio = require('cheerio');
const app = express();
const PORT = process.env.PORT || 3000;

app.set('json spaces', 2);

// සයිට් එක රැවටීමට අවශ්‍ය Headers
const getHeaders = () => ({
    'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
    'accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
    'accept-language': 'en-GB,en-US;q=0.9,en;q=0.8',
    'cache-control': 'max-age=0',
    'referer': 'https://cinesubz.lk/',
    'sec-ch-ua': '"Chromium";v="122", "Not(A:Brand";v="24", "Google Chrome";v="122"',
    'sec-ch-ua-mobile': '?0',
    'sec-ch-ua-platform': '"Windows"',
    'sec-fetch-dest': 'document',
    'sec-fetch-mode': 'navigate',
    'sec-fetch-site': 'same-origin',
    'sec-fetch-user': '?1',
    'upgrade-insecure-requests': '1'
});

app.get('/search', async (req, res) => {
    const query = req.query.q;
    if (!query) return res.json({ status: false, msg: "Please add ?q=movie_name" });

    try {
        // Cinesubz සර්ච් ලින්ක් එක
        const searchUrl = `https://cinesubz.lk/?s=${query.replace(/\s+/g, '+')}`;
        
        const response = await axios.get(searchUrl, { 
            headers: getHeaders(),
            timeout: 20000 
        });

        const $ = cheerio.load(response.data);
        const results = [];

        // සයිට් එකේ ලේआउट එක අනුව මම මේ Selector එක වෙනස් කළා
        $('article, .result-item, .post-item').each((i, el) => {
            const title = $(el).find('h2 a, .title a, h3 a').first().text().trim();
            const url = $(el).find('h2 a, .title a, h3 a').first().attr('href');
            let img = $(el).find('img').attr('src') || $(el).find('img').attr('data-src');

            if (title && url) {
                results.push({ title, url, img });
            }
        });

        // මීට අමතරව තවත් තැනක් චෙක් කරනවා
        if (results.length === 0) {
            $('.posts-list li, .post-column').each((i, el) => {
                const a = $(el).find('a').first();
                if (a.attr('href')) {
                    results.push({
                        title: a.text().trim() || $(el).find('img').attr('alt'),
                        url: a.attr('href'),
                        img: $(el).find('img').attr('src')
                    });
                }
            });
        }

        res.json({ 
            status: true, 
            total_results: results.length, 
            results: results 
        });

    } catch (e) {
        res.json({ status: false, error: e.message });
    }
});

app.get('/getlinks', async (req, res) => {
    const movieUrl = req.query.url;
    if (!movieUrl) return res.json({ status: false, msg: "URL required" });

    try {
        const response = await axios.get(movieUrl, { headers: getHeaders() });
        const $ = cheerio.load(response.data);
        const title = $('h1').first().text().trim();
        const dlLinks = [];

        $('a').each((i, el) => {
            const link = $(el).attr('href') || "";
            const text = $(el).text().trim();
            if (link.includes('pixeldrain.com')) {
                dlLinks.push({ quality: text || "Download", link: link });
            }
        });

        res.json({ status: true, data: { title, dlLinks } });
    } catch (e) {
        res.json({ status: false, error: e.message });
    }
});

app.listen(PORT, () => console.log(`🚀 API Live on ${PORT}`));
