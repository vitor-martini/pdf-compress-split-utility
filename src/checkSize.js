const fs = require('fs-extra');
const { PDFDocument } = require('pdf-lib');
const path = require('path');

async function getPageSizes(filePath) {
    const fileBuffer = await fs.readFile(filePath);
    const pdfDoc = await PDFDocument.load(fileBuffer);
    const numPages = pdfDoc.getPageCount();
    let totalSize = 0;

    for (let i = 0; i < numPages; i++) {
        const pageDoc = await PDFDocument.create();
        const [copiedPage] = await pageDoc.copyPages(pdfDoc, [i]);
        pageDoc.addPage(copiedPage);
        const pageBytes = await pageDoc.save();
        const pageSizeKB = pageBytes.length / 1024;
        totalSize += pageSizeKB;
        console.log(`Page ${i + 1}: ${pageSizeKB.toFixed(2)} KB`);
    }
    console.log(`Total: ${totalSize.toFixed(2)} KB`);
}

const filePath = path.join(__dirname, '../exemple.pdf');

getPageSizes(filePath).catch(err => console.error(err));
