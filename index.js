const express = require('express');
const bodyParser = require('body-parser');
const fs = require('fs');
const path = require('path');
const axios = require('axios');
const { extractContentFromPptx } = require('./extractContentFromPptx');

const app = express();
app.use(bodyParser.json());

// CALLBACK HANDLER - ulozi PPTX a extrahuje text
app.post('/callback', async (req, res) => {
    const status = req.body.status;
    const downloadUri = req.body.url;

    console.log('Callback received. Status:', status);

    if (status === 2 || status === 6) {
        try {
            const fileData = await axios.get(downloadUri, { responseType: 'arraybuffer' });
            fs.writeFileSync('/tmp/myfile-latest.pptx', fileData.data);
            console.log('File saved to /tmp/myfile-latest.pptx');

            await extractContentFromPptx('/tmp/myfile-latest.pptx');
        } catch (err) {
            console.error('Download error:', err);
        }
    }

    res.json({ error: 0 });
});

// TEST endpoint na vraceni extrahovaneho JSONu
app.get('/extracted-content', (req, res) => {
    const contentPath = '/tmp/content.json';
    if (fs.existsSync(contentPath)) {
        const content = fs.readFileSync(contentPath, 'utf8');
        res.setHeader('Content-Type', 'application/json');
        res.send(content);
    } else {
        res.status(404).send({ error: 'Extracted content not found.' });
    }
});

// HOME PAGE
app.get('/', (req, res) => {
    res.send('OnlyOffice Callback Backend běží!');
});

module.exports = app;
