const express = require('express');
const cors = require('cors');
const fetch = require('node-fetch');
const config = require('./config');
const app = express();
app.use(express.json());
app.use(cors());
app.use(express.static(__dirname));
const PORT = config.PORT;
const OPENAI_API_KEY = config.OPENAI_API_KEY;
app.post('/process_image', async (req, res) => {
    const base64Image = req.body.image;
    if (!base64Image) {
        return res.status(400).json({ error: 'No image data received.' });
    }
    const headers = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
    };
    const payload = {
        model: "gpt-4-vision-preview",
        messages: [{
            role: "user",
            content: [{
                type: "text",
                text: "Whats in this image? Be descriptive. For each significant item recognized, wrap this word in <b> tags. Example: The image shows a <b>man</b> in front of a neutral-colored <b>wall</b>. He has short hair, wears <b>glasses</b>, and is donning a pair of over-ear <b>headphones</b>. ... Also output an itemized list of objects recognized, wrapped in <br> and <b> tags with label <br><b>Objects:."
            }, {
                type: "image_url",
                image_url: {
                    url: `data:image/jpeg;base64,${base64Image}`
                }
            }]
        }],
        max_tokens: 400,
    };
    try {
        const response = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: headers,
            body: JSON.stringify(payload),
        });
        const data = await response.json();
        res.status(200).json(data);
    } catch (error) {
        console.error('Fetch error:', error);
        res.status(500).json({ error: 'Failed to process the image.' });
    }
});
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
