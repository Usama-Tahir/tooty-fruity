const Queue = require('../../kernel/services/queue');
const lessonSpaceQ = Queue.create(`lesson-space-queue`);
const moment = require('moment');
const lessonEvent = {
  SESSION_START: 'webhooks.session.start',
  SESSION_IDLE: 'webhooks.session.idle',
  SESSION_END: 'webhooks.session.end',
  USER_JOIN: 'webhooks.user.join',
  USER_IDLE: 'webhooks.user.idle',
  USER_LEAVE: 'webhooks.user.leave'
};
lessonSpaceQ.process(async (job, done) => {
  const data = job.data.data;
  const event = job.data.event;
  try {
    const log = {};
    if (event === lessonEvent.SESSION_START) {
      log['event'] = event;
      log['description'] = `Session start at ${moment(data.time).toDate()}`;
      log['time'] = data.time;
      await DB.Appointment.update({ spaceSessionId: data.id }, { $addToSet: { logs: { $each: [log] } } });
    } else if (event === lessonEvent.SESSION_IDLE) {
      log['event'] = event;
      log['description'] = `Session idle at ${moment(data.time).toDate()}`;
      log['time'] = data.time;
      await DB.Appointment.update({ spaceSessionId: data.id }, { $addToSet: { logs: { $each: [log] } } });
    } else if (event === lessonEvent.SESSION_END) {
      log['event'] = event;
      log['description'] = `Session end at ${moment(data.time).toDate()}`;
      log['time'] = data.time;
      await DB.Appointment.update({ spaceSessionId: data.id }, { $addToSet: { logs: { $each: [log] } } });
    } else if (event === lessonEvent.USER_JOIN) {
      log['event'] = event;
      log['description'] = `User ${data.user.meta.name}(${data.user.id}) join at ${moment(data.time).toDate()}`;
      log['time'] = data.time;
      await DB.Appointment.update({ spaceSessionId: data.session.id }, { $addToSet: { logs: { $each: [log] } } });
    } else if (event === lessonEvent.USER_IDLE) {
      log['event'] = event;
      log['description'] = `User ${data.user.meta.name}(${data.user.id}) idle at ${moment(data.time).toDate()}`;
      log['time'] = data.time;
      await DB.Appointment.update({ spaceSessionId: data.session.id }, { $addToSet: { logs: { $each: [log] } } });
    } else if (event === lessonEvent.USER_LEAVE) {
      log['event'] = event;
      log['description'] = `User ${data.user.meta.name}(${data.user.id}) leave at ${moment(data.time).toDate()}`;
      log['time'] = data.time;
      await DB.Appointment.update({ spaceSessionId: data.session.id }, { $addToSet: { logs: { $each: [log] } } });
    }
    done();
  } catch (e) {
    await Service.Logger.create({
      level: 'error',
      error: e,
      path: 'lesson-space-hook-error'
    });
    done();
  }
});

exports.createSessionLog = (event, data) =>
  lessonSpaceQ
    .createJob({
      event: event,
      data: data
    })
    .save();
