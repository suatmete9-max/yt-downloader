const express = require('express');
const cors = require('cors');
const axios = require('axios');
const https = require('https');
const http = require('http');

const app = express();
app.use(cors());
app.use(express.static(__dirname));

app.get('/download', async (req, res) => {
    const ytUrl = req.query.url;
    // Frontend se aayi quality uthana, default 360p
    const requestedQuality = req.query.quality || '360';
    
    if (!ytUrl) {
        return res.status(400).send("Link missing!");
    }

    const rapidApiHost = 'ziyotech-youtube-downloader-api.p.rapidapi.com';
    const rapidApiUrl = `https://${rapidApiHost}/rapid/youtube?url=${encodeURIComponent(ytUrl)}&type=video&quality=${requestedQuality}`;

    // Aapki dono RapidAPI keys
    const apiKeys = [
        'a79029a42amsh34dd30872ea2f85p183dcbjsn3e284363d40b', // Pehli API Key
        '5790f8a63dmsh9d28171653380fep1aa04fjsne748a9af912c'  // Dusri API Key
    ];

    let downloadUrl = "";
    let success = false;

    // Loop ke zariye keys try karna
    for (let i = 0; i < apiKeys.length; i++) {
        try {
            console.log(`Trying API Key Index: ${i}`);

            const apiResponse = await axios.get(rapidApiUrl, {
                headers: {
                    'x-rapidapi-key': apiKeys[i], 
                    'x-rapidapi-host': rapidApiHost
                }
            });

            if (apiResponse.data && apiResponse.data.medias && apiResponse.data.medias.length > 0) {
                downloadUrl = apiResponse.data.medias[0].url;
            } else {
                downloadUrl = apiResponse.data.url || apiResponse.data.link;
            }

            if (downloadUrl) {
                success = true;
                break; // Link mil gaya toh loop rok do
            }
        } catch (error) {
            console.warn(`API Key ${i} failed or limit reached. Trying next API Key...`);
        }
    }

    if (!success || !downloadUrl) {
        return res.status(404).send("Sabhi APIs ki limit khatam ho chuki hai ya video download link nahi mila.");
    }

    try {
        // Direct download stream force karna
        const videoStream = await axios({
            method: 'get',
            url: downloadUrl,
            responseType: 'stream'
        });

        res.setHeader('Content-Disposition', `attachment; filename="YouTube_Video_${requestedQuality}p.mp4"`);
        res.setHeader('Content-Type', 'video/mp4');

        // Video data ko user ko pipe karna
        videoStream.data.pipe(res);

    } catch (error) {
        console.error("Stream Error:", error.message);
        res.status(500).send("Server Error!");
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server chal raha hai: http://localhost:${PORT}`);
    startSelfPing();
});

// ==========================================
// PREVENT RENDER SLEEP MODE (SELF-PING SYSTEM)
// ==========================================
function startSelfPing() {
    // Apni Render website ka exact URL
    const SITE_URL = process.env.RENDER_EXTERNAL_URL || 'https://yt-downloader-rt9h.onrender.com/';

    // Har 10 minute (600,000 ms) me self-request bhejega
    const INTERVAL = 10 * 60 * 1000;

    setInterval(() => {
        const protocol = SITE_URL.startsWith('https') ? https : http;

        protocol.get(SITE_URL, (res) => {
            console.log(`[Self-Ping Successful] Status Code: ${res.statusCode}`);
        }).on('error', (err) => {
            console.error(`[Self-Ping Error]: ${err.message}`);
        });
    }, INTERVAL);
}
