const fs = require('fs-extra');
const path = require('path');
const { exec } = require('child_process');
const { PDFDocument } = require('pdf-lib');
const os = require('os');

const isWindows = os.platform() === 'win32';
const gsCommand = isWindows ? (os.arch() === 'x64' ? 'gswin64c' : 'gswin32c') : 'gs';

async function compressSinglePage(inputPageBytes, outputPath, maxPageSize) {
    if (inputPageBytes.length <= maxPageSize) {
        return inputPageBytes;
    }
    
    const tempPdfPath = path.join(__dirname, 'temp_single_page.pdf');
    fs.writeFileSync(tempPdfPath, inputPageBytes);

    const gsSettingsList = [
        "-dPDFSETTINGS=/prepress",
        "-dPDFSETTINGS=/printer",
        "-dPDFSETTINGS=/ebook",
        "-dPDFSETTINGS=/screen"
    ];

    let compressedPageBytes;

    for (const gsSettings of gsSettingsList) {
        await new Promise((resolve, reject) => {
            const command = `${gsCommand} -sDEVICE=pdfwrite -dCompatibilityLevel=1.4 ${gsSettings} -dNOPAUSE -dQUIET -dBATCH -sOutputFile=${outputPath} ${tempPdfPath}`;
            exec(command, (error, stdout, stderr) => {
                if (error) {
                    reject(`Error compressing PDF page: ${error.message}`);
                }
                if (stderr) {
                    console.error(`Ghostscript stderr: ${stderr}`);
                }
                compressedPageBytes = fs.readFileSync(outputPath);
                resolve();
            });
        });

        if (compressedPageBytes.length <= maxPageSize) {
            break;
        }
    }

    if (compressedPageBytes.length > maxPageSize) {
        const command = `${gsCommand} -sDEVICE=pdfwrite -dCompatibilityLevel=1.4 -dPDFSETTINGS=/screen -dNOPAUSE -dQUIET -dBATCH -dDownsampleColorImages=true -dColorImageResolution=100 -dGrayImageResolution=100 -dMonoImageResolution=100 -sOutputFile=${outputPath} ${tempPdfPath}`;
        await new Promise((resolve, reject) => {
            exec(command, (error2, stdout2, stderr2) => {
                if (error2) {
                    reject(`Error adjusting PDF page compression: ${error2.message}`);
                }
                if (stderr2) {
                    console.error(`Ghostscript stderr (adjust): ${stderr2}`);
                }
                compressedPageBytes = fs.readFileSync(outputPath);
                resolve();
            });
        });
    }

    fs.unlinkSync(tempPdfPath);
    return compressedPageBytes;
}

async function compressPDF(inputPath, maxPageSize) {
    const fileBuffer = await fs.readFile(inputPath);
    const pdfDoc = await PDFDocument.load(fileBuffer);
    const numPages = pdfDoc.getPageCount();
    let modified = false;

    const newPdfDoc = await PDFDocument.create();

    for (let i = 0; i < numPages; i++) {
        const pageDoc = await PDFDocument.create();
        const [copiedPage] = await pageDoc.copyPages(pdfDoc, [i]);
        pageDoc.addPage(copiedPage);
        let pageBytes = await pageDoc.save();
        const pageSize = pageBytes.length;

        if (pageSize > maxPageSize) {
            modified = true;
            const tempCompressedPath = path.join(__dirname, `compressed_page_${i + 1}.pdf`);
            pageBytes = await compressSinglePage(pageBytes, tempCompressedPath, maxPageSize);
            await fs.unlink(tempCompressedPath);
        }

        const pageDocCompressed = await PDFDocument.load(pageBytes);
        const [compressedPage] = await newPdfDoc.copyPages(pageDocCompressed, [0]);
        newPdfDoc.addPage(compressedPage);
    }

    if (modified) {
        const newPdfBytes = await newPdfDoc.save();
        await fs.writeFile(inputPath, newPdfBytes);
    }
}

async function getPageSize(pdfDoc, pageIndex) {
    const pageDoc = await PDFDocument.create();
    const [copiedPage] = await pageDoc.copyPages(pdfDoc, [pageIndex]);
    pageDoc.addPage(copiedPage);
    const pageBytes = await pageDoc.save();
    return pageBytes.length;
}

async function splitPDF(inputPath, maxFileSize) {
    const fileStats = await fs.stat(inputPath);
    if (fileStats.size <= maxFileSize) {
        return;
    }

    const fileBuffer = await fs.readFile(inputPath);
    const pdfDoc = await PDFDocument.load(fileBuffer);
    const numPages = pdfDoc.getPageCount();
    const originalFileName = path.basename(inputPath, path.extname(inputPath));
    const outputDir = path.dirname(inputPath);

    let partIndex = 1;
    let currentPdfDoc = await PDFDocument.create();
    let currentSize = 0;

    for (let i = 0; i < numPages; i++) {
        const pageSize = await getPageSize(pdfDoc, i);

        if (currentSize + pageSize > maxFileSize && currentSize > 0) {
            const partPath = path.join(outputDir, `${originalFileName} - Part ${partIndex}.pdf`);
            fs.writeFileSync(partPath, await currentPdfDoc.save());
            partIndex++;
            currentPdfDoc = await PDFDocument.create();
            currentSize = 0;
        }

        const [copiedPage] = await currentPdfDoc.copyPages(pdfDoc, [i]);
        currentPdfDoc.addPage(copiedPage);
        currentSize += pageSize;
    }

    if (currentSize > 0) {
        const partPath = path.join(outputDir, `${originalFileName} - Part ${partIndex}.pdf`);
        fs.writeFileSync(partPath, await currentPdfDoc.save());
    }

    fs.unlinkSync(inputPath);
}

module.exports = {
    compressPDF,
    splitPDF
};
