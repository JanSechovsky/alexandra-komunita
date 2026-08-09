/**
 * Alexandra · waitlist → Google Sheet
 *
 * SETUP, about three minutes:
 *  1. Make a new Google Sheet. Name it whatever you like.
 *  2. Extensions → Apps Script. Delete whatever is in the editor.
 *  3. Paste this whole file. Save.
 *  4. Deploy → New deployment → gear icon → Web app.
 *       Execute as:        Me
 *       Who has access:    Anyone            <- must be "Anyone", not "Anyone with Google account"
 *  5. Deploy, authorise, and copy the /exec URL it gives you.
 *  6. Send that URL to Jarvis. It goes into SHEET_ENDPOINT in index.html.
 *
 * The page posts with mode "no-cors", so it never sees the reply. That is
 * fine: Supabase is the source of truth and reports real errors, this sheet
 * is the mirror you actually read.
 */

var SHEET_NAME = 'Waitlist';

function doPost(e) {
  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sh = ss.getSheetByName(SHEET_NAME) || ss.insertSheet(SHEET_NAME);

    if (sh.getLastRow() === 0) {
      sh.appendRow(['Kdy', 'Jméno', 'E-mail', 'Telefon', 'Zdroj']);
      sh.getRange(1, 1, 1, 5).setFontWeight('bold');
      sh.setFrozenRows(1);
    }

    var p = (e && e.parameter) || {};
    var email = String(p.email || '').trim().toLowerCase();
    if (!email) return ContentService.createTextOutput('no email');

    // Skip a duplicate rather than growing a second row for the same person.
    var seen = sh.getLastRow() > 1
      ? sh.getRange(2, 3, sh.getLastRow() - 1, 1).getValues().map(function (r) {
          return String(r[0]).trim().toLowerCase();
        })
      : [];
    if (seen.indexOf(email) !== -1) return ContentService.createTextOutput('duplicate');

    sh.appendRow([
      new Date(),
      String(p.name || '').trim(),
      email,
      String(p.phone || '').trim(),
      String(p.source || '').trim()
    ]);
    return ContentService.createTextOutput('ok');
  } catch (err) {
    return ContentService.createTextOutput('error: ' + err);
  }
}

/** Lets you open the /exec URL in a browser to check it is alive. */
function doGet() {
  return ContentService.createTextOutput('waitlist endpoint alive');
}
