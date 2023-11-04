// const HttpStatus = require('http-status-codes');
const { StatusCodes } = require('http-status-codes');
const { PLATFORM_ONLINE } = require('..');
exports.startMeeting = async (req, res, next) => {
  try {
    const appointmentId = req.params.appointmentId;
    if (req.user.type !== 'tutor') {
      return next(PopulateResponse.forbidden());
    }
    const tutorId = req.user._id;
    const appointment = await DB.Appointment.findOne({ _id: appointmentId, tutorId, status: { $in: ['booked', 'pending', 'progressing'] } }).populate(
      {
        path: 'transaction',
        select: req.user.role !== 'admin' ? '-commission -balance' : ''
      }
    );
    if (!appointment) {
      return next(
        PopulateResponse.error(
          {
            message: `Can't start this meeting`
          },
          'ERR_CAN_NOT_START_MEETING'
        )
      );
    }
    const isBeforeStartTime = await Service.Appointment.isBeforeStartTime(appointment);
    if (isBeforeStartTime) {
      return next(
        PopulateResponse.error({
          message: `You can join the meeting 10 minutes before the specified time`
        })
      );
    }
    const platformConfig = await DB.Config.findOne({ key: 'platformOnline' });
    const platformOnline =
      platformConfig && platformConfig.value ? platformConfig.value.platform : process.env.PLATFORM_ONLINE || PLATFORM_ONLINE.ZOOM_US;
    let data = {
      platform: platformOnline,
      zoomus: {
        url: '',
        signature: '',
        meetingNumber: '',
        password: ''
      },
      lessonspace: {
        url: ''
      }
    };
    if (platformOnline === PLATFORM_ONLINE.ZOOM_US) {
      if (!appointment.zoomData || (appointment.zoomData && !appointment.zoomData.start_url)) {
        const zoomData = await Service.ZoomUs.createMeeting({
          email: req.user.email
        });
        if (zoomData || zoomData.start_url) {
          appointment.zoomData = zoomData;
          appointment.meetingId = zoomData.id;
          appointment.platform = platformOnline;
          await appointment.save();
          data.zoomus.url = zoomData.start_url;
          data.zoomus.signature = await Service.ZoomUs.generateSignature({
            meetingNumber: appointment.meetingId,
            role: 1
          });
          data.zoomus.meetingNumber = appointment.meetingId;
          data.zoomus.password = zoomData.password;
        } else {
          return next(
            PopulateResponse.error({
              message: `Can't not start meeting.`
            })
          );
        }
        if (appointment.targetType === 'webinar') {
          const appointments = await DB.Appointment.find({
            status: { $in: ['booked', 'pending', 'progressing'] },
            slotId: appointment.slotId
          });
          if (appointments && appointments.length) {
            for (const a of appointments) {
              a.zoomData = zoomData;
              a.meetingId = zoomData.id;
              a.platform = platformOnline;
              await a.save();
            }
          }
        }
      } else if (appointment.zoomData && appointment.zoomData.start_url) {
        let zoomData = await Service.ZoomUs.getDetailMeeting(appointment.zoomData.id);
        if (!zoomData || !zoomData.start_url) {
          zoomData = await Service.ZoomUs.createMeeting({
            email: req.user.email
          });
          if (zoomData || zoomData.start_url) {
            appointment.zoomData = zoomData;
            appointment.meetingId = zoomData.id;
            appointment.platform = platformOnline;
            await appointment.save();
            data.zoomus.url = zoomData.start_url;
            data.zoomus.signature = await Service.ZoomUs.generateSignature({
              meetingNumber: appointment.meetingId,
              role: 1
            });
            data.zoomus.meetingNumber = appointment.meetingId;
            data.zoomus.password = zoomData.password;
          } else {
            return next(
              PopulateResponse.error({
                message: `Can't not restart meeting.`
              })
            );
          }
        }
        data.zoomus.url = zoomData.start_url;
        data.zoomus.signature = await Service.ZoomUs.generateSignature({
          meetingNumber: zoomData.id,
          role: 1
        });
        data.zoomus.meetingNumber = zoomData.id;
        data.zoomus.password = zoomData.password;
        if (appointment.targetType === 'webinar') {
          const appointments = await DB.Appointment.find({
            status: { $in: ['booked', 'pending', 'progressing'] },
            slotId: appointment.slotId
          });
          if (appointments && appointments.length) {
            for (const a of appointments) {
              a.zoomData = zoomData;
              a.meetingId = zoomData.id;
              a.platform = platformOnline;
              await a.save();
            }
          }
        }
      }
    } else if (platformOnline === PLATFORM_ONLINE.LESSON_SPACE) {
      let id = '';
      if (appointment.targetType === 'webinar') {
        const webinar = await DB.Webinar.findOne({ _id: appointment.webinarId });
        if (!webinar) {
          return next(
            PopulateResponse.error(
              {
                message: `Webinar not found`
              },
              'ITEM_NOT_FOUND'
            )
          );
        }
        id = webinar._id;
      } else {
        const student = await DB.User.findOne({ _id: appointment.userId });
        if (!student) {
          return next(
            PopulateResponse.error(
              {
                message: `Student not found`
              },
              'ITEM_NOT_FOUND'
            )
          );
        }
        id = req.user._id + '-' + student._id;
      }
      const spaceData = await Service.LessonSpace.launchSpace(req.user, {
        id,
        name: `${req.user.name}'s Space`,
        leader: true
      });

      if (spaceData && spaceData.client_url) {
        appointment.spaceSessionId = spaceData.session_id;
        appointment.platform = platformOnline;
        await appointment.save();
        if (appointment.targetType === 'webinar') {
          const appointments = await DB.Appointment.find({
            _id: {
              $ne: appointment._id
            },
            status: { $in: ['booked', 'pending', 'progressing'] },
            slotId: appointment.slotId
          });
          if (appointments && appointments.length) {
            for (const a of appointments) {
              a.spaceSessionId = spaceData.session_id;
              a.platform = platformOnline;
              await a.save();
            }
          }
        }
        data.lessonspace.url = spaceData.client_url;
      }
    }
    res.locals.signature = data;
    return next();
  } catch (error) {
    return next(error);
  }
};

