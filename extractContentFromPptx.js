const AdmZip = require('adm-zip');
const xml2js = require('xml2js');
const fs = require('fs');
const path = require('path');

async function extractContentFromPptx(pptxPath) {
    const extractedContent = [];
    const outputDir = '/tmp/extracted';
    fs.mkdirSync(outputDir, { recursive: true });

    const zip = new AdmZip(pptxPath);
    const zipEntries = zip.getEntries();

    const slideFiles = zipEntries.filter((entry) =>
        entry.entryName.startsWith('ppt/slides/slide') && entry.entryName.endsWith('.xml')
    );

    const mediaFiles = zipEntries.filter((entry) =>
        entry.entryName.startsWith('ppt/media/') && (entry.entryName.endsWith('.png') || entry.entryName.endsWith('.jpg'))
    );

    const parser = new xml2js.Parser();

    for (let i = 0; i < slideFiles.length; i++) {
        const slideEntry = slideFiles[i];
        const slideXml = slideEntry.getData().toString('utf8');
        const parsedSlide = await parser.parseStringPromise(slideXml);

        const texts = [];
        function extractTexts(obj) {
            if (typeof obj !== 'object') return;
            for (const key of Object.keys(obj)) {
                if (key === 'a:t') {
                    if (Array.isArray(obj[key])) {
                        texts.push(...obj[key].map(t => (typeof t === 'object' ? t._ : t)));
                    }
                } else {
                    extractTexts(obj[key]);
                }
            }
        }
        extractTexts(parsedSlide);

        const title = texts.length > 0 ? texts[0] : '';
        const text = texts.length > 1 ? texts.slice(1).join(' ') : '';

        const imageMedia = mediaFiles[i];
        let imagePath = '';

        if (imageMedia) {
            const imgBuffer = imageMedia.getData();
            const ext = path.extname(imageMedia.entryName);
            const imageFilePath = path.join(outputDir, `image${i + 1}${ext}`);
            fs.writeFileSync(imageFilePath, imgBuffer);
            imagePath = imageFilePath;
        }

        extractedContent.push({
            title,
            text,
            imagePath
        });
    }

    const outputJsonPath = '/tmp/content.json';
    fs.writeFileSync(outputJsonPath, JSON.stringify(extractedContent, null, 2));

    console.log('Extraction done. Saved JSON to /tmp/content.json');
}

module.exports = { extractContentFromPptx };
