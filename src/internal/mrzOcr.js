// @ts-check
import { getLinesFromImage } from 'ocr-tools';

import { predictImages } from '../svm.js';

async function mrzOcr(image, roiOptions = {}) {
  roiOptions = Object.assign({}, { method: 'svm' }, roiOptions);
  let { lines, mask, painted, averageSurface } = getLinesFromImage(
    image,
    roiOptions
  );


  // A line should have at least 5 ROIS (swiss driving license)
  lines = lines.filter((line) => line.rois.length > 5);


  const result = await ocrLines(lines, {image, mask, painted, averageSurface});
  return result
}

async function ocrLines(lines, ctx) {
  const {image, mask, painted, averageSurface} = ctx;
  if (!lines.length) {
    throw new Error('No lines found');
  }

  
  /**
   * Description placeholder
   *
   * @type {{
    image: IJS.Image,
    width: number,
    height: number,
    line: number,
    column: number,
    predicted?: string
   }[]}
   */
  const rois = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    for (let j = 0; j < line.rois.length; j++) {
      const roi = line.rois[j];
      rois.push({
        image: image.crop({
          x: roi.minX,
          y: roi.minY,
          width: roi.width,
          height: roi.height
        }),
        width: roi.width,
        height: roi.height,
        line: i,
        column: j
      });
    }
  }


  
  /** @type {number[]} */
  let predicted = await predictImages(rois.map((roi) => roi.image), 'ESC-v2');

  const toString = predicted.map((p) => String.fromCharCode(p));
  toString.forEach((p, idx) => {
    rois[idx].predicted = p;
  });
  let count = 0;

  let ocrResult = [];
  for (let line of lines) {
    let lineText = '';
    for (let i = 0; i < line.rois.length; i++) {
      lineText += toString[count++];
    }
    ocrResult.push(lineText);
  }


  return {
    rois,
    ocrResult,
    mask,
    painted,
    averageSurface
  };
}

export default mrzOcr;
