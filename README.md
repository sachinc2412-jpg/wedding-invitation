# Afridi Wedding Invitation

An interactive wedding invitation with a curtain reveal, scratch-to-reveal date, countdown, and Google/Apple Calendar links.

## Deploy on Vercel

Import this repository and use the included `vercel.json`. This is a static HTML/CSS/JavaScript site with output directory `dist`; no build or installation step is required.

## Invitation details

- Date: Friday, 6 November 2026
- Ceremony: 6:00 PM IST
- Dinner: 7:30 PM IST
- Location: India

The bride name and venue still need the final details. Keep visible copy in `dist/index.html`, countdown in `dist/app.js`, and the Google Calendar URL / `dist/assets/afridi-wedding.ics` consistent when updating these details.

## RSVP

The current RSVP saves on the visitor's device using localStorage. It does not send responses to the couple or a server.

## Files

- `dist/index.html`: invitation content and embedded critical cover artwork
- `dist/style.css`: layout and animations
- `dist/app.js`: reveal, scratch, countdown, local RSVP, and music controls
- `dist/assets`: artwork, fonts, and Apple Calendar event
