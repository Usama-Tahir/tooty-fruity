module.exports = async () => {
  try {
    await DB.Config.create(
      {
        key: 'homepagePicture',
        value: {
          howItWork: '',
          tutorWithUs: ''
        },
        name: 'Change the homepage picture',
        description: '',
        public: true,
        type: 'mixed',
        ordering: 23
      },
      {
        key: 'howItWorkPicture',
        value: {
          step1: '',
          step2: '',
          step3: '',
          step4: '',
          lifetimeAccess: '',
          recordLiveSession: ''
        },
        name: 'Change the how it work page picture',
        description: '',
        public: true,
        type: 'mixed',
        ordering: 23
      }
    );
  } catch (error) {
    console.log(error);
  }
};
