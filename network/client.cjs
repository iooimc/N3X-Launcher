'use strict';

const DEFAULT_BASE = 'https://iooimc.github.io/N3X-Launcher/';
const DEFAULT_TIMEOUT = 7500;
const DEFAULT_TTL = 60_000;

function normalizeUuid(value) {
  const hex = String(value || '').replace(/-/g, '').toLowerCase();
  if (!/^[0-9a-f]{32}$/.test(hex)) throw new Error('Invalid Minecraft UUID');
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}

function join(base, path) {
  return String(base).replace(/\/+$/, '') + '/' + String(path).replace(/^\/+/, '');
}

function createNetworkClient(options = {}) {
  const base = options.base || DEFAULT_BASE;
  const timeout = Number(options.timeout || DEFAULT_TIMEOUT);
  const ttl = Number(options.ttl || DEFAULT_TTL);
  const fetchImpl = options.fetchImpl || globalThis.fetch;
  if (typeof fetchImpl !== 'function') throw new Error('N3X Network requires fetch().');

  const cache = new Map();

  async function request(path, { optional = false, binary = false, force = false } = {}) {
    const url = join(base, path);
    const cached = cache.get(url);
    if (!force && cached && Date.now() - cached.time < ttl) return cached.value;

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeout);
    let response;
    try {
      response = await fetchImpl(url, {
        method: 'GET',
        cache: 'no-store',
        redirect: 'follow',
        signal: controller.signal,
        headers: { 'Accept': binary ? 'image/png,*/*;q=0.1' : 'application/json,text/plain;q=0.8,*/*;q=0.1' }
      });
    } finally {
      clearTimeout(timer);
    }

    if (optional && response.status === 404) return null;
    if (!response.ok) throw new Error(`N3X Network HTTP ${response.status}: ${path}`);

    const value = binary ? Buffer.from(await response.arrayBuffer()) : await response.json();
    cache.set(url, { time: Date.now(), value });
    return value;
  }

  async function manifest(force = false) {
    return request('network/v1/manifest.json', { force });
  }

  async function config(force = false) {
    return request('network/config.json', { force });
  }

  async function catalog(force = false) {
    return request('network/capes/catalog.json', { force });
  }

  async function users(force = false) {
    return request('network/users/index.json', { force });
  }

  async function user(uuid, force = false) {
    const id = normalizeUuid(uuid);
    return request(`network/users/${id}.json`, { optional: true, force });
  }

  async function cape(uuid, { force = false, binary = false } = {}) {
    const id = normalizeUuid(uuid);
    const profile = await user(id, force);
    if (!profile || !profile.assignedCape) return null;
    const url = profile.capeUrl || join(base, `network/v1/capes/${id}.png`);
    if (!binary) return {
      uuid: id,
      capeId: profile.assignedCape,
      name: profile.name || null,
      url,
      updatedAt: profile.updatedAt || null
    };
    const bytes = await request(`network/v1/capes/${id}.png`, { optional: true, binary: true, force });
    return bytes ? { uuid: id, capeId: profile.assignedCape, url, bytes } : null;
  }

  async function resolve(uuid, force = false) {
    const [profile, list] = await Promise.all([user(uuid, force), catalog(force)]);
    if (!profile || !profile.assignedCape) return { profile, cape: null, textureUrl: null };
    const capeMeta = Array.isArray(list?.capes) ? list.capes.find(c => c.id === profile.assignedCape) || null : null;
    return {
      profile,
      cape: capeMeta,
      textureUrl: profile.capeUrl || join(base, `network/v1/capes/${normalizeUuid(uuid)}.png`)
    };
  }

  async function health() {
    const started = Date.now();
    const data = await manifest(true);
    return { ok: data?.protocol === 'n3x-capes-v1', protocol: data?.protocol || null, latencyMs: Date.now() - started };
  }

  function clearCache() { cache.clear(); }

  return { normalizeUuid, manifest, config, catalog, users, user, cape, resolve, health, clearCache, base };
}

module.exports = { createNetworkClient, normalizeUuid, DEFAULT_BASE };