exports.joinMeeting = async (req, res, next) => {
  try {
    const appointmentId = req.params.appointmentId;
    const appointment = await DB.Appointment.findOne({ _id: appointmentId, status: { $in: ['pending', 'progressing'] } }).populate({
      path: 'transaction',
      select: req.user.role !== 'admin' ? '-commission -balance -paymentInfo' : ''
    });
    if (req.user.type !== 'student' && req.user._id.toString() !== appointment.userId.toString()) {
      return next(PopulateResponse.forbidden());
    }
    if (!appointment) {
      return next(
        PopulateResponse.error(
          {
            message: `Can't start this meeting`
          },
          'ERR_CAN_NOT_START_MEETING'
        )
      );
    }

    const isBeforeStartTime = await Service.Appointment.isBeforeStartTime(appointment);
    if (isBeforeStartTime) {
      return next(
        PopulateResponse.error({
          message: `You can join the meeting 15 minutes before the specified time.`
        })
      );
    }
    const platformConfig = await DB.Config.findOne({ key: 'platformOnline' });
    const platformOnline =
      platformConfig && platformConfig.value ? platformConfig.value.platform : process.env.PLATFORM_ONLINE || PLATFORM_ONLINE.ZOOM_US;
    let data = {
      platform: platformOnline,
      zoomus: {
        url: '',
        signature: '',
        meetingNumber: '',
        password: ''
      },
      lessonspace: {
        url: ''
      }
    };

    if (platformOnline === PLATFORM_ONLINE.ZOOM_US) {
      if (!appointment.zoomData || !appointment.zoomData.start_url) {
        return next(
          PopulateResponse.error({
            message: `The tutor hasn't started meeting yet.`
          })
        );
      }
      let zoomData = await Service.ZoomUs.getDetailMeeting(appointment.zoomData.id);
      if (!zoomData || !zoomData.start_url) {
        return next(
          PopulateResponse.error({
            message: `The lesson has ended or there is a problem, please wait for the tutor to start and try again later`
          })
        );
      }
      data.zoomus.url = appointment.zoomData.join_url;
      data.zoomus.signature = await Service.ZoomUs.generateSignature({
        meetingNumber: appointment.meetingId,
        role: 0
      });
      data.zoomus.meetingNumber = appointment.meetingId;
      data.zoomus.password = appointment.zoomData.password;
    } else if (platformOnline === PLATFORM_ONLINE.LESSON_SPACE) {
      if (!appointment.spaceSessionId) {
        return next(
          PopulateResponse.error({
            message: `The tutor hasn't started meeting yet.`
          })
        );
      }
      const tutor = await DB.User.findOne({ _id: appointment.tutorId });
      if (!tutor) return next(PopulateResponse.notFound());
      let id = tutor._id;
      if (appointment.targetType === 'webinar') {
        const webinar = await DB.Webinar.findOne({ _id: appointment.webinarId });
        if (!webinar) {
          return next(
            PopulateResponse.error(
              {
                message: `Webinar not found`
              },
              'ITEM_NOT_FOUND'
            )
          );
        }
        id = webinar._id;
      } else {
        id = id + '-' + req.user._id;
      }

      const spaceData = await Service.LessonSpace.launchSpace(req.user, {
        id,
        name: `${tutor.name}'s Space`,
        leader: false
      });

      if (spaceData && spaceData.client_url) {
        data.lessonspace.url = spaceData.client_url;
      }
    }
    res.locals.signature = data;
    return next();
  } catch (error) {
    return next(error);
  }
};

exports.permissionCheck = async (req, res, next) => {
  try {
    console.log('check-permission', req.user.name);
    const valid = true;
    res.sendStatus(valid ? StatusCodes.OK : StatusCodes.UNAUTHORIZED);
  } catch (e) {
    console.log(e);
    return next(e);
  }
};
