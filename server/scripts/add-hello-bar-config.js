module.exports = async () => {
  try {
    await DB.Config.create(
      {
        key: 'helloBar',
        value: {
          text: "We're hiring! Join us",
          link: 'https://google.com',
          textLink: 'Click here'
        },
        name: 'Hello bar config',
        description: '',
        public: true,
        type: 'mixed',
        ordering: 20
      },
      {
        key: 'script',
        value: {
          head: [
            {
              name: 'Demo',
              script: "alert('Demo script work!');",
              isActive: false
            }
          ],
          body: [
            {
              name: 'Demo',
              script: "alert('Demo script work!');",
              isActive: false
            }
          ],
          footer: [
            {
              name: 'Demo',
              script: "alert('Demo script work!');",
              isActive: false
            }
          ]
        },
        name: 'Header and body scripts',
        description: '',
        public: true,
        type: 'mixed',
        ordering: 22
      }
    );
  } catch (error) {
    console.log(error);
  }
};
