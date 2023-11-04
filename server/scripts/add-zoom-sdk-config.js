module.exports = async () => {
  try {
    const platformConfig = await DB.Config.findOne({
      key: 'platformOnline'
    });

    if (platformConfig && platformConfig.value) {
      platformConfig.value = {
        ...platformConfig.value,
        zoomus: {
          ...platformConfig.value.zoomus,
          sdkKey: 'xxxx',
          sdkSecret: 'xxxx'
        }
      };
      await platformConfig.save();
    }
  } catch (error) {
    console.log(error);
  }
};
