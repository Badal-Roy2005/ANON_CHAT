import redis from '../config/redis.js';

const MEMBERS_KEY_PREFIX = 'room:members:';
const MESSAGE_KEY_PREFIX = 'room:msg:';
const MEMBER_TTL_SECONDS = 3600;
const MESSAGE_TTL_SECONDS = 3600;
const MAX_BUFFERED_MESSAGES = 50;

export async function addSocketToRoom(geohash, socketId) {
  const key = `${MEMBERS_KEY_PREFIX}${geohash}`;
  await redis.sadd(key, socketId);
  await redis.expire(key, MEMBER_TTL_SECONDS);
}

export async function removeSocketFromRoom(geohash, socketId) {
  const key = `${MEMBERS_KEY_PREFIX}${geohash}`;
  await redis.srem(key, socketId);
}

export async function getRoomUserCount(geohash) {
  const key = `${MEMBERS_KEY_PREFIX}${geohash}`;
  return redis.scard(key);
}

export async function storeMessageInBuffer(geohash, messageObject) {
  const key = `${MESSAGE_KEY_PREFIX}${geohash}`;
  await redis.lpush(key, JSON.stringify(messageObject));
  await redis.ltrim(key, 0, MAX_BUFFERED_MESSAGES - 1);
  await redis.expire(key, MESSAGE_TTL_SECONDS);
}

export async function getRecentMessages(geohash) {
  const key = `${MESSAGE_KEY_PREFIX}${geohash}`;
  const rawMessages = await redis.lrange(key, 0, -1);
  return rawMessages
    .map((raw) => {
      try {
        return JSON.parse(raw);
      } catch {
        return null;
      }
    })
    .filter(Boolean)
    .reverse();
}

export async function getUniqueUserCount(cells) {
  const members = await Promise.all(
    cells.map((cell) => redis.smembers(`${MEMBERS_KEY_PREFIX}${cell}`))
  );
  return new Set(members.flat()).size;
}

export async function getRecentMessagesForCells(cells) {
  const lists = await Promise.all(cells.map((cell) => getRecentMessages(cell)));
  const byId = new Map();
  for (const list of lists) {
    for (const message of list) {
      if (message && typeof message.id === 'string') {
        byId.set(message.id, message);
      }
    }
  }
  return [...byId.values()].sort((a, b) => a.timestamp - b.timestamp);
}