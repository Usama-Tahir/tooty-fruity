const Joi = require('joi');
const _ = require('lodash');
const validateSchema = Joi.object().keys({
  courseId: Joi.string().required(),
  title: Joi.string().required(),
  description: Joi.string().allow([null, '']).optional(),
  ordering: Joi.number().allow([null, '']).optional(),
  trialVideoId: Joi.string().allow([null, '']).optional()
});

exports.findOne = async (req, res, next) => {
  try {
    const id = req.params.id || req.params.sectionId || req.body.sectionId;
    if (!id) {
      return next(PopulateResponse.validationError());
    }
    const query = Helper.App.isMongoId(id) ? { _id: id } : { alias: id };
    let section = await DB.Section.findOne(query).populate('course').populate('lectures').populate('trialVideo');
    if (!section) {
      return res.status(404).send(PopulateResponse.notFound());
    }
    req.section = section;
    res.locals.data = section;
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
    const section = new DB.Section(validate.value);
    await section.save();
    await DB.Course.update(
      { _id: section.courseId },
      {
        $inc: { totalSection: 1 }
      }
    );
    const data = section.toObject();
    if (section.trialVideoId) {
      const trialVideo = await DB.Media.findOne({ _id: section.trialVideoId });
      if (trialVideo) {
        data.trialVideo = trialVideo;
      }
    }
    res.locals.create = data;
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
    Object.assign(req.section, validate.value);
    await req.section.save();
    const sectionObject = req.section.toObject();
    if (req.section.trialVideoId) {
      const trialVideo = await DB.Media.findOne({
        _id: req.section.trialVideoId
      });
      if (trialVideo) {
        sectionObject.trialVideo = trialVideo;
      }
    }
    res.locals.update = sectionObject;
    return next();
  } catch (e) {
    return next(e);
  }
};

exports.remove = async (req, res, next) => {
  try {
    await req.section.remove();
    await DB.Course.update(
      { _id: req.section.courseId },
      {
        $inc: { totalSection: -1 }
      }
    );
    await DB.Lecture.deleteMany({ sectionId: req.section._id });
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
      equal: ['courseId']
    });
    if (!query.courseId) {
      return next(PopulateResponse.error({ message: 'Missing params' }));
    }

    const sort = Helper.App.populateDBSort(req.query);
    const count = await DB.Section.count(query);
    let canPopulateMedia = false;
    if (req.user) {
      const booked = await DB.Transaction.count({ targetId: query.courseId, userId: req.user._id, paid: true });
      const courseByTutor = await DB.Course.count({ _id: query.courseId, tutorId: req.user._id });
      if (req.user.role === 'admin' || booked || courseByTutor) {
        canPopulateMedia = true;
      }
    }

    const populate = canPopulateMedia
      ? { path: 'lectures', populate: { path: 'medias', populate: { path: 'media' } } }
      : { path: 'lectures', populate: { path: 'medias', populate: { path: 'media', select: 'name duration' } } };
    let items = await DB.Section.find(query)
      .populate(populate)
      .populate('trialVideo')
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
