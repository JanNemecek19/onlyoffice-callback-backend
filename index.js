const { extractContentFromPptx } = require('./extractContentFromPptx');
const express = require('express');
const bodyParser = require('body-parser');
const axios = require('axios');
const fs = require('fs');

const app = express();
app.use(bodyParser.json());

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

app.get('/', (req, res) => {
    res.send('OnlyOffice Callback Backend běží!');
});

module.exports = app;
