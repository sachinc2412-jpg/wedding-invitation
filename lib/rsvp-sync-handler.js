import { createHash, timingSafeEqual } from 'node:crypto';

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const PATH = /^rsvps\/(nikah|walima)\/([0-9a-f-]+)\.json$/i;

export function createRsvpSyncHandler({ list, get, keyHash = () => process.env.RSVP_SHEETS_SYNC_KEY_HASH }) {
  return async (req, res) => {
    res.setHeader('Cache-Control', 'no-store');
    res.setHeader('X-Content-Type-Options', 'nosniff');
    if (req.method !== 'GET') {
      res.setHeader('Allow', 'GET');
      return res.status(405).json({ ok: false });
    }
    const verifier = keyHash();
    if (!/^[a-f0-9]{64}$/i.test(verifier || '')) return res.status(503).json({ ok: false });
    const auth = req.headers.authorization || '';
    const token = auth.startsWith('Bearer ') ? auth.slice(7) : '';
    if (!token || token.length > 256 || !timingSafeEqual(createHash('sha256').update(token).digest(), Buffer.from(verifier, 'hex'))) {
      return res.status(401).json({ ok: false });
    }
    try {
      const records = { nikah: [], walima: [] };
      let cursor;
      do {
        const page = await list({ prefix: 'rsvps/', limit: 1000, ...(cursor ? { cursor } : {}) });
        const blobs = page.blobs.filter(blob => PATH.test(blob.pathname));
        for (let offset = 0; offset < blobs.length; offset += 20) {
          const batch = await Promise.all(blobs.slice(offset, offset + 20).map(async blob => {
            const result = await get(blob.pathname, { access: 'private', useCache: false });
            if (!result || result.statusCode !== 200) throw new Error('Storage read failed');
            const record = JSON.parse(await new Response(result.stream).text());
            const [, event, id] = blob.pathname.match(PATH);
            if (!UUID.test(record.id || '') || record.id !== id || record.event !== event ||
                typeof record.name !== 'string' || !record.name || record.name.length > 100 ||
                !['yes', 'no'].includes(record.attending) || !Number.isInteger(record.guests) ||
                (record.attending === 'no' ? record.guests !== 0 : record.guests < 1 || record.guests > 4) ||
                typeof record.message !== 'string' || record.message.length > 1000 ||
                !Number.isFinite(Date.parse(record.receivedAt))) throw new Error('Invalid stored record');
            return record;
          }));
          for (const record of batch) {
            if (!record.name.startsWith('[TEST]')) records[record.event].push(record);
          }
        }
        if (page.hasMore && (!page.cursor || page.cursor === cursor)) throw new Error('Incomplete storage page');
        cursor = page.hasMore ? page.cursor : undefined;
      } while (cursor);
      for (const rows of Object.values(records)) rows.sort((a, b) => a.receivedAt.localeCompare(b.receivedAt) || a.id.localeCompare(b.id));
      return res.status(200).json({ ok: true, ...records, generatedAt: new Date().toISOString() });
    } catch {
      console.error('RSVP sheet export failed');
      return res.status(503).json({ ok: false });
    }
  };
}
