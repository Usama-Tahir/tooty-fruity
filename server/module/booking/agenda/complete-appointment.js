const moment = require('moment');

/**
 * Fake service!
 * Do complete cause we did not setup callhook yet
 */
module.exports = async (job, done) => {
  try {
    const appointments = await DB.Appointment.find({
      status: 'progressing',
      meetingEnd: true
    })
      .populate({ path: 'topic', select: '_id name alias' })
      .populate({ path: 'webinar', select: '_id name price alias' });
    if (appointments && appointments.length > 0) {
      await Promise.all(
        appointments.map(async appointment => {
          if (moment().isSameOrAfter(moment(appointment.toTime).toDate())) {
            await Service.Appointment.complete(appointment);
          }
        })
      );
    }
    done();
  } catch (e) {
    await Service.Logger.create({
      level: 'error',
      path: 'complete-appointment',
      error: e
    });
    done();
  }
};
