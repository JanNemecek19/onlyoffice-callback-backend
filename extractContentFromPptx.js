// Nova funkce na extrakci obsahu z PPTX souboru

const AdmZip = require('adm-zip');
const xml2js = require('xml2js');
const fs = require('fs');
const path = require('path');

async function extractContentFromPptx(pptxPath) {
    const extractedContent = [];

    // Rozbal PPTX archiv
    const zip = new AdmZip(pptxPath);
    const zipEntries = zip.getEntries();

    // Najdi vsechny slidy
    const slideFiles = zipEntries.filter((entry) => entry.entryName.startsWith('ppt/slides/slide') && entry.entryName.endsWith('.xml'));

    // Vytvor slozku na extrahovane obrazky
    const imageOutputDir = '/tmp/extracted';
    if (!fs.existsSync(imageOutputDir)) {
        fs.mkdirSync(imageOutputDir);
    }

    // Extrahuj obrazky
    zipEntries.forEach((entry) => {
        if (entry.entryName.startsWith('ppt/media/')) {
            const outputPath = path.join(imageOutputDir, path.basename(entry.entryName));
            fs.writeFileSync(outputPath, entry.getData());
        }
    });

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
                        texts.push(...obj[key].map(t => t._ || t));
                    }
                } else {
                    extractTexts(obj[key]);
                }
            }
        }
        extractTexts(parsedSlide);

        // Pro jednoduchost predpokladame:
        // - Prvni text je title
        // - Zbytek je text

        const title = texts.length > 0 ? texts[0] : '';
        const text = texts.length > 1 ? texts.slice(1).join(' ') : '';

        extractedContent.push({
            title,
            text,
            // Obrazky zatim neprirazujeme k jednotlivym slidum, ale muzeme pozdeji!
        });
    }

    // Vysledny JSON zapiseme
    const outputJsonPath = '/tmp/extracted/content.json';
    fs.writeFileSync(outputJsonPath, JSON.stringify(extractedContent, null, 2));

    console.log('Extraction done. Saved to /tmp/extracted/content.json');
}

module.exports = { extractContentFromPptx };
