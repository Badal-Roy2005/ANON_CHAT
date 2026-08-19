import { Redis } from '@upstash/redis';

const hasUpstashConfig =
  Boolean(process.env.UPSTASH_REDIS_REST_URL) &&
  Boolean(process.env.UPSTASH_REDIS_REST_TOKEN);

class InMemoryStore {
  constructor() {
    this.store = new Map();
  }

  isExpired(entry) {
    return entry.expiresAt !== null && entry.expiresAt <= Date.now();
  }

  cleanup() {
    for (const [key, entry] of this.store) {
      if (this.isExpired(entry)) this.store.delete(key);
    }
  }

  async ping() {
    return 'PONG';
  }

  async get(key) {
    this.cleanup();
    const entry = this.store.get(key);
    return entry ? entry.value : null;
  }

  async set(key, value) {
    this.store.set(key, { value, expiresAt: null });
    return 'OK';
  }

  async setex(key, seconds, value) {
    this.store.set(key, { value, expiresAt: Date.now() + seconds * 1000 });
    return 'OK';
  }

  async incr(key) {
    return this.incrby(key, 1);
  }

  async incrby(key, increment) {
    this.cleanup();
    const entry = this.store.get(key);
    const value = entry ? Number(entry.value) || 0 : 0;
    const next = value + increment;
    this.store.set(key, { value: next, expiresAt: entry ? entry.expiresAt : null });
    return next;
  }

  async expire(key, seconds) {
    const entry = this.store.get(key);
    if (!entry) return 0;
    entry.expiresAt = Date.now() + seconds * 1000;
    return 1;
  }

  async ttl(key) {
    this.cleanup();
    const entry = this.store.get(key);
    if (!entry) return -2;
    if (entry.expiresAt === null) return -1;
    return Math.max(0, Math.ceil((entry.expiresAt - Date.now()) / 1000));
  }

  async del(...keys) {
    let removed = 0;
    for (const key of keys) {
      if (this.store.delete(key)) removed += 1;
    }
    return removed;
  }

  async sadd(key, ...members) {
    this.cleanup();
    const entry = this.store.get(key);
    const set = entry ? entry.value : new Set();
    let added = 0;
    for (const member of members) {
      if (!set.has(member)) {
        set.add(member);
        added += 1;
      }
    }
    this.store.set(key, { value: set, expiresAt: entry ? entry.expiresAt : null });
    return added;
  }

  async srem(key, ...members) {
    this.cleanup();
    const entry = this.store.get(key);
    if (!entry) return 0;
    let removed = 0;
    for (const member of members) {
      if (entry.value.delete(member)) removed += 1;
    }
    return removed;
  }

  async scard(key) {
    this.cleanup();
    const entry = this.store.get(key);
    return entry ? entry.value.size : 0;
  }

  async smembers(key) {
    this.cleanup();
    const entry = this.store.get(key);
    return entry ? [...entry.value] : [];
  }

  async lpush(key, ...values) {
    this.cleanup();
    const entry = this.store.get(key);
    const list = entry ? entry.value : [];
    this.store.set(key, { value: [...values, ...list], expiresAt: entry ? entry.expiresAt : null });
    return list.length + values.length;
  }

  async rpush(key, ...values) {
    this.cleanup();
    const entry = this.store.get(key);
    const list = entry ? entry.value : [];
    this.store.set(key, { value: [...list, ...values], expiresAt: entry ? entry.expiresAt : null });
    return list.length + values.length;
  }

  async lrange(key, start, stop) {
    this.cleanup();
    const entry = this.store.get(key);
    const list = entry ? entry.value : [];
    if (start < 0) start = Math.max(0, list.length + start);
    if (stop < 0) stop = list.length + stop;
    return list.slice(start, stop + 1);
  }

  async ltrim(key, start, stop) {
    this.cleanup();
    const entry = this.store.get(key);
    if (!entry) return 'OK';
    const list = entry.value;
    if (start < 0) start = Math.max(0, list.length + start);
    if (stop < 0) stop = list.length + stop;
    entry.value = list.slice(start, stop + 1);
    return 'OK';
  }

  async llen(key) {
    this.cleanup();
    const entry = this.store.get(key);
    return entry ? entry.value.length : 0;
  }
}

const isMockStore = !hasUpstashConfig;
const redis = hasUpstashConfig
  ? Redis.fromEnv()
  : new InMemoryStore();

export { redis, isMockStore };
export default redis;