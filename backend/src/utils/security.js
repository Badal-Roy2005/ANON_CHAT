import { createHash } from 'node:crypto';

export function hashIP(ip) {
  if (typeof ip !== 'string' || ip.trim().length === 0) {
    throw new Error('hashIP: invalid IP address');
  }
  const salt = process.env.IP_HASH_SALT || '';
  return createHash('sha256').update(ip.trim() + salt).digest('hex');
}