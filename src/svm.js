'use strict';
const path = require('path');

const fs = require('fs-extra');
const hog = require('hog-features');
const SVMPromise = Promise.resolve(require('libsvm-js/wasm'));
const Kernel = require('ml-kernel');
const range = require('lodash.range');
const uniq = require('lodash.uniq');
const BSON = require('bson');

const kernel = new Kernel('linear');

let SVM;
function extractHOG(image) {
  image = image.scale({ width: 20, height: 20 });
  image = image.pad({
    size: 2
  });
  let optionsHog = {
    cellSize: 5,
    blockSize: 2,
    blockStride: 1,
    bins: 4,
    norm: 'L2'
  };
  let hogFeatures = hog.extractHOG(image, optionsHog);
  return hogFeatures;
}

// Get descriptors for images from 1 identity card
function getDescriptors(images) {
  const result = [];
  for (let image of images) {
    result.push(extractHOG(image));
  }

  const heights = images.map((img) => img.height);
  const maxHeight = Math.max.apply(null, heights);
  const minHeight = Math.min.apply(null, heights);
  for (let i = 0; i < images.length; i++) {
    const img = images[i];
    let bonusFeature = 1;
    if (minHeight !== maxHeight) {
      bonusFeature = (img.height - minHeight) / (maxHeight - minHeight);
    }
    result[i].push(bonusFeature);
  }
  return result;
}

function predictImages(images, modelName) {
  const Xtest = getDescriptors(images);
  return applyModel(modelName, Xtest);
}

async function applyModel(name, Xtest) {
  await loadSVM();
  const { descriptors: descriptorsPath, model: modelPath } = getFilePath(name);
  const bson = new BSON();
  const Xtrain = bson.deserialize(await fs.readFile(descriptorsPath))
    .descriptors;
  const model = await fs.readFile(modelPath, 'utf-8');
  const classifier = SVM.load(model);
  const prediction = predict(classifier, Xtrain, Xtest);
  return prediction;
}

async function createModel(letters, name) {
  const { descriptors: descriptorsPath, model: modelPath } = getFilePath(name);
  const { descriptors, classifier } = await train(letters);
  const bson = new BSON();
  await fs.writeFile(descriptorsPath, bson.serialize({ descriptors }));
  await fs.writeFile(modelPath, classifier.serializeModel());
}

function predict(classifier, Xtrain, Xtest) {
  const Ktest = kernel
    .compute(Xtest, Xtrain)
    .addColumn(0, range(1, Xtest.length + 1));
  return classifier.predict(Ktest);
}

async function train(letters, SVMOptions) {
  await loadSVM();

  let SVMOptionsOneClass = {
    type: SVM.SVM_TYPES.ONE_CLASS,
    kernel: SVM.KERNEL_TYPES.PRECOMPUTED,
    // cost: 0.1,
    nu: 0.5,
    // gamma: 0.1,
    quiet: true
  };

  let SVMNormalOptions = {
    type: SVM.SVM_TYPES.C_SVC,
    kernel: SVM.KERNEL_TYPES.PRECOMPUTED,
    quiet: true
  };

  const Xtrain = letters.map((s) => s.descriptor);
  const Ytrain = letters.map((s) => s.label);

  const uniqLabels = uniq(Ytrain);
  if (uniqLabels.length === 1) {
    // eslint-disable-next-line no-console
    console.log('training mode: ONE_CLASS');
    SVMOptions = Object.assign({}, SVMOptionsOneClass, SVMOptions);
  } else {
    SVMOptions = Object.assign({}, SVMNormalOptions, SVMOptions);
  }

  let oneClass = SVMOptions.type === SVM.SVM_TYPES.ONE_CLASS;

  var classifier = new SVM(SVMOptions);

  const KData = kernel
    .compute(Xtrain)
    .addColumn(0, range(1, Ytrain.length + 1));
  classifier.train(KData, Ytrain);
  return { classifier, descriptors: Xtrain, oneClass };
}

function getFilePath(name) {
  const dataDir = path.join(__dirname, '../models');
  const fileBase = path.join(dataDir, name);
  return {
    descriptors: `${fileBase}.svm.descriptors`,
    model: `${fileBase}.svm.model`
  };
}

async function loadSVM() {
  SVM = await SVMPromise;
}

module.exports = {
  applyModel,
  createModel,
  train,
  predict,
  extractHOG,
  predictImages
};
