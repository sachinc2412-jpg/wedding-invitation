import test from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { createRsvpSyncHandler } from '../lib/rsvp-sync-handler.js';

const token = 'unit-test-only-key';
const verifier = createHash('sha256').update(token).digest('hex');
const id = 'bab3221f-c161-4e81-905e-df5f1a34c140';
const record = (event, name = 'Guest') => ({ id, event, eventDate: event === 'nikah' ? '2026-11-06' : '2026-11-07', name, attending: 'yes', guests: 2, message: '=Not a formula', receivedAt: '2026-10-15T10:00:00.000Z' });
const blob = r => ({ pathname: `rsvps/${r.event}/${r.id}.json` });
async function call(deps, auth = `Bearer ${token}`, method = 'GET') {
  const res = { headers: {}, setHeader(k, v) { this.headers[k] = v; }, status(s) { this.code = s; return this; }, json(body) { this.body = body; return this; } };
  await createRsvpSyncHandler({ keyHash: () => verifier, ...deps })({ method, headers: { authorization: auth } }, res);
  return res;
}
test('sheet export rejects unauthenticated callers before reading storage and fails closed without config', async () => {
  let reads = 0;
  const deps = { list: async () => { reads++; throw new Error(); } };
  for (const auth of ['', 'Bearer wrong', 'Basic anything']) assert.equal((await call(deps, auth)).code, 401);
  assert.equal((await call(deps, undefined, 'POST')).code, 405);
  assert.equal((await call({ ...deps, keyHash: () => undefined })).code, 503);
  assert.equal(reads, 0);
});
test('sheet export reads private fresh records across all pages and separates events, excluding tests', async () => {
  const nikah = record('nikah'), walima = record('walima'), fixture = { ...record('nikah', '[TEST] connection'), id: '6e1deae0-d313-47c8-b16d-ce79ffbcfc41' };
  const all = [nikah, walima, fixture];
  let pages = 0;
  const res = await call({
    list: async options => {
      assert.equal(options.prefix, 'rsvps/');
      pages++;
      if (!options.cursor) return { blobs: [blob(nikah)], hasMore: true, cursor: 'next' };
      assert.equal(options.cursor, 'next');
      return { blobs: [blob(walima), blob(fixture)], hasMore: false };
    },
    get: async (path, options) => {
      assert.deepEqual(options, { access: 'private', useCache: false });
      return { statusCode: 200, stream: new Response(JSON.stringify(all.find(r => blob(r).pathname === path))).body };
    }
  });
  assert.equal(res.code, 200);
  assert.equal(pages, 2);
  assert.deepEqual(res.body.nikah, [nikah]);
  assert.deepEqual(res.body.walima, [walima]);
  assert.equal(res.headers['Cache-Control'], 'no-store');
});
test('a failed or malformed record never returns a partial successful snapshot', async () => {
  for (const get of [async () => null, async () => ({ statusCode: 200, stream: new Response('{}').body })]) {
    const result = await call({ list: async () => ({ blobs: [blob(record('nikah'))], hasMore: false }), get });
    assert.equal(result.code, 503);
    assert.deepEqual(result.body, { ok: false });
  }
});
