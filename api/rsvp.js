import { put } from '@vercel/blob';
import { createRsvpHandler } from '../lib/rsvp-handler.js';

export default createRsvpHandler({ put });
