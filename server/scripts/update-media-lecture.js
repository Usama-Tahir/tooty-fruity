/* eslint no-restricted-syntax: 0, no-await-in-loop: 0 */
module.exports = async () => {
  try {
    const lectures = await DB.Lecture.find({});
    for (const lecture of lectures) {
      lecture.totalMedia = 1;
      const lectureMedia = new DB.LectureMedia({
        lectureId: lecture._id,
        mediaType: lecture.mediaType,
        totalLength: lecture.totalLength || 0,
        mediaId: lecture.mediaId
      });
      await lectureMedia.save();
      lecture.mediaIds = [lectureMedia._id];
      await lecture.save();
    }
  } catch (e) {
    throw e;
  }
};
