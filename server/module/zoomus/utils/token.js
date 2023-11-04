const axios = require('axios');
const qs = require('query-string');

const { ZOOM_OAUTH_ENDPOINT } = require('../constants');
const { setEx, get, expire } = require('../../socket/SocketRedis');

/**
 * Retrieve token from Zoom API
 *
 * @returns {Object} { access_token, expires_in, error }
 */
const getToken = async () => {
  try {
    const { ZOOM_ACCOUNT_ID, ZOOM_CLIENT_ID, ZOOM_CLIENT_SECRET } = process.env;

    const request = await axios.post(ZOOM_OAUTH_ENDPOINT, qs.stringify({ grant_type: 'account_credentials', account_id: ZOOM_ACCOUNT_ID }), {
      headers: {
        Authorization: `Basic ${Buffer.from(`${ZOOM_CLIENT_ID}:${ZOOM_CLIENT_SECRET}`).toString('base64')}`
      }
    });

    const { access_token, expires_in } = await request.data;

    return { access_token, expires_in, error: null };
  } catch (error) {
    return { access_token: null, expires_in: null, error };
  }
};

/**
 * Set zoom access token with expiration in redis
 *
 * @param {Object} auth_object
 * @param {String} access_token
 * @param {int} expires_in
 */
const setToken = async ({ access_token, expires_in }) => {
  await setEx('zoom_access_token', access_token, expires_in);
};

const getZoomRequestHeader = async () => {
  const redis_token = await get('zoom_access_token');
  let token = redis_token;

  /**
   * Redis returns:
   * -2 if the key does not exist
   * -1 if the key exists but has no associated expire
   */
  if (!redis_token || ['-1', '-2'].includes(redis_token)) {
    const { access_token, expires_in, error } = await getToken();

    if (error) {
      const { message } = error;
      throw new Error(`Authentication Unsuccessful: ${message}`);
    }

    setToken({ access_token, expires_in });

    token = access_token;
  }

  return {
    Authorization: `Bearer ${token}`
  };
};

module.exports = {
  getToken,
  setToken,
  getZoomRequestHeader
};
