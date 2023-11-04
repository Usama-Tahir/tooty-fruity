const moment = require('moment');
const date = require('../../date');
const availableTimeTutorQ = require('../../tutor/available-time-queue');

exports.create = async data => {
  try {
    const recurring = new DB.RecurringSchedule(data);
    await recurring.save();
    return recurring;
  } catch (error) {
    console.log(error);
    throw error;
  }
};

const getDayOfRange = async (range, dayOfWeeks, timezone) => {
  try {
    let daysArray = [];
    let currentDate = timezone ? moment(range.start).tz(timezone) : moment(range.start);
    const endDate = timezone ? moment(range.end).tz(timezone) : moment(range.end);
    while (moment(currentDate).isBefore(endDate)) {
      if (dayOfWeeks.includes(currentDate.get('day'))) {
        daysArray.push(currentDate.toDate());
      }
      currentDate = moment(currentDate).add(1, 'days');
    }
    return daysArray;
  } catch (error) {
    throw error;
  }
};

exports.createRecurringSlots = async recurring => {
  try {
    const { tutorId, start, end, range, dayOfWeek, _id: recurringId } = recurring;
    const tutor = await DB.User.findOne({ _id: tutorId });
    const dayGetFromRange = await getDayOfRange(range, dayOfWeek, tutor.timezone);
    const slots = [];
    const overlapSlots = [];
    const startHour = moment(start, 'HH:mm').toDate().getHours();
    const startMinute = moment(start, 'HH:mm').toDate().getMinutes();
    const endHour = moment(end, 'HH:mm').toDate().getHours();
    const endMinute = moment(end, 'HH:mm').toDate().getMinutes();
    let toHour = endHour === 0 ? endHour + 24 : endHour;
    for (let day of dayGetFromRange) {
      const startDay = moment(day).tz(tutor.timezone).toDate();
      const startTime = moment(startDay).add(startHour, 'hours').add(startMinute, 'minutes').toDate();
      const toTime = moment(startDay).add(toHour, 'hours').add(endMinute, 'minutes').toDate();
      // const isDTS = date.isDTS(startTime, tutor.timezone);
      // const dtsStartTime = isDTS ? date.formatFromDTS(startTime, tutor.timezone) : startTime;
      // const dtsToTime = isDTS ? date.formatFromDTS(toTime, tutor.timezone) : toTime;
      const isOverlap = await this.isOverlap(tutorId, startTime, toTime);
      if (isOverlap) overlapSlots.push({ startTime, toTime });
      else {
        const slot = new DB.Schedule({
          tutorId: tutorId,
          startTime,
          toTime,
          type: 'subject', // should apply for webinar too
          isFree: recurring.isFree,
          startTime,
          toTime,
          recurringId
        });
        await slot.save();
        await availableTimeTutorQ.addAvailableTime(slot);
        slots.push(slot);
      }
    }
    return { slots, overlapSlots };
  } catch (e) {
    throw e;
  }
};

exports.isOverlap = async (tutorId, startTime, toTime) => {
  try {
    const count = await DB.Schedule.count({
      tutorId,
      $or: [
        {
          startTime: {
            $gte: moment(startTime).toDate(),
            $lt: moment(toTime).toDate()
          }
        },
        {
          toTime: {
            $gt: moment(startTime).toDate(),
            $lte: moment(toTime).toDate()
          }
        },
        {
          startTime: {
            $gt: moment(startTime).toDate()
          },
          toTime: {
            $lt: moment(toTime).toDate()
          }
        }
      ]
    });
    return count > 0;
  } catch (e) {
    throw e;
  }
};

exports.removeSlot = async recurring => {
  try {
    const slotCreatedByRecurring = await DB.Schedule.find({
      recurringId: recurring._id
    });

    if (slotCreatedByRecurring.length > 0) {
      for (const item of slotCreatedByRecurring) {
        const booked = await DB.Appointment.count({
          startTime: moment(item.startTime).toDate(),
          toTime: moment(item.toTime).toDate(),
          paid: true,
          status: {
            $in: ['progressing', 'booked', 'pending', 'completed']
          },
          targetType: {
            $ne: 'webinar'
          },
          tutorId: recurring.tutorId
        });

        if (!booked) {
          await item.remove();
        }
      }
    }
    return true;
  } catch (e) {
    throw e;
  }
};
