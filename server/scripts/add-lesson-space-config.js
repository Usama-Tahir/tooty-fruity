module.exports = async () => {
  try {
    await DB.Config.create({
      key: 'platformOnline',
      value: {
        platform: 'zoomus', // zoomus | lessonspace
        zoomus: {
          apiKey: '',
          apiSecret: ''
        }, //
        lessonspace: {
          hookUrl: '',
          apiKey: '',
          organisationId: ''
        }
      },
      name: 'Platform to learn online',
      description: 'Platform to learn online',
      public: false,
      type: 'mixed',
      ordering: 17
    });
    await DB.Config.remove({ key: 'zoomApiKey' });
  } catch (error) {
    console.log(error);
  }
};
