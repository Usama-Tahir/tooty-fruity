exports.model = {
  Config: require('./models/config'),
  Script: require('./models/script')
};

exports.router = router => {
  require('./routes/config.route')(router);
  require('./routes/contact.route')(router);
};
