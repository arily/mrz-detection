const { resolve, dirname, join, basename, extname } = require('path');
const fs = require('fs-extra');
const { Image: IJS } = require('image-js');

const extensions = ['.png', '.jpeg', '.jpg'];

async function writeImages(images) {
  if (!Array.isArray(images)) {
    images = [images];
  }
  // eslint-disable-next-line no-await-in-loop
  for (let entry of images) {
    const { image, filePath, ...metadata } = entry;
    if (!image || !filePath) {
      throw new Error('image and filePath props are mandatory');
    }

    const baseDir = resolve(dirname(filePath));
    await fs.mkdirp(baseDir);
    const metadataPath = join(
      baseDir,
      basename(filePath).replace(extname(filePath), '.json')
    );

    await image.save(filePath);
    await fs.writeJson(metadataPath, metadata);
  }
}

async function readImages(dir) {
  const images = [];
  const files = await fs.readdir(dir);
  // eslint-disable-next-line no-await-in-loop
  for (let file of files) {
    const filePath = join(dir, file);
    const stat = await fs.stat(filePath);
    let metadata;
    if (stat.isFile()) {
      const ext = extname(filePath);
      if (!extensions.includes(ext.toLowerCase())) {
        continue;
      }
      const image = await IJS.load(filePath);
      try {
        metadata = await fs.readJson(
          join(dir, file.replace(ext, '.json'))
        );
      } catch (e) {
        metadata = {};
        // eslint-disable-next-line no-console
        console.log(`no metadata associated to ${filePath} found`);
      }
      metadata.filePath = filePath;
      images.push(
        Object.assign(metadata, {
          image,
          filePath
        })
      );
    } else {
      const dirImages = await readImages(filePath);
      for (let image of dirImages) {
        images.push(image);
      }
    }
  }
  return images;
}

module.exports = {
  readImages,
  writeImages
};

