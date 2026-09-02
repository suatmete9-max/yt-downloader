const express = require('express');
const cors = require('cors');
const axios = require('axios');

const app = express();
app.use(cors());
app.use(express.static(__dirname));
app.get('/download', async (req, res) => {
    const ytUrl = req.query.url;
    
    if (!ytUrl) {
        return res.status(400).send("Link missing!");
    }

    try {
        // Step 1: RapidAPI se video ka hidden link nikalna
        const rapidApiUrl = `https://ziyotech-youtube-downloader-api.p.rapidapi.com/rapid/youtube?url=${encodeURIComponent(ytUrl)}&type=video&quality=1080`;
        
        const apiResponse = await axios.get(rapidApiUrl, {
            headers: {
                'x-rapidapi-key': '74b0bf4963mshf95a9cf1f718e20p1f8a2djsn9bca7a6d74dd', // Aapki API key
                'x-rapidapi-host': 'ziyotech-youtube-downloader-api.p.rapidapi.com'
            }
        });

        // Nayi API ke format se media URL nikalna
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

        // Browser ko batana ki yeh file force-download karni hai, play nahi karni
        res.setHeader('Content-Disposition', 'attachment; filename="YouTube_Video.mp4"');
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