const express = require('express');
const bodyParser = require('body-parser');
const axios = require('axios');
const { put } = require('@vercel/blob'); // Blob storage upload

const app = express();
app.use(bodyParser.json());

app.post('/callback', async (req, res) => {
    const status = req.body.status;
    const downloadUri = req.body.url;

    console.log('Callback received. Status:', status);

    if (status === 2 || status === 6) {
        try {
            // Stáhneme PPTX soubor jako arraybuffer
            const fileResponse = await axios.get(downloadUri, { responseType: 'arraybuffer' });

            // Název souboru s timestampem
            const fileName = `presentation-${Date.now()}.pptx`;

            // Nahrajeme soubor na Vercel Blob Storage
            const blob = await put(fileName, fileResponse.data, {
                access: 'public', // aby byl přístupný zvenčí
            });

            console.log('File uploaded to Blob Storage:', blob.url);

            // Odpovíme klientovi
            res.json({ error: 0, uploadedUrl: blob.url });
        } catch (err) {
            console.error('Upload error:', err);
            res.status(500).send('Failed to upload to Blob Storage');
        }
    } else {
        res.json({ error: 0 });
    }
});

// Root route
app.get('/', (req, res) => {
    res.send('OnlyOffice Callback Backend běží!');
});

module.exports = app;
