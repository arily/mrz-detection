const mrzOcr = require('./internal/mrzOcr.js');
const roiOptions = require('./roiOptions.js');

async function readMrz(image, options = {}) {
  const { ocrResult, mask, rois } = await mrzOcr(image, roiOptions);

  if (options.saveName) {
    mask.save(options.saveName);
  }

  return { rois, mrz: ocrResult };
}

module.exports = readMrz;

