const express = require('express');
const bodyParser = require('body-parser');
const axios = require('axios');
const fs = require('fs');
const path = require('path');
const { put } = require('@vercel/blob');
const { extractContentFromPptx } = require('./extractContentFromPptx');

const app = express();
app.use(bodyParser.json());

app.post('/callback', async (req, res) => {
    const status = req.body.status;
    const downloadUri = req.body.url;

    console.log(`Callback received. Status: ${status}`);

    if ([1, 2, 6].includes(status)) {
        if (!downloadUri || downloadUri.includes('127.0.0.1')) {
            console.log('No valid downloadUri yet, waiting...');
            return res.json({ error: 0 });
        }

        try {
            // Download PPTX file
            const fileResponse = await axios.get(downloadUri, { responseType: 'arraybuffer' });
            const pptxPath = `/tmp/presentation-${Date.now()}.pptx`;
            fs.writeFileSync(pptxPath, fileResponse.data);

            // Start extraction of content
            await extractContentFromPptx(pptxPath);

            // Upload JSON file to Vercel Blob
            const jsonBuffer = fs.readFileSync('/tmp/content.json');
            const { url: uploadedUrl } = await put(`extracted-${Date.now()}.json`, jsonBuffer, {
                access: 'public'
            });

            console.log(`Uploaded extracted JSON to: ${uploadedUrl}`);
            return res.json({ error: 0, uploadedUrl });
        } catch (err) {
            console.error('Processing or upload error:', err.message);
            return res.status(500).json({ error: 'Extraction or upload failed' });
        }
    } else {
        console.log(`Ignoring callback with status ${status}`);
        return res.json({ error: 0 });
    }
});

app.get('/', (req, res) => {
    res.send('OnlyOffice Callback Backend běží!');
});

module.exports = app;
