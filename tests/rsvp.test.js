import test from 'node:test';
import assert from 'node:assert/strict';
import { createRsvpHandler } from '../lib/rsvp-handler.js';

const input = { id: 'b702df0c-eaef-4d6f-bc44-748266544790', event: 'nikah', name: 'Test Guest', attending: 'yes', guests: 2, message: 'Best wishes', website: '' };
function response() {
  return { headers: {}, setHeader(k, v) { this.headers[k] = v; }, status(code) { this.code = code; return this; }, json(body) { this.body = body; return this; } };
}
function request(body = input, extra = {}) {
  return { method: 'POST', headers: { origin: 'https://afridi-wedding.vercel.app', 'content-type': 'application/json' }, body, ...extra };
}
test('concurrent invitations retain independent private records; retry updates instead of duplicating', async () => {
  const saved = new Map();
  const handler = createRsvpHandler({ put: async (path, body, options) => { assert.equal(options.access, 'private'); saved.set(path, JSON.parse(body)); } });
  const first = response(), second = response();
  await Promise.all([handler(request(), first), handler(request({ ...input, event: 'walima' }), second)]);
  assert.equal(first.code, 201); assert.equal(second.code, 201); assert.equal(saved.size, 2);
  const retry = response(); await handler(request({ ...input, guests: 3 }), retry);
  assert.equal(saved.size, 2); assert.equal(saved.get(`rsvps/nikah/${input.id}.json`).guests, 3);
  assert.equal(saved.get(`rsvps/walima/${input.id}.json`).eventDate, '2026-11-07');
  assert.equal(first.body.url, undefined);
});
test('declined invitations count zero attendees', async () => {
  let record;
  const res = response(); await createRsvpHandler({ put: async (_, body) => { record = JSON.parse(body); } })(request({ ...input, attending: 'no' }), res);
  assert.equal(res.code, 201); assert.equal(record.guests, 0);
});
test('invalid, oversized, cross-origin and read requests never touch storage', async () => {
  const handler = createRsvpHandler({ put: () => { throw new Error('must not write'); } });
  for (const [req, status] of [[request({ ...input, name: ' ' }), 400], [request({ ...input, guests: 99 }), 400], [request({ ...input, event: '__proto__' }), 400], [request({ ...input, id: '../../secret' }), 400], [request({ ...input, website: 'spam' }), 400], [request('{broken'), 400], [request({ ...input, message: 'x'.repeat(1001) }), 400], [request(input, { headers: { origin: 'https://elsewhere.example', 'content-type': 'application/json' } }), 403], [request(input, { method: 'GET' }), 405], [request(input, { headers: { origin: 'https://afridi-wedding.vercel.app', 'content-type': 'text/plain' } }), 415], [request(input, { headers: { origin: 'https://afridi-wedding.vercel.app', 'content-type': 'application/json', 'content-length': '9000' } }), 413]]) {
    const res = response(); await handler(req, res); assert.equal(res.code, status); assert.equal(res.body.ok, false);
  }
});
test('storage failure returns an error, never a saved confirmation', async () => {
  const res = response(); await createRsvpHandler({ put: async () => { throw new Error('storage unavailable'); } })(request(), res);
  assert.equal(res.code, 503); assert.equal(res.body.ok, false);
});
