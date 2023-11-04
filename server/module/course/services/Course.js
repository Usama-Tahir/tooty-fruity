exports.reject = async (courseId, reason) => {
  try {
    const course = courseId instanceof DB.Course ? courseId : await DB.Course.findOne({ _id: courseId });
    if (!course) {
      throw new Error('Course not found!');
    }

    await DB.Course.update(
      { _id: course._id },
      {
        $set: {
          approved: false,
          rejectReason: reason || ''
        }
      }
    );

    const tutor = await DB.User.findOne({ _id: course.tutorId });

    if (!tutor) {
      throw new Error('Tutor not found!');
    }

    if (tutor.notificationSettings)
      await Service.Mailer.send('course/reject.html', tutor.email, {
        subject: 'Your course has been rejected!',
        course: course.toObject(),
        reason,
        tutor: tutor.getPublicProfile(),
        appName: process.env.APP_NAME
      });

    return true;
  } catch (e) {
    throw e;
  }
};

exports.approve = async courseId => {
  try {
    const course = courseId instanceof DB.Course ? courseId : await DB.Course.findOne({ _id: courseId });
    if (!course) {
      throw new Error('Course not found!');
    }

    await DB.Course.update(
      { _id: course._id },
      {
        $set: {
          approved: true
        }
      }
    );

    const tutor = await DB.User.findOne({ _id: course.tutorId });

    if (!tutor) {
      throw new Error('Tutor not found!');
    }

    if (tutor.notificationSettings)
      await Service.Mailer.send('course/approve.html', tutor.email, {
        subject: 'Congratulations! - Your course has been approved !',
        course: course.toObject(),
        tutor: tutor.getPublicProfile(),
        appName: process.env.APP_NAME
      });

    return true;
  } catch (e) {
    throw e;
  }
};

exports.disable = async courseId => {
  try {
    const course = courseId instanceof DB.Course ? courseId : await DB.Course.findOne({ _id: courseId });
    if (!course) {
      throw new Error('Course not found!');
    }
    course.disabled = true;
    await course.save();
    const tutor = await DB.User.findOne({ _id: course.tutorId });
    if (!tutor) {
      throw new Error('Tutor not found!');
    }

    if (tutor.notificationSettings)
      await Service.Mailer.send('course/disable.html', tutor.email, {
        subject: 'Disable course temporarily.',
        course: course.toObject(),
        tutor: tutor.getPublicProfile()
      });

    return true;
  } catch (e) {
    throw e;
  }
};

exports.enable = async courseId => {
  try {
    const course = courseId instanceof DB.Course ? courseId : await DB.Course.findOne({ _id: courseId });
    if (!course) {
      throw new Error('Course not found!');
    }
    course.disabled = false;
    await course.save();
    const tutor = await DB.User.findOne({ _id: course.tutorId });
    if (!tutor) {
      throw new Error('Tutor not found!');
    }

    if (tutor.notificationSettings)
      await Service.Mailer.send('course/enable.html', tutor.email, {
        subject: 'Re-open your course.',
        course: course.toObject(),
        tutor: tutor.getPublicProfile()
      });

    return true;
  } catch (e) {
    throw e;
  }
};
