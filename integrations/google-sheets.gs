/** @OnlyCurrentDoc */
// Install as a container-bound script in the AFRIDI WEDDING spreadsheet.
// Keep the actual key in Script Properties, never in this public repository.
const RSVP_ENDPOINT = 'https://afridi-wedding.vercel.app/api/rsvp-sync';
const RSVP_SPREADSHEET_ID = '1kvK3azfKBULPPEtVZHaiO5D6rBpY36v85pvx7OGlohI';
const RSVP_HEADERS = ['Received (IST)', 'Guest name', 'Attendance', 'Guests', 'Message', 'Response ID'];

function refreshRsvps() {
  const lock = LockService.getScriptLock();
  if (!lock.tryLock(1000)) return;
  const book = SpreadsheetApp.getActiveSpreadsheet();
  try {
    if (!book || book.getId() !== RSVP_SPREADSHEET_ID) throw new Error('Unexpected spreadsheet');
    const key = PropertiesService.getScriptProperties().getProperty('RSVP_SYNC_KEY');
    if (!key) throw new Error('RSVP_SYNC_KEY has not been configured');
    const response = UrlFetchApp.fetch(RSVP_ENDPOINT, {
      headers: { Authorization: 'Bearer ' + key }, muteHttpExceptions: true
    });
    if (response.getResponseCode() !== 200) throw new Error('Could not fetch RSVPs; existing rows retained');
    const data = JSON.parse(response.getContentText());
    if (data.ok !== true) throw new Error('Incomplete RSVP response');
    const plans = [['nikah', 'Wedding'], ['walima', 'Reception']].map(function (pair) {
      const sheet = book.getSheetByName(pair[1]);
      if (!sheet || !Array.isArray(data[pair[0]])) throw new Error('Missing event tab or data');
      const seen = new Set();
      const rows = data[pair[0]].map(function (r) {
        if (r.event !== pair[0] || typeof r.id !== 'string' || seen.has(r.id) ||
            typeof r.name !== 'string' || typeof r.message !== 'string' ||
            !['yes', 'no'].includes(r.attending) || !Number.isInteger(r.guests) ||
            !Number.isFinite(Date.parse(r.receivedAt))) throw new Error('Invalid RSVP response');
        seen.add(r.id);
        return [new Date(r.receivedAt), rsvpSafeText(r.name), r.attending === 'yes' ? 'Attending' : 'Declined',
          r.guests, rsvpSafeText(r.message), r.id];
      });
      return { sheet: sheet, rows: rows };
    });
    // Validate both snapshots before changing either tab. Write new rows before clearing old tails.
    plans.forEach(function (plan) {
      const sheet = plan.sheet;
      const oldCount = Math.max(sheet.getLastRow() - 1, 0);
      if (sheet.getMaxRows() < plan.rows.length + 1) sheet.insertRowsAfter(sheet.getMaxRows(), plan.rows.length + 1 - sheet.getMaxRows());
      sheet.getRange(1, 1, 1, 6).setValues([RSVP_HEADERS]);
      if (plan.rows.length) {
        sheet.getRange(2, 1, plan.rows.length, 6).setValues(plan.rows);
        sheet.getRange(2, 1, plan.rows.length, 1).setNumberFormat('dd mmm yyyy hh:mm');
      }
      if (oldCount > plan.rows.length) sheet.getRange(plan.rows.length + 2, 1, oldCount - plan.rows.length, 6).clearContent();
      sheet.getRange('H1').setValue('Last synced (IST)');
      sheet.getRange('H2').setValue(Utilities.formatDate(new Date(), 'Asia/Kolkata', 'dd MMM yyyy HH:mm:ss'));
    });
    SpreadsheetApp.flush();
  } finally { lock.releaseLock(); }
}

function rsvpSafeText(value) {
  return /^[\s]*[=+@-]/.test(value) ? "'" + value : value;
}

function installRsvpSync() {
  refreshRsvps();
  if (!ScriptApp.getProjectTriggers().some(function (t) { return t.getHandlerFunction() === 'refreshRsvps'; })) {
    ScriptApp.newTrigger('refreshRsvps').timeBased().everyMinutes(5).create();
  }
}
