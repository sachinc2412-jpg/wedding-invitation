# Afridi & Sauleha — Wedding Invitations

Two independent static invitations share the original curtain, floral artwork, scratch reveal, and music controls.

- Nikah: `/` or `/nikah/`, Friday, 6 November 2026.
- Dawat-e-Walima: `/walima/`, Saturday, 7 November 2026. The Walima hostname is routed here by `vercel.json`.
- Both: after Namaz-e-Asar, from 5:00 PM onwards, Asia/Kolkata (IST).
- Venue: ZIYON EVENTS Banquet Hall, Bata Chowk, Jammu Kashmir Bank, MG Road, Pune Cantonment, Pune, Maharashtra 411001.

Calendar events use 11:30 UTC, equivalent to 17:00 IST. No end time has been supplied; the ICS events omit DTEND and the Google Calendar template uses a zero-duration event, with the open-ended timing in its description.

RSVPs are submitted to `/api/rsvp` and stored privately in the connected `afridi-wedding-rsvps` Vercel Blob store, under `rsvps/nikah/` and `rsvps/walima/`. Each JSON record includes event, name, attendance, guest count, message, and received timestamp. A stable random response ID allows guest edits/retries without duplicate records for that browser/event. Declined invitations count zero guests. There is no public response-list endpoint and no email/WhatsApp notification.

To review responses, open the Vercel project's Storage tab, select `afridi-wedding-rsvps`, and browse the event folder. The store is private; downloads require your Vercel account. Existing device-only responses are not silently uploaded.

The project connection supplies `BLOB_READ_WRITE_TOKEN` to the server. Never add it to HTML, browser JavaScript, or Git. Run `npm test` to verify validation, private storage writes, retry handling, separate events, and failure behavior.

## Google Sheets integration

The requested destination is the existing `AFRIDI WEDDING` spreadsheet, ID `1kvK3azfKBULPPEtVZHaiO5D6rBpY36v85pvx7OGlohI`: Nikah maps to `Wedding`, Walima maps to `Reception`. Its response columns A:F are received time (IST), guest name, attendance, guest count, message, and stable response ID. Do not enter manual records or notes in the managed A:F ranges.

`/api/rsvp-sync` exports a fresh snapshot only with bearer authentication. Configure `RSVP_SHEETS_SYNC_KEY_HASH` on Vercel with the SHA-256 hex digest of a random 32-byte key. Without the verifier the route is disabled. Keep the actual key private: it grants read access to guest responses. Explicitly marked `[TEST]` records are excluded.

Install `integrations/google-sheets.gs` as a container-bound Apps Script in that exact spreadsheet, store the raw key as Script Property `RSVP_SYNC_KEY`, then authorize and run `installRsvpSync` once. This refreshes immediately and creates a five-minute trigger. The script requests access to the current spreadsheet, external requests, and its own trigger; no public spreadsheet sharing is needed. Guest text is escaped to prevent formulas. Retries replace snapshots by response ID, so edits update rows instead of creating duplicate responses. The source Blob records remain the durable record of submissions. Only claim the connection is live after an installed trigger and sheet update have been verified.

Deploy the repository on Vercel using the included configuration. Output is `dist`; no frontend build is required. Vercel runs `npm ci --ignore-scripts` for the Node API dependency.
