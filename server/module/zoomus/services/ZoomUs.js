const request = require('request');
const jwt = require('jsonwebtoken');
const KJUR = require('jsrsasign');
const { getZoomRequestHeader } = require('../utils/token');

exports.generateToken = async (expiresIn = 60 * 60 * 24) => {
  let zoomApiKey = process.env.ZOOM_API_KEY;
  let zoomApiSecret = process.env.ZOOM_API_SECRET;
  const zoomApi = await DB.Config.findOne({ key: 'platformOnline' });
  if (zoomApi && zoomApi.value && zoomApi.value['zoomus'].apiKey && zoomApi.value['zoomus'].apiSecret) {
    zoomApiKey = zoomApi.value['zoomus'].apiKey;
    zoomApiSecret = zoomApi.value['zoomus'].apiSecret;
  }
  return jwt.sign(
    {
      iss: zoomApiKey
    },
    zoomApiSecret,
    {
      expiresIn
    }
  );
};

exports.generateSignature = async meetingPayload => {
  try {
    let zoomSdkKey = process.env.ZOOM_SDK_KEY;
    let zoomSdkSecret = process.env.ZOOM_SDK_SECRET;
    const zoomApi = await DB.Config.findOne({ key: 'platformOnline' });
    if (zoomApi && zoomApi.value && zoomApi.value['zoomus'].sdkKey && zoomApi.value['zoomus'].sdkSecret) {
      zoomSdkKey = zoomApi.value['zoomus'].sdkKey;
      zoomSdkSecret = zoomApi.value['zoomus'].sdkSecret;
    }
    const iat = Math.round(new Date().getTime() / 1000) - 30;
    const exp = iat + 60 * 60 * 2;

    const oHeader = { alg: 'HS256', typ: 'JWT' };

    const oPayload = {
      sdkKey: zoomSdkKey,
      mn: meetingPayload.meetingNumber,
      role: meetingPayload.role,
      iat: iat,
      exp: exp,
      appKey: zoomSdkKey,
      tokenExp: iat + 60 * 60 * 2
    };

    const sHeader = JSON.stringify(oHeader);
    const sPayload = JSON.stringify(oPayload);
    const signature = KJUR.jws.JWS.sign('HS256', sHeader, sPayload, zoomSdkSecret);
    return signature;
  } catch (err) {
    console.log(err);
    throw err;
  }
};

exports.createUser = async options => {
  try {
    const headers = await getZoomRequestHeader();
    console.log(headers);
    return new Promise((resolve, reject) =>
      request(
        {
          uri: 'https://api.zoom.us/v2/users',
          method: 'POST',
          // https://zoom.github.io/api/#create-a-user
          json: {
            action: options.action || 'create',
            user_info: {
              email: options.email,
              type: 1,
              first_name: options.firstName || '',
              last_name: options.lastName || ''
            }
          },
          headers
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

exports.getUser = async email => {
  try {
    const headers = await getZoomRequestHeader();
    return new Promise((resolve, reject) =>
      request(
        {
          uri: `https://api.zoom.us/v2/users/${email}`,
          method: 'GET',
          json: {},
          headers
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

exports.createMeeting = async options => {
  try {
    const headers = await getZoomRequestHeader();
    return new Promise((resolve, reject) =>
      request(
        {
          uri: `https://api.zoom.us/v2/users/${options.email}/meetings`,
          method: 'POST',
          json: {
            type: 1,
            settings: {
              auto_recording: 'cloud', // non, local, cloud
              approve_type: 0,
              host_video: true,
              participant_video: true
            }
          },
          headers
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

exports.getPastDetailMeeting = async meetingUUID => {
  try {
    const headers = await getZoomRequestHeader();

    return new Promise((resolve, reject) =>
      request(
        {
          uri: `https://api.zoom.us/v2/past_meetings/${meetingUUID}`,
          method: 'GET',
          headers
        },
        (error, response, body) => {
          if (error) {
            return reject(error);
          }
          return resolve(JSON.parse(body));
        }
      )
    );
  } catch (e) {
    throw e;
  }
};

exports.getDetailMeeting = async meetingId => {
  try {
    const headers = await getZoomRequestHeader();

    return new Promise((resolve, reject) =>
      request(
        {
          uri: `https://api.zoom.us/v2/meetings/${meetingId}`,
          method: 'GET',
          headers
        },
        (error, response, body) => {
          if (error) {
            return reject(error);
          }
          return resolve(JSON.parse(body));
        }
      )
    );
  } catch (e) {
    throw e;
  }
};

exports.getRecordings = async meetingId => {
  try {
    const headers = await getZoomRequestHeader();

    return new Promise((resolve, reject) =>
      request(
        {
          uri: `https://api.zoom.us/v2/meetings/${meetingId}/recordings`,
          method: 'GET',
          headers
        },
        (error, response, body) => {
          if (error) {
            return reject(error);
          }
          return resolve(JSON.parse(body));
        }
      )
    );
  } catch (e) {
    throw e;
  }
};

exports.changeUserStatus = async email => {
  // change status activate || deactivate
  try {
    const headers = await getZoomRequestHeader();
    return new Promise((resolve, reject) =>
      request(
        {
          uri: `https://api.zoom.us/v2/users/${email}/status`,
          method: 'PUT',
          json: {},
          headers
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

exports.deleteUser = async options => {
  try {
    const headers = await getZoomRequestHeader();
    return new Promise((resolve, reject) =>
      request(
        {
          uri: `https://api.zoom.us/v2/users/${options.email}`,
          method: 'DELETE',
          // https://zoom.github.io/api/#create-a-user
          json: {
            action: options.action || 'disassociate',
            transfer_email: false,
            transfer_meeting: false,
            transfer_webinar: false,
            transfer_recording: false
          },
          headers
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
