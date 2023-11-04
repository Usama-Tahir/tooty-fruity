exports.model = {
  Course: require('./models/course'),
  Section: require('./models/section'),
  Lecture: require('./models/lecture'),
  MyCourse: require('./models/my-course'),
  LectureMedia: require('./models/lecture-media')
};

exports.services = {
  Course: require('./services/Course'),
  Section: require('./services/Section'),
  Lecture: require('./services/Lecture')
};

exports.router = router => {
  require('./routes/course.route')(router);
  require('./routes/section.route')(router);
  require('./routes/lecture.route')(router);
  require('./routes/my-course.route')(router);
  require('./routes/lecture-media.route')(router);
};
