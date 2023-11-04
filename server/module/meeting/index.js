exports.services = {
  Meeting: require('./services/Meeting')
};

exports.router = router => {
  require('./routes/meeting.route')(router);
};

exports.PLATFORM_ONLINE = {
  ZOOM_US: 'zoomus',
  LESSON_SPACE: 'lessonspace'
};
