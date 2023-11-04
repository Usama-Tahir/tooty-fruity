const Joi = require('joi');
const _ = require('lodash');
const validateSchema = Joi.object().keys({
  lectureId: Joi.string().allow(['', null]).optional(),
  hashLecture: Joi.string().allow(['', null]).optional(),
  mediaId: Joi.string().required(),
  totalLength: Joi.number().allow(['', null]).optional(),
  mediaType: Joi.string().required(),
  ordering: Joi.number().allow([null, '']).optional()
});

exports.findOne = async (req, res, next) => {
  try {
    const id = req.params.id || req.params.mediaId || req.body.mediaId;
    if (!id) {
      return next(PopulateResponse.validationError());
    }
    const query = Helper.App.isMongoId(id) ? { _id: id } : { alias: id };
    let lectureMedia = await DB.LectureMedia.findOne(query).populate('media');
    if (!lectureMedia) {
      return res.status(404).send(PopulateResponse.notFound());
    }
    req.media = lectureMedia;
    res.locals.data = lectureMedia;
    return next();
  } catch (e) {
    return next(e);
  }
};

exports.create = async (req, res, next) => {
  try {
    const validate = Joi.validate(req.body, validateSchema);
    if (validate.error) {
      return next(PopulateResponse.validationError(validate.error));
    }
    const media = new DB.LectureMedia(validate.value);
    await media.save();
    if (media.lectureId)
      await DB.Lecture.update(
        {
          _id: media.lectureId
        },
        {
          $addToSet: {
            mediaIds: media._id
          },
          $inc: {
            totalMedia: 1
          }
        }
      );
    const _media = await DB.LectureMedia.findOne({ _id: media._id }).populate('media');
    res.locals.create = _media;
    return next();
  } catch (e) {
    return next(e);
  }
};

exports.update = async (req, res, next) => {
  try {
    const validate = Joi.validate(req.body, validateSchema);
    if (validate.error) {
      return next(PopulateResponse.validationError(validate.error));
    }
    Object.assign(req.media, validate.value);
    await req.media.save();
    res.locals.update = req.media;
    return next();
  } catch (e) {
    return next(e);
  }
};

exports.remove = async (req, res, next) => {
  try {
    await req.media.remove();
    if (req.media.lectureId)
      await DB.Lecture.update(
        {
          _id: req.media.lectureId
        },
        {
          $pull: {
            mediaIds: req.media._id
          },
          $inc: {
            totalMedia: -1
          }
        }
      );

    res.locals.remove = {
      message: 'Lecture media is deleted'
    };
    next();
  } catch (e) {
    next(e);
  }
};

exports.list = async (req, res, next) => {
  const page = Math.max(0, req.query.page - 1) || 0; // using a zero-based page index for use with skip()
  const take = parseInt(req.query.take, 10) || 10;

  try {
    const query = Helper.App.populateDbQuery(req.query, {
      equal: ['lectureId']
    });

    if (!query.lectureId) {
      return next(PopulateResponse.error({ message: 'Missing params' }));
    }

    const sort = Helper.App.populateDBSort(req.query);
    const count = await DB.LectureMedia.count(query);
    let items = await DB.LectureMedia.find(query)
      .populate('media')
      .sort(sort)
      .skip(page * take)
      .limit(take)
      .exec();

    res.locals.list = { count, items };
    next();
  } catch (e) {
    next(e);
  }
};
