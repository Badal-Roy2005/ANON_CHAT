import { randomUUID } from 'node:crypto';
import {
  addSocketToRoom,
  getRecentMessagesForCells,
  getUniqueUserCount,
  removeSocketFromRoom,
  storeMessageInBuffer,
} from '../controllers/roomController.js';
import { checkRateLimit } from '../middleware/rateLimiter.js';
import { getNeighborCells } from '../utils/geohash.js';
import { sanitizeMessage } from '../utils/moderation.js';
import { hashIP } from '../utils/security.js';

async function emitUserCounts(io, cells) {
  const count = await getUniqueUserCount(cells);
  for (const cell of cells) {
    io.to(cell).emit('user_count_update', { geohash: cell, count });
  }
}

const GEOHASH_REGEX = /^[0123456789bcdefghjkmnpqrstuvwxyz]+$/;

function isValidGeohash(value) {
  return typeof value === 'string' && GEOHASH_REGEX.test(value) && value.length <= 12;
}

function isValidSessionId(value) {
  return typeof value === 'string' && value.trim().length > 0 && value.length <= 128;
}

function isValidDisplayName(value) {
  return typeof value === 'string' && value.trim().length > 0 && value.length <= 32;
}

function getClientIp(socket) {
  const forwarded = socket.handshake.headers['x-forwarded-for'];
  if (typeof forwarded === 'string' && forwarded.length > 0) {
    return forwarded.split(',')[0].trim();
  }
  return socket.handshake.address;
}

export function registerChatHandlers(io) {
  io.on('connection', (socket) => {
    const hashedIp = hashIP(getClientIp(socket));

    socket.on('join_room', async (payload) => {
      try {
        const { geohash, sessionId, displayName } = payload || {};
        if (
          !isValidGeohash(geohash) ||
          !isValidSessionId(sessionId) ||
          !isValidDisplayName(displayName)
        ) {
          socket.emit('join_error', { message: 'Invalid join payload' });
          return;
        }

        const cells = getNeighborCells(geohash);
        socket.join(cells);
        socket.data.cells = cells;
        socket.data.geohash = geohash;

        await Promise.all(cells.map((cell) => addSocketToRoom(cell, socket.id)));

        const recentMessages = await getRecentMessagesForCells(cells);
        socket.emit('room_history', recentMessages);

        await emitUserCounts(io, cells);
      } catch (error) {
        console.error('join_room error:', error.message);
      }
    });

    socket.on('send_message', async (payload) => {
      try {
        const { geohash, sessionId, displayName, text } = payload || {};
        if (
          !isValidGeohash(geohash) ||
          !isValidSessionId(sessionId) ||
          !isValidDisplayName(displayName)
        ) {
          socket.emit('message_rejected', { message: 'Invalid message payload' });
          return;
        }

        const rate = await checkRateLimit(sessionId, hashedIp);
        if (!rate.allowed) {
          socket.emit('rate_limit_exceeded', {
            message: 'Rate limit reached. Please wait a moment.',
          });
          return;
        }

        let cleanText;
        try {
          cleanText = sanitizeMessage(text);
        } catch {
          socket.emit('message_rejected', { message: 'Message is empty or invalid' });
          return;
        }

        const message = {
          id: randomUUID(),
          text: cleanText,
          displayName: displayName.trim(),
          timestamp: Date.now(),
          geohash,
        };

        await storeMessageInBuffer(geohash, message);
        io.to(socket.data.cells || [geohash]).emit('new_message', message);
      } catch (error) {
        console.error('send_message error:', error.message);
      }
    });

    socket.on('disconnect', async () => {
      try {
        const cells = socket.data.cells || [];
        if (cells.length === 0) return;

        await Promise.all(cells.map((cell) => removeSocketFromRoom(cell, socket.id)));

        await emitUserCounts(io, cells);
      } catch (error) {
        console.error('disconnect error:', error.message);
      }
    });
  });
}