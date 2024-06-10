const path = require('path');
const { compressPDF, splitPDF } = require('./index');

const inputPath = path.join(__dirname, 'ex-contratos', '3totalMaior10MbpaginasMaiores10Mb.pdf');
const KB = 1024;

(async () => {
  try {
    await compressPDF(inputPath, 900 * KB);
    console.log('PDF pages compressed successfully');

    await splitPDF(inputPath, 9 * KB * KB);
    console.log('PDF split successfully');
  } catch (err) {
    console.error(err);
  }
})();
