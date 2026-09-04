# Trailer Audit — BER8 Yard Operations

Daily damage & mismatch audit for Prime Trailers and Rentals at the BER8 yard.
1 Shunter + 1 YM log issues directly from a phone or laptop during their round;
each shift (Early / Twilight / Night) is required to complete 2 audits.

Live demo: `https://<your-github-username>.github.io/<repo-name>/`
(fill in once GitHub Pages is enabled — see below)

## Tech stack

No frameworks — HTML5, CSS3, vanilla JavaScript (ES Modules), **Firebase
(Firestore + Anonymous Auth)** as the shared, real-time data store. Same
architecture pattern throughout: `Page → FormService → Service → Firestore`,
one responsibility per file.

Data model: each audit session is a document in the `auditSessions`
collection; each issue logged during that audit is its own document in an
`entries` subcollection underneath it. A `counters/sessions` document hands
out sequential IDs (`AUD-00001`, `AUD-00002`, ...) safely even if two people
start an audit at the same moment.

There's no login screen — the app signs in anonymously on load (invisible to
the user) so Firestore's security rules can require "must be authenticated"
instead of being wide open to anyone who finds the project's API key.

## Running it locally

ES Modules are blocked by the browser when a file is opened directly
(`file://...`) — you need to serve it over `http://` instead:

```bash
python3 -m http.server 5500
```

then open `http://localhost:5500`. (Or use the VS Code "Live Server"
extension — right-click `index.html` → "Open with Live Server".)

## Firebase setup (one-time, already done for this project)

1. Firestore Database created (test mode).
2. Authentication → Sign-in method → Anonymous → enabled.
3. Web app registered, config copied into `js/firebaseConfig.js`.
4. **Still needed:** replace the default test-mode rules with the ones in
   `firestore.rules` — Console → Firestore Database → **Rules** tab → paste
   the contents of `firestore.rules` → **Publish**. Test-mode rules expire
   automatically after 30 days, so this isn't optional.

## Deploying with GitHub Pages

1. Create a new repository on GitHub (public, so Pages can serve it for free).
2. From this folder:
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git branch -M main
   git remote add origin https://github.com/<your-username>/<repo-name>.git
   git push -u origin main
   ```
3. On GitHub: **Settings → Pages → Source: Deploy from a branch → Branch:
   `main` / folder: `/ (root)`** → Save.
4. Wait ~1 minute, then your app is live at
   `https://<your-username>.github.io/<repo-name>/`.

## Testing checklist (do this before trusting it with real audits)

- [ ] Open the app in two different browser tabs (or one on your phone, one
      on your laptop). Start an audit in one, add an entry — confirm it
      appears in the other **without refreshing**.
- [ ] Complete an audit, then reopen it from History and add a Work ID —
      confirm it saves.
- [ ] Open the browser console (F12). If you see an error mentioning "the
      query requires an index," click the link inside that error — it
      creates the missing index automatically (~1 minute), then reload.
- [ ] Turn off WiFi, add an entry, turn WiFi back on — confirm it syncs once
      you're back online. (Starting a *new* audit needs a connection the
      moment you hit "Start Audit" — only adding entries within an
      already-started audit works offline.)

## Importing Location Audit rounds (Valet CSV)

The "Import" page reads the `eventReport` CSV export (Building/Yard, Location,
Event Type, Date UTC, User ID, ...), keeps only `LOCATION_AUDIT` rows, and
groups consecutive rows by the same User ID into "rounds" — one round is one
person's walk of the yard. A gap of more than 30 minutes between two scans by
the same user starts a new round (see `DEFAULT_GAP_MINUTES` in
`js/services/ImportService.js` if this needs to change).

Each round's timestamp is converted from UTC to Berlin local time
(DST-aware, via `Intl` — not a fixed offset), and that Berlin time is what
decides which shift (Early/Twilight/Night) and which calendar date the round
counts toward. These imported rounds count toward the "2 audits per shift"
target exactly the same as ones started manually in the app — the Dashboard
doesn't distinguish where an audit came from.

**Night shift date handling:** Night runs 20:45 to 06:00 the next morning, so
an audit logged at, say, 05:00 is calendar-wise "tomorrow" but is really
still that same Night shift. Anything logged before 06:00 gets attributed
back to the date the shift actually started (`getShiftBusinessDate` in
`js/constants.js`), so both audits from one Night shift land on the same
date and can both count toward that shift's target — otherwise the second
one would silently count toward the *next* day's Night shift instead. This
applies to Trailer Damage and Work ID records too, not just audit rounds.

For the same reason, the Dashboard's notion of "today" isn't just the raw
calendar date — before 06:00 Berlin, it's still yesterday's business day
(`getCurrentBusinessDate`), so checking the Dashboard at 5am shows last
night's still-relevant Night shift instead of an empty "today" that hasn't
started yet. From 06:00 onward it's the actual calendar date again.

An imported round becomes a Completed audit session with **no entries** (the
CSV only proves the location was scanned, not what was found there) — a
supervisor can still open it from History and add entries/Work IDs
afterward, same as any other completed audit. The list of locations scanned
is kept on the session and shown in its detail view.

Uploading overlapping CSV exports is safe — each round has a stable id
(User ID + start timestamp), and rounds already imported are shown as "Ya
importado" and skipped.

The same upload also scans **every** row's `Comment` column (not just
`LOCATION_AUDIT` rows) for two things: comments containing "DAMAGE",
"BROKEN", or "ISSUE" become **Trailer Damage** records, and comments
containing "Work ID", "WorkID", or "Work Request ID" become **Work ID**
records — each tagged with the trailer number (Vehicle # from the CSV,
falling back to License Plate), position (Location), and the Berlin
date/time of that row. These import automatically (no per-row selection
needed) and are deduplicated by content, so re-uploading an overlapping
export doesn't create duplicates.

The Dashboard's **Trailer Damage**, **Work IDs**, and **Issues Found** cards
count today's records from these collections specifically — not from issues
logged manually through the in-app audit form (those live separately as
entries within an audit session). "Issues Found" comes from `ADD_EQUIPMENT`
/ `REMOVE_EQUIPMENT` events that have a comment (most Add/Remove Equipment
rows are routine and get skipped — a comment on one usually means something
was worth flagging). Clicking any KPI card opens a detail list — the click
target is anywhere on the card.

## Known limitations

- **Brief flicker on load** — the very first render happens before Firebase
  data has arrived, so the page can flash an empty/default state for well
  under a second before the real data appears.
- **No real user accounts** — anyone with the link can start, edit, or
  delete any audit. Anonymous Auth blocks casual bots hitting the database
  directly, but it isn't real access control.
- **Night shift crosses midnight** — the audit's date is whatever you type
  when starting it; there's no automatic "which calendar day is this really"
  logic for the overnight shift.
