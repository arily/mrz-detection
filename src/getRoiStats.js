

import { getNumberToLetterHeightRatio } from './util/rois.js';

export default function getRoiStats(rois) {
  return {
    numberToLetterHeightRatio: getNumberToLetterHeightRatio(rois)
  };
};
