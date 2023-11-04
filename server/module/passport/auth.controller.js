const Joi = require('joi');
const nconf = require('nconf');
const url = require('url');
const { PLATFORM_ONLINE } = require('../meeting');
const enrollQ = require('../webinar/queue');
exports.register = async (req, res, next) => {
  const schema = Joi.object().keys({
    type: Joi.string().allow(['student', 'parent']).required().default('student'),
    email: Joi.string().email().required(),
    password: Joi.string().min(6).required(),
    phoneNumber: Joi.string().allow(['', null]).optional(),
    name: Joi.string().allow(['', null]).optional(),
    timezone: Joi.string().allow(['', null]).optional()
  });

  const validate = Joi.validate(req.body, schema);
  if (validate.error) {
    return next(PopulateResponse.validationError(validate.error));
  }

  try {
    const count = await DB.User.count({
      email: validate.value.email.toLowerCase()
    });
    if (count) {
      return next(
        PopulateResponse.error(
          {
            message: 'This email address is already taken'
          },
          'ERR_EMAIL_ALREADY_TAKEN'
        )
      );
    }

    const user = new DB.User(validate.value);
    user.emailVerifiedToken = Helper.String.randomString(48);

    let username = validate.value.name
      ? Helper.String.createAlias(validate.value.name)
      : Helper.String.createAlias(validate.value.email.split('@')[0]);
    username = username.toLowerCase();

    const countUser = await DB.User.count({ username });
    if (countUser) {
      username = `${username}-${Helper.String.randomString(5)}`;
    }
    user.username = username;
    await user.save();

    // now send email verificaiton to user
    if (user.notificationSettings)
      await Service.Mailer.send('verify-email.html', user.email, {
        userName: user.name,
        isSignup: true,
        subject: 'Verify email address',
        emailVerifyLink: url.resolve(nconf.get('baseUrl'), `v1/auth/verifyEmail/${user.emailVerifiedToken}`)
      });

    res.locals.register = PopulateResponse.success(
      {
        message: 'Your account has been created, please check your email to access'
      },
      'USE_CREATED'
    );
    return next();
  } catch (e) {
    return next(e);
  }
};

exports.verifyEmail = async (req, res, next) => {
  const schema = Joi.object().keys({
    token: Joi.string().required()
  });

  const validate = Joi.validate(req.body, schema);
  if (validate.error) {
    return next(PopulateResponse.validationError(validate.error));
  }

  try {
    const user = await DB.User.findOne({
      emailVerifiedToken: req.body.token
    });
    if (!user) {
      return next(
        PopulateResponse.error(
          {
            message: 'This token is incorrect'
          },
          'ERR_INVALID_EMAIL_VERIFY_TOKEN'
        )
      );
    }

    user.emailVerified = true;
    user.emailVerifiedToken = null;

    // Only create ZoomUs account for tutor
    await enrollQ.createAppointmentWithEmailRecipient(user.email);
    await enrollQ.createMyCourseWithEmailRecipient(user.email);
    // if (user.type === 'tutor') {
    //   const zoomUser = await Service.ZoomUs.getUser(user.email);
    //   if (zoomUser && zoomUser.id && zoomUser.status === 'active') {
    //     user.isZoomAccount = true;
    //     user.zoomAccountInfo = zoomUser;
    //   } else {
    //     await Service.ZoomUs.createUser({ email: user.email });
    //   }
    // } else {
    //   await enrollQ.createAppointmentWithEmailRecipient(user.email);
    //   await enrollQ.createMyCourseWithEmailRecipient(user.email);
    // }
    await user.save();
    res.locals.verifyEmail = PopulateResponse.success(
      {
        message: 'Your email was successfully verified.'
      },
      'EMAIL_VERIFIED'
    );
    return next();
  } catch (e) {
    return next(e);
  }
};

