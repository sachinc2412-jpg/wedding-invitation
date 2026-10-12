# Afridi & Sauleha — Wedding Invitations

Two independent static invitations share the original curtain, floral artwork, scratch reveal, and music controls.

- Nikah: `/` or `/nikah/`, Friday, 6 November 2026.
- Dawat-e-Walima: `/walima/`, Sunday, 8 November 2026. The Walima hostname is routed here by `vercel.json`.
- Both: after Namaz-e-Asar, from 5:00 PM onwards, Asia/Kolkata (IST).
- Venue: ZIYON EVENTS Banquet Hall, Bata Chowk, Jammu Kashmir Bank, MG Road, Pune Cantonment, Pune, Maharashtra 411001.

Calendar events use 11:30 UTC, equivalent to 17:00 IST. No end time has been supplied; the ICS events omit DTEND and the Google Calendar template uses a zero-duration event, with the open-ended timing in its description.

RSVP responses remain local to each visitor's device, stored separately for Nikah and Walima; they are not sent to the couple.

Deploy the repository on Vercel using the included configuration. Output is `dist`; no build or install step is required.
