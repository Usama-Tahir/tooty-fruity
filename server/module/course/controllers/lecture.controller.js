const Joi = require('joi');
const _ = require('lodash');
const validateSchema = Joi.object().keys({
  courseId: Joi.string().required(),
  sectionId: Joi.string().required(),
  title: Joi.string().required(),
  description: Joi.string().allow([null, '']).optional(),
  ordering: Joi.number().allow([null, '']).optional(),
  preview: Joi.boolean().allow([null, '']).optional(),
  mediaIds: Joi.array().items(Joi.string()).optional(),
  hashLecture: Joi.string().allow([null, '']).optional()
});

exports.findOne = async (req, res, next) => {
  try {
    const id = req.params.id || req.params.lectureId || req.body.lectureId;
    if (!id) {
      return next(PopulateResponse.validationError());
    }
    const query = Helper.App.isMongoId(id) ? { _id: id } : { alias: id };
    let lecture = await DB.Lecture.findOne(query)
      .populate('section')
      .populate({ path: 'medias', populate: { path: 'media' } });
    if (!lecture) {
      return res.status(404).send(PopulateResponse.notFound());
    }
    req.lecture = lecture;
    res.locals.data = lecture;
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
    const lecture = new DB.Lecture(validate.value);

    await DB.Section.update(
      {
        _id: lecture.sectionId
      },
      {
        $addToSet: {
          lectureIds: lecture._id
        },
        $inc: {
          totalLecture: 1
        }
      }
    );
    lecture.mediaIds = [];
    lecture.totalMedia = 0;
    const medias = await DB.LectureMedia.find({ hashLecture: lecture.hashLecture });
    medias.map(async item => {
      lecture.mediaIds.push(item._id);
      lecture.totalMedia++;
    });
    await DB.LectureMedia.updateMany({ hashLecture: lecture.hashLecture }, { lectureId: lecture._id });
    await lecture.save();
    res.locals.create = lecture;
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

    req.lecture.totalMedia = req.body.mediaIds.length;
    Object.assign(req.lecture, validate.value);
    await req.lecture.save();
    res.locals.update = req.lecture;
    return next();
  } catch (e) {
    return next(e);
  }
};

exports.remove = async (req, res, next) => {
  try {
    await req.lecture.remove();
    await DB.Section.update(
      {
        _id: req.lecture.sectionId
      },
      {
        $pull: {
          lectureIds: req.lecture._id
        },
        $inc: {
          totalLecture: -1
        }
      }
    );
    await DB.MyCourse.updateMany(
      {
        courseId: req.lecture.courseId,
        lectureIdsCompleted: { $in: [req.lecture._id] }
      },
      {
        $pull: {
          lectureIdsCompleted: req.lecture._id
        }
      }
    );
    res.locals.remove = {
      message: 'Section is deleted'
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
      equal: ['sectionId']
    });

    if (!query.sectionId) {
      return next(PopulateResponse.error({ message: 'Missing params' }));
    }

    const sort = Helper.App.populateDBSort(req.query);
    const count = await DB.Lecture.count(query);
    let items = await DB.Lecture.find(query)
      .populate({ path: 'medias', populate: { path: 'media' } })
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
