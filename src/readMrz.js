

import mrzOcr from './internal/mrzOcr.js';
import * as roiOptions from './roiOptions.js';

async function readMrz(image, options = {}) {
  var { ocrResult, mask, rois } = await mrzOcr(image, roiOptions);

  if (options.saveName) {
    mask.save(options.saveName);
  }

  return { rois, mrz: ocrResult };
}

export default readMrz;
