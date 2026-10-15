import { list, get } from '@vercel/blob';
import { createRsvpSyncHandler } from '../lib/rsvp-sync-handler.js';

export default createRsvpSyncHandler({ list, get });
