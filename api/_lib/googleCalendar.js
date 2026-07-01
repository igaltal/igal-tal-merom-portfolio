import { google } from "googleapis";

function getOAuthClient() {
  const client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET
  );
  client.setCredentials({ refresh_token: process.env.GOOGLE_REFRESH_TOKEN });
  return client;
}

function calendarIds() {
  return (process.env.GOOGLE_CALENDAR_ID || "primary")
    .split(",")
    .map((id) => id.trim())
    .filter(Boolean);
}

export async function getGoogleBusy(timeMin, timeMax) {
  const auth = getOAuthClient();
  const calendar = google.calendar({ version: "v3", auth });
  const ids = calendarIds();

  const res = await calendar.freebusy.query({
    requestBody: {
      timeMin,
      timeMax,
      items: ids.map((id) => ({ id })),
    },
  });

  const busy = [];
  for (const id of ids) {
    const entry = res.data.calendars?.[id];
    if (entry?.busy) busy.push(...entry.busy);
  }
  return busy;
}

// Inserted as "tentative" - the owner confirms or deletes it in their own
// Google Calendar app to accept/decline a booking request.
export async function createTentativeEvent({ summary, description, start, end, timeZone }) {
  const auth = getOAuthClient();
  const calendar = google.calendar({ version: "v3", auth });

  const res = await calendar.events.insert({
    calendarId: calendarIds()[0],
    requestBody: {
      summary,
      description,
      start: { dateTime: start, timeZone },
      end: { dateTime: end, timeZone },
      status: "tentative",
      colorId: "5",
    },
  });

  return res.data;
}

const BLOCK_SUMMARY = "Blocked (via booking page)";

function addDays(dateStr, n) {
  const d = new Date(dateStr + "T00:00:00Z");
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}

// Blocking a day just creates a real all-day event on the owner's primary
// calendar - it shows as busy through the exact same getGoogleBusy() path
// used for everything else, so no separate "blocked days" storage exists.
export async function blockDay(dateStr) {
  const auth = getOAuthClient();
  const calendar = google.calendar({ version: "v3", auth });

  const res = await calendar.events.insert({
    calendarId: calendarIds()[0],
    requestBody: {
      summary: BLOCK_SUMMARY,
      start: { date: dateStr },
      end: { date: addDays(dateStr, 1) },
      transparency: "opaque",
    },
  });

  return res.data;
}

export async function unblockDay(dateStr) {
  const auth = getOAuthClient();
  const calendar = google.calendar({ version: "v3", auth });
  const calendarId = calendarIds()[0];

  const list = await calendar.events.list({
    calendarId,
    timeMin: new Date(`${dateStr}T00:00:00Z`).toISOString(),
    timeMax: new Date(`${addDays(dateStr, 1)}T00:00:00Z`).toISOString(),
    q: BLOCK_SUMMARY,
    singleEvents: true,
  });

  const matches = (list.data.items || []).filter((e) => e.summary === BLOCK_SUMMARY);
  await Promise.all(matches.map((e) => calendar.events.delete({ calendarId, eventId: e.id })));
  return { deleted: matches.length };
}

export async function listBlockedDays(timeMin, timeMax) {
  const auth = getOAuthClient();
  const calendar = google.calendar({ version: "v3", auth });

  const list = await calendar.events.list({
    calendarId: calendarIds()[0],
    timeMin,
    timeMax,
    q: BLOCK_SUMMARY,
    singleEvents: true,
  });

  return (list.data.items || [])
    .filter((e) => e.summary === BLOCK_SUMMARY && e.start?.date)
    .map((e) => e.start.date);
}
