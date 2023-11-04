const Joi = require('joi');
const moment = require('moment');

exports.create = async (req, res, next) => {
  try {
    const validateSchema = Joi.object().keys({
      start: Joi.string().required(),
      end: Joi.string().required(),
      range: Joi.object({
        start: Joi.string().required(),
        end: Joi.string().required()
      }).required(),
      dayOfWeek: Joi.array().items(Joi.number()).required(),
      isFree: Joi.boolean().allow([null, '']).optional().default(false)
    });
    const validate = Joi.validate(req.body, validateSchema);
    if (validate.error) {
      return next(PopulateResponse.validationError(validate.error));
    }

    const recurring = await Service.RecurringSchedule.create(Object.assign(validate.value, { tutorId: req.user._id }));
    const dataSlots = await Service.RecurringSchedule.createRecurringSlots(recurring);
    res.locals.create = { recurring, dataSlots };
    return next();
  } catch (e) {
    return next(e);
  }
};

exports.findOne = async (req, res, next) => {
  try {
    const id = req.params.id;
    if (!id) {
      return next(PopulateResponse.validationError());
    }
    const recurring = await DB.RecurringSchedule.findOne({ _id: id });
    if (!recurring) {
      return res.status(404).send(PopulateResponse.notFound());
    }

    req.recurring = recurring;
    res.locals.recurring = recurring;
    next();
  } catch (e) {
    return next(e);
  }
};

exports.createSlotByRecurring = async (req, res, next) => {
  try {
    const id = req.params.id || req.params.recurringId;
    if (!id) {
      return next(PopulateResponse.validationError());
    }
    const query = { _id: id };

    const recurring = await DB.RecurringSchedule.findOne(query);
    if (!recurring) {
      return res.status(404).send(PopulateResponse.notFound());
    }

    const data = await Service.RecurringSchedule.createRecurringSlots(recurring);
    res.locals.createSlot = data;
    return next();
  } catch (error) {
    throw error;
  }
};

exports.getListRecurring = async (req, res, next) => {
  try {
    const page = Math.max(0, req.query.page - 1) || 0; // using a zero-based page index for use with skip()
    const take = parseInt(req.query.take, 10) || 10;
    const sort = Helper.App.populateDBSort(req.query);
    const query = Helper.App.populateDbQuery(req.query, {
      boolean: ['isFree']
    });
    query.tutorId = req.user._id;
    const count = await DB.RecurringSchedule.count(query);
    const items = await DB.RecurringSchedule.find(query)
      .sort(sort)
      .skip(page * take)
      .limit(take)
      .exec();
    res.locals.listRecurring = { count, items };
    next();
  } catch (error) {
    return next(error);
  }
};

exports.remove = async (req, res, next) => {
  try {
    await req.recurring.remove();
    await Service.RecurringSchedule.removeSlot(req.recurring);
    res.locals.remove = {
      message: 'Recurring is deleted'
    };
    next();
  } catch (e) {
    next(e);
  }
};
