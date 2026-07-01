# Booking Page Setup

The `/booking` page lets visitors see when you're free (Google Calendar +
iCloud) and request a meeting, without exposing any calendar details. It's
served by two serverless functions (`api/availability.js`, `api/book.js`) in
the same Vercel project that already hosts the site and the contact form -
no separate deployment, no database. Google Calendar itself stores
everything: your real events determine busy times, and a booking request
becomes a tentative event on your calendar until you confirm or delete it.

These steps involve your own Google/Apple/Vercel accounts, so they need to be
done by you, not by an assistant.

## 1. Google Calendar API access

1. Go to [console.cloud.google.com](https://console.cloud.google.com/), create
   a project (or reuse one).
2. **APIs & Services → Library** → enable **Google Calendar API**.
3. **APIs & Services → OAuth consent screen** → User type "External" →
   fill the required fields → add your own Gmail as a **test user**. Testing
   mode is fine, this app is only ever used by you.
4. **APIs & Services → Credentials → Create Credentials → OAuth client ID** →
   Application type **Desktop app**. Copy the **Client ID** and **Client
   secret**.
5. Get a refresh token (one-time, run locally - needs `googleapis`, already
   a project dependency):
   ```bash
   GOOGLE_CLIENT_ID=your_client_id GOOGLE_CLIENT_SECRET=your_client_secret \
     node -e "
   const http = require('http');
   const { google } = require('googleapis');
   const REDIRECT_URI = 'http://localhost:53682/oauth2callback';
   const c = new google.auth.OAuth2(process.env.GOOGLE_CLIENT_ID, process.env.GOOGLE_CLIENT_SECRET, REDIRECT_URI);
   console.log(c.generateAuthUrl({ access_type: 'offline', prompt: 'consent', scope: ['https://www.googleapis.com/auth/calendar'] }));
   const s = http.createServer(async (req, res) => {
     if (!req.url.startsWith('/oauth2callback')) return;
     const code = new URL(req.url, REDIRECT_URI).searchParams.get('code');
     res.end('Done - close this tab.'); s.close();
     const { tokens } = await c.getToken(code);
     console.log('\nRefresh token:\n' + tokens.refresh_token);
   });
   s.listen(53682);
   "
   ```
   Open the printed URL, sign in, approve access. The refresh token prints in
   your terminal - save it for step 4.
6. Decide which calendar(s) to check. `primary` is your main Gmail calendar.
   To check more of your own Google calendars, find each one's Calendar ID in
   Google Calendar → calendar settings → "Integrate calendar", and
   comma-separate them (e.g. `primary,family_xxx@group.calendar.google.com`).

## 2. Email notifications (reuses the contact form's Resend account)

The booking emails go through the same [Resend](https://resend.com) account
and `RESEND_API_KEY` / `CONTACT_TO` / `CONTACT_FROM` env vars already used by
`api/contact.js`. If those are already set in Vercel, there's nothing extra
to do here.

## 3. iCloud (Apple) Calendar — read-only availability check

1. Go to [appleid.apple.com](https://appleid.apple.com) → Sign-In and
   Security → **App-Specific Passwords** → generate one.
2. Find the CalDAV URL of the specific calendar you want checked (run
   locally, replacing `APPLE_ID`/`APP_PASSWORD`):
   ```bash
   # Step A: find your principal URL
   curl -u 'APPLE_ID:APP_PASSWORD' -X PROPFIND https://caldav.icloud.com/ \
     -H 'Depth: 0' -H 'Content-Type: application/xml' \
     -d '<propfind xmlns="DAV:"><prop><current-user-principal/></prop></propfind>'

   # Step B: using the href from step A, find your calendar-home-set
   curl -u 'APPLE_ID:APP_PASSWORD' -X PROPFIND https://caldav.icloud.com/<principal-href> \
     -H 'Depth: 0' -H 'Content-Type: application/xml' \
     -d '<propfind xmlns="DAV:" xmlns:c="urn:ietf:params:xml:ns:caldav"><prop><c:calendar-home-set/></prop></propfind>'

   # Step C: using the href from step B, list calendars and their display names
   curl -u 'APPLE_ID:APP_PASSWORD' -X PROPFIND https://caldav.icloud.com/<home-href> \
     -H 'Depth: 1' -H 'Content-Type: application/xml' \
     -d '<propfind xmlns="DAV:"><prop><displayname/></prop></propfind>'
   ```
   Match the `displayname` to the calendar you want, and use its `href` as
   `https://caldav.icloud.com/<that-href>` for `APPLE_CALDAV_URL`.

   This is optional and read-only: only event start/end times are ever
   fetched, never titles or details. Recurring events aren't expanded, so
   they only block their first occurrence - avoid relying on a recurring
   iCloud event to block time (use Google Calendar for that instead).

## 4. Owner mode (block/unblock days from the page itself)

You can also close a day right from `/booking`, without opening Google
Calendar. Pick any long, random string as `ADMIN_TOKEN` (e.g. generate one
with `openssl rand -hex 24`) and add it as a Vercel env var.

To sign in as the owner, visit `https://igaltal.com/booking?admin=YOUR_TOKEN`
once - the token is then remembered in that browser (localStorage) and the
URL is cleaned up automatically. A small "Owner mode" badge appears, and a
lock icon shows next to each day so you can block/unblock it with one click.
Blocking a day just creates a real all-day "Blocked (via booking page)" event
on your Google Calendar, so it stays in sync even if you delete that event
manually. "Sign out" (shown next to the badge) forgets the token on that
device only.

## 5. Add environment variables in Vercel

In the Vercel dashboard for this project (the same one serving the site),
add:

`GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GOOGLE_REFRESH_TOKEN`,
`GOOGLE_CALENDAR_ID` (defaults to `primary`), `ADMIN_TOKEN`, and optionally
`APPLE_ID`, `APPLE_APP_SPECIFIC_PASSWORD`, `APPLE_CALDAV_URL`.

Redeploy after adding them (or they'll apply on the next deploy).

## Day-to-day use

- **Block a day off**: either use owner mode on `/booking` (see above), or
  just add an event on your Google Calendar like you always do - either way
  the booking page treats it as busy.
- **Approve/decline a request**: when someone requests a time, a tentative
  (yellow) event titled "Meeting request: <name>" appears on your Google
  Calendar, with their email and message in the description. Confirm it in
  Google Calendar to accept, or delete it to decline. The requester already
  received a "pending confirmation" email; follow up with them directly to
  finalize.
- **Meeting length**: visitors choose 15 min, 30 min, 1 hour, or 2 hours on
  the page itself - there's nothing to configure for that.

## Note on the standalone `booking-server` Vercel project

An earlier version of this feature deployed a separate Vercel project
(`booking-server`) with its own copies of these endpoints. That's now folded
into this project's `api/` folder instead, so the standalone project is no
longer needed - you can delete it from the Vercel dashboard whenever
convenient (it's on the free tier, so there's no cost either way).
