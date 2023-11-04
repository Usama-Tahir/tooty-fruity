exports.hook = async (req, res, next) => {
  try {
    const event = req.headers['x-webhook-event'];
    const data = req.body;
    const timestamp = req.headers['x-webhook-timestamp'];
    if (event === 'webhooks.session.start') {
      await Service.Appointment.startMeeting(Object.assign(data, { timestamp }));
    }

    if (event === 'webhooks.session.end') {
      await Service.Appointment.endMeeting(Object.assign(data, { timestamp }));
    }

    res.locals.hook = {
      success: true
    };
    return next();
  } catch (e) {
    console.log(e);
    next(e);
  }
};
