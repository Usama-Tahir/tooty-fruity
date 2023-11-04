const Joi = require('joi');
const _ = require('lodash');
const validateSchema = Joi.object().keys({
  name: Joi.string().required(),
  categoryIds: Joi.array().items(Joi.string()).optional(),
  price: Joi.number().required(),
  description: Joi.string().allow([null, '']).optional(),
  mainImageId: Joi.string().required(),
  introductionVideoId: Joi.string().required(),
  alias: Joi.string().allow(['', null]).optional(),
  isFree: Joi.boolean().allow([null, '']).optional(),
  goalCourse: Joi.array().items(Joi.string()).optional(),
  whyJoinCourse: Joi.array().items(Joi.string()).optional(),
  needToJoinCourse: Joi.array().items(Joi.string()).optional(),
  tutorId: Joi.string().allow([null, '']).optional(),
  featured: Joi.boolean().allow([null]).optional(),
  gradeIds: Joi.array().items(Joi.string()).optional(),
  subjectIds: Joi.array().items(Joi.string()).allow([null, '']).optional(),
  topicIds: Joi.array().items(Joi.string()).allow([null, '']).optional(),
  age: Joi.object().keys({
    from: Joi.number(),
    to: Joi.number()
  })
});

exports.findOne = async (req, res, next) => {
  try {
    const id = req.params.id || req.params.courseId || req.body.courseId;
    if (!id) {
      return next(PopulateResponse.validationError());
    }
    const query = Helper.App.isMongoId(id) ? { _id: id } : { alias: id };
    let course = await DB.Course.findOne(query)
      .populate({ path: 'tutor', select: 'name avatarUrl username country featured ratingAvg totalRating avatar bio' })
      .populate({ path: 'categories', select: '_id name alias' })
      .populate({ path: 'mainImage', select: '_id name filePath thumbPath fileUrl thumbUrl convertStatus uploaded' })
      .populate({ path: 'videoIntroduction', select: '_id name filePath fileUrl convertStatus uploaded' })
      .populate({ path: 'subjects', select: '_id name alias' })
      .populate({ path: 'topics', select: '_id name alias' })
      .populate({
        path: 'coupon',
        select: '_id value type'
      })
      .populate({ path: 'grades', select: '_id name' });
    if (!course) {
      return res.status(404).send(PopulateResponse.notFound());
    }
    const data = course.toObject();
    data.isFavorite = false;
    if (req.user) {
      const favorite = await DB.Favorite.findOne({ userId: req.user._id, courseId: course._id });
      if (favorite) {
        data.isFavorite = true;
      }

      data.booked = false;
      const booked = await DB.Transaction.count({
        targetId: course._id,
        paid: true,
        targetType: 'course',
        $or: [{ userId: req.user._id }, { idRecipient: req.user._id }],
        status: {
          $in: ['completed', 'pending-refund', 'approved-refund']
        }
      });

      data.booked = booked > 0 ? true : false;
    }

    req.course = course;
    res.locals.course = data;
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
      boolean: ['approved', 'disabled', 'featured']
    });
    if (req.query.tutorId) {
      query.tutorId = req.query.tutorId;
    }
    if (req.query.categoryIds) {
      const categoryIds = req.query.categoryIds.split(',');
      query.categoryIds = { $in: categoryIds };
    }
    if (req.query.gradeIds) {
      const gradeIds = req.query.gradeIds.split(',');
      query.gradeIds = { $in: gradeIds };
    }
    if (req.query.subjectIds) {
      const subjectIds = req.query.subjectIds.split(',');
      query.subjectIds = { $in: subjectIds };
    }
    if (req.query.topicIds) {
      const topicIds = req.query.topicIds.split(',');
      query.topicIds = { $in: topicIds };
    }
    if (req.query.startTime && req.query.toTime) {
      query.availableTimeRange = {
        $elemMatch: {
          startTime: { $gte: req.query.startTime, $lte: req.query.toTime }
        }
      };
    }
    if (req.query.age) {
      const ageFilter = JSON.parse(req.query.age);
      query.$or = [
        {
          'age.from': {
            $gte: ageFilter.from,
            $lte: ageFilter.to
          }
        },
        {
          'age.from': {
            $gte: ageFilter.from
          },
          'age.to': {
            $lte: ageFilter.to
          }
        },
        {
          'age.from': {
            $lte: ageFilter.from
          },
          'age.to': {
            $gte: ageFilter.to
          }
        },
        {
          'age.to': {
            $gte: ageFilter.from,
            $lte: ageFilter.to
          }
        }
      ];
    }
    const sort = Helper.App.populateDBSort(req.query);
    const count = await DB.Course.count(query);
    let items = await DB.Course.find(query)
      .populate({ path: 'tutor', select: 'name avatarUrl username country featured ratingAvg totalRating avatar' })
      .populate({ path: 'categories', select: '_id name alias' })
      .populate({ path: 'mainImage', select: '_id name filePath thumbPath fileUrl thumbUrl convertStatus uploaded' })
      .populate({ path: 'videoIntroduction', select: '_id name filePath fileUrl convertStatus uploaded' })
      .populate({ path: 'grades', select: '_id name' })
      .sort(sort)
      .skip(page * take)
      .limit(take)
      .exec();

    if (req.user) {
      items = await Promise.all(
        items.map(async item => {
          const data = item.toObject();
          const favorite = await DB.Favorite.count({
            userId: req.user._id,
            courseId: item._id
          });
          data.isFavorite = favorite ? true : false;

          // Check user has purchased course
          const booked = await DB.Transaction.count({
            targetId: item._id,
            type: 'booking',
            paid: true,
            $or: [{ userId: req.user._id }, { idRecipient: req.user._id }],
            status: {
              $in: ['completed', 'pending-refund', 'approved-refund']
            }
          });
          data.booked = booked > 0 ? true : false;
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

exports.create = async (req, res, next) => {
  try {
    const validate = Joi.validate(req.body, validateSchema);
    if (validate.error) {
      return next(PopulateResponse.validationError(validate.error));
    }
    if (req.user.type === 'student' || req.user.type === 'parent') {
      return next(PopulateResponse.error({ message: 'You are not authorized' }));
    }
    if (req.user.role === 'admin' && !validate.value.tutorId) {
      return next(PopulateResponse.validationError());
    }
    let alias = req.body.alias ? Helper.String.createAlias(req.body.alias) : Helper.String.createAlias(req.body.name);
    const count = await DB.Course.count({ alias });
    if (count) {
      alias = `${alias}-${Helper.String.randomString(5)}`;
    }
    const course = new DB.Course(
      Object.assign(validate.value, {
        tutorId: req.user.role === 'admin' ? validate.value.tutorId : req.user._id,
        alias,
        approved: req.user.role === 'admin' ? true : false,
        createBy: req.user._id
      })
    );
    await course.save();
    if (course.categoryIds && course.categoryIds.length) {
      await DB.User.update(
        {
          _id: course.tutorId
        },
        { $addToSet: { categoryIds: { $each: course.categoryIds } } }
      );
    }
    await Service.Mailer.send('course/new-course-create.html', process.env.ADMIN_EMAIL, {
      subject: 'New Course Created',
      tutor: req.user.getPublicProfile(),
      course: course.toObject()
    });
    res.locals.create = course;
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
    if (req.user.type === 'student' || req.user.type === 'parent') {
      return next(PopulateResponse.error({ message: 'You are not authorized' }));
    }
    if (req.user.role === 'admin' && !validate.value.tutorId) {
      return next(PopulateResponse.validationError());
    }
    if (req.course.tutorId.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(404).send(
        PopulateResponse.error({
          message: 'You are not the creator of this course'
        })
      );
    }
    let alias = validate.value.alias ? Helper.String.createAlias(validate.value.alias) : Helper.String.createAlias(validate.value.name);
    const count = await DB.Course.count({
      alias,
      _id: { $ne: req.course._id }
    });
    if (count) {
      alias = `${alias}-${Helper.String.randomString(5)}`;
    }
    Object.assign(req.course, validate.value, { alias });
    await req.course.save();
    if (req.course.categoryIds && req.course.categoryIds.length) {
      await DB.User.update(
        {
          _id: req.course.tutorId
        },
        { $addToSet: { categoryIds: { $each: req.course.categoryIds } } }
      );
    }
    res.locals.update = req.course;
    return next();
  } catch (e) {
    return next(e);
  }
};

exports.remove = async (req, res, next) => {
  try {
    if (req.user.role !== 'admin' && req.course.tutorId.toString() !== req.user._id.toString()) {
      return res.status(404).send(
        PopulateResponse.error({
          message: 'You are not the creator of this course'
        })
      );
    }
    // TO DO => check user enrolled the course
    const enrolled = await DB.Transaction.count({ targetType: 'course', targetId: req.course._id, paid: true });
    if (enrolled > 0) {
      return next(
        PopulateResponse.error({
          message: 'Can not delete,already have users transaction this course'
        })
      );
    }
    await req.course.remove();
    if (req.course.categoryIds && req.course.categoryIds.length) {
      await DB.User.update(
        {
          _id: req.course.tutorId
        },
        { $pull: { categoryIds: { $in: req.course.categoryIds } } }
      );
    }
    res.locals.remove = {
      message: 'Course is deleted'
    };
    next();
  } catch (e) {
    next(e);
  }
};

exports.reject = async (req, res, next) => {
  try {
    await Service.Course.reject(req.params.courseId, req.body.reason);
    res.locals.reject = { success: true };
    return next();
  } catch (e) {
    return next(e);
  }
};

exports.approve = async (req, res, next) => {
  try {
    await Service.Course.approve(req.params.courseId);
    res.locals.approve = { success: true };
    return next();
  } catch (e) {
    return next(e);
  }
};

exports.disable = async (req, res, next) => {
  try {
    await Service.Course.disable(req.params.courseId);
    res.locals.disable = { success: true };
    return next();
  } catch (e) {
    return next(e);
  }
};

exports.enable = async (req, res, next) => {
  try {
    await Service.Course.enable(req.params.courseId);
    res.locals.enable = { success: true };
    return next();
  } catch (e) {
    return next(e);
  }
};

exports.transaction = async (req, res, next) => {
  const page = Math.max(0, req.query.page - 1) || 0; // using a zero-based page index for use with skip()
  const take = parseInt(req.query.take, 10) || 10;
  try {
    const query = {};
    query.tutorId = req.user._id;
    query.targetType = 'course';
    const sort = Helper.App.populateDBSort(req.query);
    const count = await DB.Transaction.count(query);
    let items = await DB.Transaction.find(query)
      .populate({ path: 'transaction', select: 'createdAt -_id' })
      .populate({ path: 'user', select: ' -_id name' })
      .sort(sort)
      .skip(page * take)
      .limit(take)
      .exec();
    items = await Promise.all(
      items.map(async item => {
        let target = null;
        if (item.targetId) {
          if (item.targetType === 'webinar') {
            target = await DB.Webinar.findOne({ _id: item.targetId }, { name: 1, alias: 1 });
          } else if (item.targetType === 'course') {
            target = await DB.Course.findOne({ _id: item.targetId }, { name: 1, alias: 1 });
          } else if (item.targetType === 'subject') {
            target = await DB.Subject.findOne({ _id: item.targetId }, { name: 1, alias: 1 });
          }
        }
        const data = item.toObject();
        data[item.targetType] = target;
        return data;
      })
    );
    res.locals.transaction = { count, items };
    return next();
  } catch (e) {
    return next(e);
  }
};

exports.transactionDetail = async (req, res, next) => {
  try {
    const id = req.params.id;
    if (!id) {
      return next(PopulateResponse.validationError());
    }
    const transaction = await DB.Transaction.findOne({ _id: id })
      .populate({ path: 'transaction', select: 'createdAt -_id' })
      .populate({ path: 'user', select: '_id name' });
    if (!transaction) {
      return res.status(404).send(PopulateResponse.notFound());
    }
    let target = null;
    const targetType = transaction.targetType;
    if (transaction.targetId) {
      if (targetType === 'webinar') {
        target = await DB.Webinar.findOne({ _id: transaction.targetId }, { name: 1, alias: 1 });
      } else if (targetType === 'course') {
        target = await DB.Course.findOne({ _id: transaction.targetId }, { name: 1, alias: 1 });
      } else if (targetType === 'subject') {
        target = await DB.Subject.findOne({ _id: transaction.targetId }, { name: 1, alias: 1 });
      }
    }
    const data = transaction.toObject();
    data[transaction.targetType] = target;
    res.locals.transactionDetail = data;
    return next();
  } catch (e) {
    return next(e);
  }
};

exports.enrolledUsers = async (req, res, next) => {
  const page = Math.max(0, req.query.page - 1) || 0;
  const take = parseInt(req.query.take, 10) || 10;
  try {
    const id = req.params.courseId;
    if (!id) {
      return next(PopulateResponse.validationError());
    }
    const query = { courseId: id, paid: true, targetType: 'course' };
    const sort = Helper.App.populateDBSort(query);
    const count = await DB.Transaction.count(query);
    const items = await DB.Transaction.find(query)
      .populate({ path: 'user', select: ' -_id name avatarUrl avatar' })
      .sort(sort)
      .skip(page * take)
      .limit(take)
      .exec();
    res.locals.enrolled = { count, items };
    return next();
  } catch (e) {
    return next(e);
  }
};
