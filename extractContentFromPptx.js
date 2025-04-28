const AdmZip = require('adm-zip');
const xml2js = require('xml2js');
const fs = require('fs').promises;
const path = require('path');

async function extractContentFromPptx(pptxPath) {
    const extractedContent = [];

    // Rozbal PPTX archiv
    const zip = new AdmZip(pptxPath);
    const zipEntries = zip.getEntries();

    // Najdi vsechny slidy
    const slideFiles = zipEntries.filter((entry) => entry.entryName.startsWith('ppt/slides/slide') && entry.entryName.endsWith('.xml'));

    const parser = new xml2js.Parser();

    for (const slideEntry of slideFiles) {
        const slideXml = slideEntry.getData().toString('utf8');
        const parsedSlide = await parser.parseStringPromise(slideXml);

        // Vytahni vsechny texty z <a:t> tagu
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

        extractedContent.push({
            title,
            text
        });
    }

    // Asynchronni zapis souboru!
    const outputJsonPath = '/tmp/content.json';
    await fs.writeFile(outputJsonPath, JSON.stringify(extractedContent, null, 2));

    console.log('Extraction done. Saved to /tmp/content.json');
}

module.exports = { extractContentFromPptx };
