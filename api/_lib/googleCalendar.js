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
