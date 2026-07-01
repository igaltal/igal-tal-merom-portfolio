// Vercel serverless function: public read-only availability check.
//
// Returns merged busy intervals (Google Calendar + iCloud) plus the
// configured working-hours rules. Never returns event titles/attendees -
// only start/end times, so visitors only ever see free vs. busy.

import { getGoogleBusy } from "./_lib/googleCalendar.js";
import { getAppleBusy } from "./_lib/appleCalDAV.js";
import {
  WORKING_DAYS,
  START_HOUR,
  END_HOUR,
  SLOT_MINUTES,
  TIMEZONE,
  MIN_NOTICE_HOURS,
  MAX_DAYS_AHEAD,
} from "./_lib/workingHours.js";

function mergeBusy(intervals) {
  const sorted = intervals
    .map((b) => ({ start: new Date(b.start).getTime(), end: new Date(b.end).getTime() }))
    .sort((a, b) => a.start - b.start);

  const merged = [];
  for (const cur of sorted) {
    const last = merged[merged.length - 1];
    if (last && cur.start <= last.end) {
      last.end = Math.max(last.end, cur.end);
    } else {
      merged.push({ ...cur });
    }
  }
  return merged.map((b) => ({ start: new Date(b.start).toISOString(), end: new Date(b.end).toISOString() }));
}

export default async function handler(req, res) {
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { start, end } = req.query;
  if (!start || !end || Number.isNaN(new Date(start).getTime()) || Number.isNaN(new Date(end).getTime())) {
    return res.status(400).json({ error: "start and end query params are required (ISO dates)" });
  }

  try {
    const [googleBusy, appleBusy] = await Promise.all([
      getGoogleBusy(start, end),
      getAppleBusy(start, end),
    ]);

    res.status(200).json({
      busy: mergeBusy([...googleBusy, ...appleBusy]),
      workingHours: {
        days: WORKING_DAYS,
        startHour: START_HOUR,
        endHour: END_HOUR,
        slotMinutes: SLOT_MINUTES,
        timeZone: TIMEZONE,
      },
      minNoticeHours: MIN_NOTICE_HOURS,
      maxDaysAhead: MAX_DAYS_AHEAD,
    });
  } catch (err) {
    console.error("Availability handler error", err);
    res.status(500).json({ error: "Failed to fetch availability" });
  }
}
