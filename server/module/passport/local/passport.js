const passport = require('passport');
const { PLATFORM_ONLINE } = require('../../meeting');
const LocalStrategy = require('passport-local').Strategy;

exports.setup = () => {
  passport.use(
    new LocalStrategy(
      {
        usernameField: 'email',
        passwordField: 'password' // this is the virtual field on the model
      },
      async (email, password, done) => {
        try {
          const user = await DB.User.findOne({ email: email.toLowerCase() });
          if (!user) {
            return done(
              null,
              false,
              PopulateResponse.error(
                {
                  message: 'This email ID is not registered.'
                },
                'ERR_USER_NOT_FOUND',
                400,
                400
              )
            );
          }

          const platformConfig = await DB.Config.findOne({ key: 'platformOnline' });
          const platformOnline =
            platformConfig && platformConfig.value ? platformConfig.value.platform : process.env.PLATFORM_ONLINE || PLATFORM_ONLINE.ZOOM_US;

          return user.authenticate(password, (authError, authenticated) => {
            if (authError) {
              return done(authError);
            }
            if (!authenticated) {
              return done(
                null,
                false,
                PopulateResponse.error(
                  {
                    message: 'Password is not correct'
                  },
                  'ERR_PASSWORD_IS_INCORRECT',
                  400,
                  400
                )
              );
            } else if (!user.emailVerified) {
              return done(
                null,
                false,
                PopulateResponse.error(
                  {
                    message: 'Please verify your email address'
                  },
                  'ERR_EMAIL_NOT_VERIFIED'
                )
              );
            } else if (user.rejected && user.type === 'tutor') {
              return done(
                null,
                false,
                PopulateResponse.error(
                  {
                    message: 'Please wait for administrator approval'
                  },
                  'ERR_ACCOUNT_NOT_APPROVED'
                )
              );
            } else if (!user.isZoomAccount && user.type === 'tutor' && platformOnline === PLATFORM_ONLINE.ZOOM_US) {
              return done(
                null,
                false,
                PopulateResponse.error(
                  {
                    message: 'Please check email and active account on zoom. Any questions please contact admin. '
                  },
                  'ERR_ACCOUNT_NOT_APPROVED'
                )
              );
            } else if (user.type === 'student' && !user.isActive) {
              return done(
                null,
                false,
                PopulateResponse.error(
                  {
                    message: 'Your account has been deactivated, please contact the admin for more details.'
                  },
                  'ERR_ACCOUNT_NOT_APPROVED'
                )
              );
            }

            return done(null, user);
          });
        } catch (e) {
          return done(e);
        }
      }
    )
  );
};
