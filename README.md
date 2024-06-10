# PDF Shrink

This utility provides functionality to compress and split PDF files, ensuring that individual pages and entire files do not exceed specified size limits. It utilizes Ghostscript for compression and PDF-Lib for PDF manipulation.
## Features 
- **Compress PDF Pages:**  Reduces the size of individual PDF pages to a specified maximum size. 
- **Split PDF Files:**  Splits a PDF file into multiple parts if the file size exceeds a specified limit.
## Requirements 
- **Node.js:**  Ensure you have Node.js installed on your system. 
- **Ghostscript:**  This utility depends on Ghostscript for compressing PDF files. 
- **For Windows:**  Download and install Ghostscript from the [official Ghostscript website](https://ghostscript.com/) . 
- **For Linux:**  Install Ghostscript using your package manager (e.g., `sudo apt-get install ghostscript` on Ubuntu).
## Installation

Clone this repository:

```sh
git clone https://github.com/yourusername/pdf-compress-split.git
cd pdf-compress-split
```



Install the required npm packages:

```sh
npm install
```


## Usage
### Compress PDF Pages

The `compressPDF` function compresses individual pages of a PDF to ensure they do not exceed the specified size limit.

```js
const { compressPDF } = require('./index');
const path = require('path');

const inputPath = path.join(__dirname, 'path-to-your-pdf.pdf');
const KB = 1024;

(async () => {
  try {
    await compressPDF(inputPath, 900 * KB); // Compress pages to be under 900KB each
    console.log('PDF pages compressed successfully');
  } catch (err) {
    console.error(err);
  }
})();
```


### Split PDF File

The `splitPDF` function splits a PDF file into smaller parts if the total file size exceeds the specified limit.

```js
const { splitPDF } = require('./index');
const path = require('path');

const inputPath = path.join(__dirname, 'path-to-your-pdf.pdf');
const KB = 1024;

(async () => {
  try {
    await splitPDF(inputPath, 9 * KB * KB); // Split file to be under 9MB
    console.log('PDF split successfully');
  } catch (err) {
    console.error(err);
  }
})();
```


### Combine Compression and Splitting

You can combine both functions to first compress the pages and then split the PDF file if necessary.

```js
const { compressPDF, splitPDF } = require('./index');
const path = require('path');

const inputPath = path.join(__dirname, 'path-to-your-pdf.pdf');
const KB = 1024;

(async () => {
  try {
    await compressPDF(inputPath, 900 * KB); // Compress pages to be under 900KB each
    console.log('PDF pages compressed successfully');

    await splitPDF(inputPath, 9 * KB * KB); // Split file to be under 9MB
    console.log('PDF split successfully');
  } catch (err) {
    console.error(err);
  }
})();
```


## Notes 
- Ensure Ghostscript is installed and accessible from your command line. Verify by running `gs --version` (Linux) or `gswin64c --version` / `gswin32c --version` (Windows). 
- Adjust the paths and size limits (`maxPageSize` for `compressPDF` and `maxFileSize` for `splitPDF`) as per your requirements.
