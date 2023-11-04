/* eslint no-restricted-syntax: 0, no-await-in-loop: 0 */
module.exports = async () => {
  try {
    await DB.User.updateMany(
      { type: 'tutor' },
      {
        pendingApprove: false
      }
    );
  } catch (e) {
    throw e;
  }
};