exports.verifyEmailView = async (req, res, next) => {
  try {
    const user = await DB.User.findOne({
      emailVerifiedToken: req.params.token
    });

    if (!user) {
      return next(
        PopulateResponse.error(
          {
            message: 'This token is incorrect'
          },
          'ERR_INVALID_EMAIL_VERIFY_TOKEN'
        )
      );
    }
    user.emailVerified = true;
    user.emailVerifiedToken = null;

    await enrollQ.createAppointmentWithEmailRecipient(user.email);
    await enrollQ.createMyCourseWithEmailRecipient(user.email);
    // if (user && user.type === 'tutor') {
    //   const zoomUser = await Service.ZoomUs.getUser(user.email);
    //   if (zoomUser && zoomUser.id && zoomUser.status === 'active') {
    //     user.isZoomAccount = true;
    //     user.zoomAccountInfo = zoomUser;
    //   } else {
    //     await Service.ZoomUs.createUser({ email: user.email });
    //   }
    // } else if (user && (user.type === 'student' || user.type === 'parent')) {
    //   await enrollQ.createAppointmentWithEmailRecipient(user.email);
    //   await enrollQ.createMyCourseWithEmailRecipient(user.email);
    // }
    const platformConfig = await DB.Config.findOne({ key: 'platformOnline' });
    const platformOnline =
      platformConfig && platformConfig.value ? platformConfig.value.platform : process.env.PLATFORM_ONLINE || PLATFORM_ONLINE.ZOOM_US;
    if (platformOnline === PLATFORM_ONLINE.LESSON_SPACE) {
      const lessonSpaceUser = await Service.LessonSpace.addUser({
        name: user.name,
        email: user.email,
        role: user.type === 'tutor' ? 'teacher' : 'student'
      });
      if (lessonSpaceUser && lessonSpaceUser.id) {
        user.lessonSpaceUserId = lessonSpaceUser.id;
        user.lessonSpaceUserInfo = lessonSpaceUser;
      } else {
        let lessonSpaceUsers = await Service.LessonSpace.getUsers(user.type === 'tutor' ? 'teacher' : 'student');
        lessonSpaceUsers = JSON.parse(lessonSpaceUsers);
        if (lessonSpaceUsers && lessonSpaceUsers.results && lessonSpaceUsers.results.length) {
          for (const item of lessonSpaceUsers.results) {
            const user = await DB.User.findOne({
              email: item.email
            });
            if (user) {
              user.lessonSpaceUserId = item.id;
              user.lessonSpaceUserInfo = item;
            }
          }
        }
      }
    }
    await user.save();
    const siteLogo = await DB.Config.findOne({
      key: 'siteLogo'
    });

    return res.render('auth/verify-email.html', {
      verified: user !== null,
      isSignup: true,
      userName: user.name,
      siteName: nconf.get('SITE_NAME'),
      urlLogin: nconf.get('userWebUrl') + '/auth/login',
      logoUrl: siteLogo.value || nconf.get('logoUrl')
    });
  } catch (e) {
    return next(e);
  }
};

exports.forgot = async (req, res, next) => {
  const schema = Joi.object().keys({
    email: Joi.string().email().required()
  });

  const validate = Joi.validate(req.body, schema);
  if (validate.error) {
    return next(PopulateResponse.validationError(validate.error));
  }

  try {
    const user = await DB.User.findOne({
      email: validate.value.email
    });
    if (!user) {
      return next(
        PopulateResponse.error(
          {
            message: 'Your email is not registered'
          },
          'ERR_INVALID_EMAIL_ADDRESS'
        )
      );
    }

    const passwordResetToken = Helper.String.randomString(48);
    await DB.User.update(
      {
        _id: user._id
      },
      {
        $set: { passwordResetToken }
      }
    );

    // now send email verificaiton to user
    if (user.notificationSettings)
      await Service.Mailer.send('forgot-password.html', user.email, {
        subject: 'Forgot your password?',
        passwordResetLink: url.resolve(nconf.get('baseUrl'), `v1/auth/passwordReset/${passwordResetToken}`),
        user: user.toObject()
      });

    res.locals.forgot = PopulateResponse.success(
      {
        message: 'Your password has been sent.'
      },
      'FORGOT_PASSWORD_EMAIL_SENT'
    );
    return next();
  } catch (e) {
    return next(e);
  }
};

exports.resetPasswordView = async (req, res, next) => {
  try {
    const user = await DB.User.findOne({
      passwordResetToken: req.params.token
    });

    if (!user) {
      return res.render('not-found.html');
    }

    const siteLogo = await DB.Config.findOne({
      key: 'siteLogo'
    });

    const siteName = await DB.Config.findOne({
      key: 'siteName'
    });

    if (req.method === 'GET') {
      return res.render('auth/change-password.html', {
        openForm: true,
        logoUrl: siteLogo.value || nconf.get('logoUrl'),
        siteName: siteName.value || nconf.get('SITE_NAME'),
        logoUrl: siteLogo.value || nconf.get('logoUrl'),
        urlLogin: nconf.get('userWebUrl') + '/auth/login'
      });
    }

    if (!req.body.password) {
      return res.render('auth/change-password.html', {
        openForm: true,
        error: true,
        siteName: siteName.value || nconf.get('SITE_NAME'),
        logoUrl: siteLogo.value || nconf.get('logoUrl'),
        urlLogin: nconf.get('userWebUrl') + '/auth/login'
      });
    }

    user.password = req.body.password;
    user.passwordResetToken = null;
    await user.save();
    await Service.User.newPassword(user, req.body.password);

    return res.render('auth/change-password.html', {
      openForm: false,
      error: false,
      siteName: siteName.value || nconf.get('SITE_NAME'),
      logoUrl: siteLogo.value || nconf.get('logoUrl'),
      urlLogin: nconf.get('userWebUrl') + '/auth/login'
    });
  } catch (e) {
    return next(e);
  }
};
