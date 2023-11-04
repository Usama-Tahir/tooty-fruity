const redis = require('redis');

const redisClient = redis.createClient(process.env.REDIS_URL);
const APP_USER_ROOM = 'APP_USER_ROOM';

const addUser = async userId => new Promise(resolve => redisClient.sadd(APP_USER_ROOM, userId, resolve));

const removeUser = async userId => new Promise(resolve => redisClient.srem(APP_USER_ROOM, userId, resolve));

const getSocketsFromUserId = async userId => new Promise(resolve => redisClient.smembers(userId, (err, members) => resolve(err ? [] : members)));

const removeUserSocketId = async (userId, socketId) => new Promise(resolve => redisClient.srem(userId, socketId, resolve));

const addUserSocketId = async (userId, socketId) => new Promise(resolve => redisClient.sadd(userId, socketId, resolve));

const hasUser = async userId => new Promise(resolve => redisClient.sismember(APP_USER_ROOM, userId, (err, data) => resolve(!err && data)));

const setEx = async (key, value, expires_in) => new Promise(resolve => redisClient.set(key, value, 'EX', 10, resolve));
const get = async key => new Promise(resolve => redisClient.get(key, (err, reply) => resolve(err ? null : reply)));

module.exports = {
  addUser,
  removeUser,
  getSocketsFromUserId,
  removeUserSocketId,
  addUserSocketId,
  hasUser,
  setEx,
  get
};
