const express = require('express');
const bodyParser = require('body-parser');
const axios = require('axios');
const { put } = require('@vercel/blob'); // Blob storage upload

const app = express();
app.use(bodyParser.json());

app.post('/callback', async (req, res) => {
    const status = req.body.status;
    const downloadUri = req.body.url;

    console.log(`Callback received. Status: ${status}`);

    if (status === 1 || status === 2 || status === 6) {
        if (!downloadUri || downloadUri.includes('127.0.0.1')) {
            console.log('No valid downloadUri yet, waiting...');
            return res.json({ error: 0 });
        }

        try {
            const fileData = await axios.get(downloadUri, { responseType: 'arraybuffer' });
            const fileName = `presentation-${Date.now()}.pptx`;

            await put(fileName, fileData.data, { access: 'public' });
            console.log(`File uploaded successfully: ${fileName}`);

            return res.json({ error: 0, uploadedUrl: `${process.env.BLOB_PUBLIC_URL}/${fileName}` });
        } catch (err) {
            console.error('Upload error:', err.message);
            return res.status(500).json({ error: 'Upload failed' });
        }
    } else {
        console.log(`Ignoring callback with status ${status}`);
        return res.json({ error: 0 });
    }
});

// Root route
app.get('/', (req, res) => {
    res.send('OnlyOffice Callback Backend běží!');
});

module.exports = app;
