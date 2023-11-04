const lessonQ = require('./queue');
exports.services = {
  LessonSpace: require('./services/LessonSpace')
};

exports.router = router => {
  require('./routes/lesson-space.route')(router);
};

async function appointmentLog(req, res, next) {
  try {
    const event = req.headers['x-webhook-event'];
    const data = req.body;
    const time = req.headers['x-webhook-timestamp'];
    if (event) {
      await lessonQ.createSessionLog(event, Object.assign(data, { time }));
    }
    return next();
  } catch (e) {
    return next(e);
  }
}
exports.middleware = {
  appointmentLog
};
