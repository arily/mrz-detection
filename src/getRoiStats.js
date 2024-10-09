const { getNumberToLetterHeightRatio } = require('./util/rois.js');

module.exports = function getRoiStats(rois) {
  return {
    numberToLetterHeightRatio: getNumberToLetterHeightRatio(rois)
  };
};

