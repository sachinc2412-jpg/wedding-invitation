const EVENTS = { nikah: '2026-11-06', walima: '2026-11-07' };
const ORIGINS = ['https://afridi-wedding.vercel.app', 'https://afridi-walima.vercel.app', 'https://wedding-invitation-ashy-theta.vercel.app'];
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function createRsvpHandler({ put }) {
  return async function rsvp(req, res) {
    res.setHeader('Cache-Control', 'no-store');
    res.setHeader('X-Content-Type-Options', 'nosniff');
    if (req.method !== 'POST') {
      res.setHeader('Allow', 'POST');
      return res.status(405).json({ ok: false, error: 'Please submit the invitation form.' });
    }
    const allowedOrigins = new Set(ORIGINS);
    for (const host of [process.env.VERCEL_URL, process.env.VERCEL_BRANCH_URL]) {
      if (host) allowedOrigins.add(`https://${host}`);
    }
    if (!allowedOrigins.has(req.headers.origin)) {
      return res.status(403).json({ ok: false, error: 'Please submit from the invitation website.' });
    }
    if ((req.headers['content-type'] || '').split(';')[0].trim() !== 'application/json') {
      return res.status(415).json({ ok: false, error: 'Please submit the invitation form.' });
    }
    if (Number(req.headers['content-length'] || 0) > 8192) {
      return res.status(413).json({ ok: false, error: 'Your response is too long.' });
    }
    let data;
    try {
      data = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
      if (!data || Array.isArray(data) || typeof data !== 'object') throw new Error('Invalid body');
      if (Buffer.byteLength(JSON.stringify(data)) > 8192) {
        return res.status(413).json({ ok: false, error: 'Your response is too long.' });
      }
    } catch {
      return res.status(400).json({ ok: false, error: 'Please check your response and try again.' });
    }
    const name = typeof data.name === 'string' ? data.name.trim().replace(/\s+/g, ' ') : '';
    const message = typeof data.message === 'string' ? data.message.trim() : '';
    if (!Object.hasOwn(EVENTS, data.event) || !UUID.test(data.id || '') || !name || name.length > 100 || message.length > 1000 || !['yes', 'no'].includes(data.attending) || data.website) {
      return res.status(400).json({ ok: false, error: 'Please check your name and response, then try again.' });
    }
    if (data.attending === 'yes' && (!Number.isInteger(data.guests) || data.guests < 1 || data.guests > 4)) {
      return res.status(400).json({ ok: false, error: 'Please choose between 1 and 4 guests.' });
    }
    const record = {
      id: data.id.toLowerCase(), event: data.event, eventDate: EVENTS[data.event],
      name, attending: data.attending, guests: data.attending === 'yes' ? data.guests : 0,
      message, receivedAt: new Date().toISOString()
    };
    try {
      // One private record per visitor/event; retries and edits replace that record.
      // Independent records avoid lost updates from concurrent guest submissions.
      await put(`rsvps/${record.event}/${record.id}.json`, JSON.stringify(record, null, 2), {
        access: 'private', contentType: 'application/json', addRandomSuffix: false,
        allowOverwrite: true
      });
      return res.status(201).json({ ok: true, id: record.id, event: record.event });
    } catch {
      console.error('RSVP storage write failed', { event: record.event });
      return res.status(503).json({ ok: false, error: 'Your response could not be sent. Please try again.' });
    }
  };
}
