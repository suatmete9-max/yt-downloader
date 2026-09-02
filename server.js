const express = require('express');
const cors = require('cors');
const axios = require('axios');

const app = express();
app.use(cors());
app.use(express.static(__dirname));

app.get('/download', async (req, res) => {
    const ytUrl = req.query.url;
    // Naya: Frontend se aayi quality uthana, agar nahi aayi toh default 360p rakhna
    const requestedQuality = req.query.quality || '360';
    
    if (!ytUrl) {
        return res.status(400).send("Link missing!");
    }

    try {
        // Step 1: RapidAPI request mein ab dynamic quality parameter bheja ja raha hai
        const rapidApiUrl = `https://ziyotech-youtube-downloader-api.p.rapidapi.com/rapid/youtube?url=${encodeURIComponent(ytUrl)}&type=video&quality=${requestedQuality}`;
        
        const apiResponse = await axios.get(rapidApiUrl, {
            headers: {
                'x-rapidapi-key': '74b0bf4963mshf95a9cf1f718e20p1f8a2djsn9bca7a6d74dd', 
                'x-rapidapi-host': 'ziyotech-youtube-downloader-api.p.rapidapi.com'
            }
        });

        let downloadUrl = "";
        if (apiResponse.data && apiResponse.data.medias && apiResponse.data.medias.length > 0) {
            downloadUrl = apiResponse.data.medias[0].url;
        } else {
            downloadUrl = apiResponse.data.url || apiResponse.data.link;
        }

        if (!downloadUrl) {
            return res.status(404).send("Video download link nahi mila.");
        }

        // Step 2: Zedcreator link ko mask karke direct download force karna
        const videoStream = await axios({
            method: 'get',
            url: downloadUrl,
            responseType: 'stream'
        });

        // Naya: File ke naam mein quality add karna (e.g., YouTube_Video_720p.mp4)
        res.setHeader('Content-Disposition', `attachment; filename="YouTube_Video_${requestedQuality}p.mp4"`);
        res.setHeader('Content-Type', 'video/mp4');

        // Video data ko seedha user ke computer mein bhejna
        videoStream.data.pipe(res);

    } catch (error) {
        console.error("Backend Error:", error.message);
        res.status(500).send("Server Error!");
    }
});

app.listen(3000, () => {
    console.log("Server chal raha hai: http://localhost:3000");
});
