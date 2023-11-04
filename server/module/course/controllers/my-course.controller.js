const Joi = require('joi');
const { complete } = require('../../booking/services/Appointment');
exports.findOne = async (req, res, next) => {
  try {
    const id = req.params.id;
    if (!id) {
      return next(PopulateResponse.validationError());
    }
    const query = { _id: id, userId: req.user._id };
    const myCourse = await DB.MyCourse.findOne(query)
      .populate('transaction')
      .populate({ path: 'course', populate: { path: 'videoIntroduction' } })
      .populate('category');
    if (!myCourse) {
      return res.status(404).send(PopulateResponse.notFound());
    }

    req.myCourse = myCourse;
    res.locals.course = myCourse;
    return next();
  } catch (e) {
    return next(e);
  }
};

exports.list = async (req, res, next) => {
  const page = Math.max(0, req.query.page - 1) || 0; // using a zero-based page index for use with skip()
  const take = parseInt(req.query.take, 10) || 10;

  try {
    const query = Helper.App.populateDbQuery(req.query, {
      text: ['name'],
      equal: ['paid', 'isCompleted']
    });
    query.userId = req.user._id;
    if (req.query.categoryIds) {
      const categoryIds = req.query.categoryIds.split(',');
      query.categoryIds = { $in: categoryIds };
    }
    const sort = Helper.App.populateDBSort(req.query);
    const count = await DB.MyCourse.count(query);
    let items = await DB.MyCourse.find(query)
      .populate('transaction')
      .populate({ path: 'course', populate: { path: 'tutor', select: 'name' } })
      .populate('category')
      .sort(sort)
      .skip(page * take)
      .limit(take)
      .exec();

    if (items && items.length > 0) {
      items = await Promise.all(
        items.map(async item => {
          const data = item.toObject();
          data.completedPercent = 0;
          if (item.lectureMediaIdsCompleted.length) {
            const courseLectures = await DB.Lecture.find({ courseId: item.courseId });
            let countMedia = 0;
            if (courseLectures.length) {
              courseLectures.forEach(element => {
                countMedia += element.totalMedia;
              });
            }
            const completedPercent = Math.ceil((item.lectureMediaIdsCompleted.length / countMedia) * 100);
            data.completedPercent = completedPercent;
          }
          return data;
        })
      );
    }

    res.locals.list = { count, items };
    next();
  } catch (e) {
    next(e);
  }
};

exports.listSection = async (req, res, next) => {
  const page = Math.max(0, req.query.page - 1) || 0; // using a zero-based page index for use with skip()
  const take = parseInt(req.query.take, 10) || 10;

  try {
    const query = {};
    const id = req.params.id;
    query.courseId = id;
    if (!query.courseId) {
      return next(PopulateResponse.error({ message: 'Missing params' }));
    }
    const sort = Helper.App.populateDBSort(req.query);
    const count = await DB.Section.count(query);
    let items = await DB.Section.find(query)
      .populate({ path: 'lectures', populate: { path: 'media' } })
      .sort(sort)
      .skip(page * take)
      .limit(take)
      .exec();

    res.locals.sections = { count, items };
    next();
  } catch (e) {
    next(e);
  }
};

exports.remove = async (req, res, next) => {
  try {
    await req.myCourse.remove();
    res.locals.remove = {
      message: 'Course is deleted'
    };
    next();
  } catch (e) {
    next(e);
  }
};

exports.updateProgress = async (req, res, next) => {
  const validateSchema = Joi.object().keys({
    lectureMediaId: Joi.string().required()
  });
  try {
    const id = req.params.id;
    if (!id) {
      return next(PopulateResponse.error({ message: 'Missing params' }));
    }
    const validate = Joi.validate(req.body, validateSchema);
    if (validate.error) {
      return next(PopulateResponse.validationError(validate.error));
    }
    await DB.MyCourse.update({ _id: id }, { $addToSet: { lectureMediaIdsCompleted: { $each: [validate.value.lectureMediaId] } } });
    res.locals.updateProgress = { success: true };
    return next();
  } catch (e) {
    next(e);
  }
};

exports.complete = async (req, res, next) => {
  try {
    await DB.MyCourse.update(
      { _id: req.myCourse._id },
      {
        isCompleted: true,
        completedAt: new Date()
      }
    );

    if (req.user.notificationSettings)
      await Service.Mailer.send('course/complete-course.html', req.user.email, {
        subject: 'Congratulations! - You have completed your course !',
        userName: req.user.name,
        myCourse: req.myCourse,
        date: new Date(),
        appName: process.env.APP_NAME
      });

    res.locals.complete = req.myCourse;
    return next();
  } catch (e) {
    next(e);
  }
};

exports.findOneByCourseId = async (req, res, next) => {
  try {
    const id = req.params.courseId;
    if (!id) {
      return next(PopulateResponse.validationError());
    }
    const query = { courseId: id, userId: req.user._id };
    const myCourse = await DB.MyCourse.findOne(query)
      .populate('transaction')
      .populate({ path: 'course', populate: { path: 'videoIntroduction' } })
      .populate('category');
    if (!myCourse) {
      return res.status(404).send(PopulateResponse.notFound());
    }
    res.locals.byCourseId = myCourse;
    return next();
  } catch (e) {
    return next(e);
  }
};
