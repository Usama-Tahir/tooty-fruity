let LESSON_SPACE_API_KEY = process.env.LESSON_SPACE_API_KEY; // ae089537-e689-485b-ae23-4ec5e4a873a9
let LESSON_SPACE_ORGANISATION_ID = process.env.LESSON_SPACE_ORGANISATION_ID; // 7089
let LESSON_SPACE_HOOK_URL = process.env.LESSON_SPACE_HOOK_URL;
const request = require('request');

const initConfig = async () => {
  const spaceConfig = await DB.Config.findOne({
    key: 'platformOnline'
  }).exec();
  if (spaceConfig && spaceConfig.value && spaceConfig.value['lessonspace']) {
    LESSON_SPACE_API_KEY = spaceConfig.value['lessonspace'].apiKey || process.env.LESSON_SPACE_API_KEY;
    LESSON_SPACE_ORGANISATION_ID = spaceConfig.value['lessonspace'].organisationId || process.env.LESSON_SPACE_ORGANISATION_ID;
    LESSON_SPACE_HOOK_URL = spaceConfig.value['lessonspace'].hookUrl || process.env.LESSON_SPACE_HOOK_URL;
  }

  return {
    LESSON_SPACE_API_KEY,
    LESSON_SPACE_ORGANISATION_ID,
    LESSON_SPACE_HOOK_URL
  };
};

exports.getOrganisation = async () => {
  try {
    const config = await initConfig();
    return new Promise((resolve, reject) =>
      request(
        {
          uri: 'https://api.thelessonspace.com/v2/my-organisation/',
          method: 'GET',
          headers: {
            Authorization: `Organisation ${config.LESSON_SPACE_API_KEY}`
          }
        },
        (error, response, body) => {
          if (error) {
            return reject(error);
          }
          return resolve(body);
        }
      )
    );
  } catch (e) {
    console.log('err>>>>>>>>', e);
  }
};

exports.getOrganisationDetail = async () => {
  const config = await initConfig();
  try {
    return new Promise((resolve, reject) =>
      request(
        {
          uri: `https://api.thelessonspace.com/v2/organisations/${config.LESSON_SPACE_ORGANISATION_ID}/`,
          method: 'GET',
          headers: {
            Authorization: `Organisation ${config.LESSON_SPACE_API_KEY}`
          }
        },
        (error, response, body) => {
          if (error) {
            return reject(error);
          }
          return resolve(body);
        }
      )
    );
  } catch (e) {
    console.log('err>>>>>>>>', e);
  }
};

exports.addUser = async options => {
  try {
    const config = await initConfig();
    return new Promise((resolve, reject) =>
      request(
        {
          uri: `https://api.thelessonspace.com/v2/organisations/${config.LESSON_SPACE_ORGANISATION_ID}/users/`,
          method: 'POST',
          headers: {
            Authorization: `Organisation ${config.LESSON_SPACE_API_KEY}`
          },
          json: {
            name: options.name || 'No Name',
            email: options.email,
            password: '123456',
            organisation: config.LESSON_SPACE_ORGANISATION_ID,
            role: options.role,
            send_student_invite_email: false
          }
        },
        (error, response, body) => {
          if (error) {
            return reject(error);
          }
          return resolve(body);
        }
      )
    );
  } catch (e) {
    console.log('err>>>>>>>>', e);
  }
};

exports.getUsers = async email => {
  try {
    const config = await initConfig();
    return new Promise((resolve, reject) =>
      request(
        {
          uri: `https://api.thelessonspace.com/v2/organisations/${config.LESSON_SPACE_ORGANISATION_ID}/users?search=${email}`,
          method: 'GET',
          headers: {
            Authorization: `Organisation ${config.LESSON_SPACE_API_KEY}`
          }
        },
        (error, response, body) => {
          if (error) {
            return reject(error);
          }
          return resolve(body);
        }
      )
    );
  } catch (e) {
    throw e;
  }
};

exports.getUserDetails = async options => {
  try {
    const config = await initConfig();
    return new Promise((resolve, reject) =>
      request(
        {
          uri: `https://api.thelessonspace.com/v2/organisations/${config.LESSON_SPACE_ORGANISATION_ID}/users/605684/`,
          method: 'GET',
          headers: {
            Authorization: `Organisation ${config.LESSON_SPACE_API_KEY}`
          }
        },
        (error, response, body) => {
          if (error) {
            return reject(error);
          }
          return resolve(body);
        }
      )
    );
  } catch (e) {
    console.log('err>>>>>>>>', e);
  }
};

exports.getSpaceList = async () => {
  try {
    const config = await initConfig();
    return new Promise((resolve, reject) =>
      request(
        {
          uri: `https://api.thelessonspace.com/v2/organisations/${config.LESSON_SPACE_ORGANISATION_ID}/spaces/`,
          method: 'GET',
          headers: {
            Authorization: `Organisation ${config.LESSON_SPACE_API_KEY}`
          }
        },
        (error, response, body) => {
          if (error) {
            return reject(error);
          }
          return resolve(body);
        }
      )
    );
  } catch (e) {
    console.log('err>>>>>>>>', e);
  }
};

exports.getSpaceDetail = async () => {
  try {
    const config = await initConfig();
    return new Promise((resolve, reject) =>
      request(
        {
          uri: `https://api.thelessonspace.com/v2/organisations/${config.LESSON_SPACE_ORGANISATION_ID}/spaces/633cd442-9335-494e-b6df-7fda30b5df0e/`,
          method: 'GET',
          headers: {
            Authorization: `Organisation ${config.LESSON_SPACE_API_KEY}`
          }
        },
        (error, response, body) => {
          if (error) {
            return reject(error);
          }
          return resolve(body);
        }
      )
    );
  } catch (e) {
    console.log('err>>>>>>>>', e);
  }
};

exports.joinSpace = async () => {
  try {
    const config = await initConfig();
    return new Promise((resolve, reject) =>
      request(
        {
          uri: `https://api.thelessonspace.com/v2/organisations/${config.LESSON_SPACE_ORGANISATION_ID}/spaces/633cd442-9335-494e-b6df-7fda30b5df0e/`,
          method: 'POST',
          headers: {
            Authorization: `Organisation ${config.LESSON_SPACE_API_KEY}`
          }
        },
        (error, response, body) => {
          if (error) {
            return reject(error);
          }
          return resolve(body);
        }
      )
    );
  } catch (e) {
    console.log('err>>>>>>>>', e);
  }
};

exports.launchSpace = async (user, options) => {
  try {
    const config = await initConfig();
    return new Promise((resolve, reject) =>
      request(
        {
          uri: `https://api.thelessonspace.com/v2/spaces/launch/`,
          method: 'POST',
          headers: {
            Authorization: `Organisation ${config.LESSON_SPACE_API_KEY}`
          },
          json: {
            id: options.id,
            name: options.name,
            webhooks: {
              session: {
                start: config.LESSON_SPACE_HOOK_URL,
                idle: config.LESSON_SPACE_HOOK_URL,
                end: config.LESSON_SPACE_HOOK_URL
              },
              user: {
                join: config.LESSON_SPACE_HOOK_URL,
                idle: config.LESSON_SPACE_HOOK_URL,
                leave: config.LESSON_SPACE_HOOK_URL
              }
            },
            user: {
              name: user.name,
              email: user.email,
              leader: options.leader,
              single_use: true
            }
          }
        },
        (error, response, body) => {
          if (error) {
            return reject(error);
          }
          return resolve(body);
        }
      )
    );
  } catch (e) {
    console.log('err>>>>>>>>', e);
  }
};
