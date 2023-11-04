/* eslint no-restricted-syntax: 0, no-await-in-loop: 0 */
module.exports = async () => {
  try {
    const users = await DB.User.find({
      emailVerified: true,
      role: 'user'
    });
    if (users.length) {
      for (const user of users) {
        const lessonSpaceUser = await Service.LessonSpace.addUser({
          name: user.name,
          email: user.email,
          role: user.type === 'tutor' ? 'teacher' : 'student'
        });

        if (lessonSpaceUser && lessonSpaceUser.id) {
          user.lessonSpaceUserId = lessonSpaceUser.id;
          user.lessonSpaceUserInfo = lessonSpaceUser;
          await user.save();
        } else {
          let lessonSpaceUsers = await Service.LessonSpace.getUsers(user.email);
          lessonSpaceUsers = JSON.parse(lessonSpaceUsers);
          if (lessonSpaceUsers && lessonSpaceUsers.results && lessonSpaceUsers.results.length) {
            for (const item of lessonSpaceUsers.results) {
              user.lessonSpaceUserId = item.id;
              user.lessonSpaceUserInfo = item;
              await user.save();
            }
          }
        }
      }
    }
  } catch (e) {
    throw e;
  }
};
