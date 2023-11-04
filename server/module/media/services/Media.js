const Image = require('../components/image');
const Q = require('../queue');
const fs = require('fs');
const path = require('path');

exports.createPhoto = async options => {
  try {
    const file = options.file;
    const value = options.value;
    const user = options.user;
    const thumbPath = await Image.resize({
      input: file.path,
      width: process.env.PHOTO_THUMB_WIDTH || 250,
      height: process.env.PHOTO_THUMB_HEIGHT || 250,
      background: process.env.PHOTO_RESIZE_BACKGROUND_COLOR
    });
    const mediumPath = await Image.resize({
      input: file.path,
      width: process.env.PHOTO_MEDIUM_WIDTH || 600,
      height: process.env.PHOTO_MEDIUM_HEIGHT || 600,
      background: process.env.PHOTO_RESIZE_BACKGROUND_COLOR
    });
    const photo = new DB.Media({
      type: 'photo',
      systemType: value.systemType,
      name: value.name || file.filename,
      mimeType: file.mimetype,
      description: value.description,
      uploaderId: user._id,
      ownerId: user.role === 'admin' && value.ownerId ? value.ownerId : user._id,
      categoryIds: value.categoryIds,
      originalPath: file.path,
      filePath: file.path,
      thumbPath,
      mediumPath,
      convertStatus: 'done',
      uploaded: process.env.USE_S3 !== 'true'
    });
    await photo.save();

    if (!photo.uploaded && process.env.USE_S3 === 'true') {
      await Q.uploadS3(photo);
    }

    return photo;
  } catch (e) {
    throw e;
  }
};

exports.createVideo = async options => {
  try {
    const file = options.file;
    const value = options.value;
    const user = options.user;
    const video = new DB.Media({
      type: 'video',
      systemType: value.systemType,
      name: value.name || file.filename,
      mimeType: file.mimetype,
      description: value.description,
      uploaderId: user._id,
      ownerId: user.role === 'admin' && value.ownerId ? value.ownerId : user._id,
      categoryIds: value.categoryIds,
      filePath: file.path,
      originalPath: file.path,
      convertStatus: 'processing',
      uploaded: process.env.USE_S3 !== 'true'
    });
    await video.save();

    // TODO - define me here
    await Q.convertVideo(video);

    return video;
  } catch (e) {
    throw e;
  }
};

exports.createAudio = async options => {
  try {
    const file = options.file;
    const value = options.value;
    const user = options.user;
    const audio = new DB.Media({
      type: 'audio',
      systemType: value.systemType,
      name: value.name || file.filename,
      mimeType: file.mimetype,
      description: value.description,
      uploaderId: user._id,
      ownerId: user.role === 'admin' && value.ownerId ? value.ownerId : user._id,
      categoryIds: value.categoryIds,
      filePath: file.path,
      originalPath: file.path,
      convertStatus: 'processing',
      uploaded: process.env.USE_S3 !== 'true'
    });
    await audio.save();

    // TODO - define me here
    await Q.convertAudio(audio);

    return audio;
  } catch (e) {
    throw e;
  }
};

exports.createFile = async options => {
  try {
    const file = options.file;
    const value = options.value;
    const user = options.user;
    const media = new DB.Media({
      type: 'file',
      systemType: value.systemType,
      name: value.name || file.filename,
      mimeType: file.mimetype,
      description: value.description,
      uploaderId: user._id,
      ownerId: user.role === 'admin' && value.ownerId ? value.ownerId : user._id,
      categoryIds: value.categoryIds,
      originalPath: file.path,
      filePath: file.path,
      convertStatus: 'done',
      uploaded: process.env.USE_S3 !== 'true'
    });
    await media.save();

    if (!media.uploaded && process.env.USE_S3 === 'true') {
      await Q.uploadS3(media);
    }

    return media;
  } catch (e) {
    throw e;
  }
};

exports.createFileWithoutOwner = async options => {
  try {
    const file = options.file;
    const value = options.value;
    const media = new DB.Media({
      type: 'file',
      systemType: value.systemType,
      name: value.name || file.filename,
      mimeType: file.mimetype,
      description: value.description,
      categoryIds: value.categoryIds,
      originalPath: file.path,
      filePath: file.path,
      convertStatus: 'done',
      uploaded: process.env.USE_S3 !== 'true'
    });
    await media.save();

    if (!media.uploaded && process.env.USE_S3 === 'true') {
      await Q.uploadS3(media);
    }

    return media;
  } catch (e) {
    throw e;
  }
};

exports.createVideoWithoutOwner = async options => {
  try {
    const file = options.file;
    const value = options.value;
    const video = new DB.Media({
      type: 'video',
      systemType: value.systemType,
      name: value.name || file.filename,
      mimeType: file.mimetype,
      description: value.description,
      categoryIds: value.categoryIds,
      filePath: file.path,
      originalPath: file.path,
      convertStatus: 'processing',
      uploaded: process.env.USE_S3 !== 'true'
    });
    await video.save();

    // TODO - define me here
    await Q.convertVideo(video);

    return video;
  } catch (e) {
    throw e;
  }
};

exports.removeFile = async fileId => {
  try {
    const media = await DB.Media.findOne({ _id: fileId });
    if (!media) {
      throw new Error('File not found');
    }
    await media.remove();
    if (media.filePath && fs.existsSync(path.resolve(media.filePath))) {
      fs.unlinkSync(path.resolve(media.filePath));
    }
    if (media.thumbPath && fs.existsSync(path.resolve(media.thumbPath))) {
      fs.unlinkSync(path.resolve(media.thumbPath));
    }
    if (media.mediumPath && fs.existsSync(path.resolve(media.mediumPath))) {
      fs.unlinkSync(path.resolve(media.mediumPath));
    }
    return true;
  } catch (e) {
    throw e;
  }
};
