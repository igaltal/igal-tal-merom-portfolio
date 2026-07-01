// Read-only free/busy check against an iCloud calendar via CalDAV.
// APPLE_CALDAV_URL must point directly at the specific calendar collection
// (see BOOKING_SETUP.md for how to discover it). Only start/end times are
// read - event titles/descriptions are never fetched or exposed.
//
// Note: recurring events (RRULE) are not expanded and will only block their
// first occurrence. For a personal calendar this is a reasonable trade-off;
// avoid relying on recurring iCloud events to block time.

function toCalDavDate(iso) {
  return new Date(iso).toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";
}

function parseICalDate(value) {
  if (!value) return null;
  const m = value.match(/^(\d{4})(\d{2})(\d{2})(T(\d{2})(\d{2})(\d{2})Z?)?$/);
  if (!m) return null;
  const [, y, mo, d, , h = "00", mi = "00", s = "00"] = m;
  return `${y}-${mo}-${d}T${h}:${mi}:${s}Z`;
}

export async function getAppleBusy(timeMinISO, timeMaxISO) {
  const url = process.env.APPLE_CALDAV_URL;
  const user = process.env.APPLE_ID;
  const pass = process.env.APPLE_APP_SPECIFIC_PASSWORD;

  if (!url || !user || !pass) return [];

  const body = `<?xml version="1.0" encoding="utf-8" ?>
<C:calendar-query xmlns:D="DAV:" xmlns:C="urn:ietf:params:xml:ns:caldav">
  <D:prop>
    <C:calendar-data/>
  </D:prop>
  <C:filter>
    <C:comp-filter name="VCALENDAR">
      <C:comp-filter name="VEVENT">
        <C:time-range start="${toCalDavDate(timeMinISO)}" end="${toCalDavDate(timeMaxISO)}"/>
      </C:comp-filter>
    </C:comp-filter>
  </C:filter>
</C:calendar-query>`;

  const auth = Buffer.from(`${user}:${pass}`).toString("base64");
  const res = await fetch(url, {
    method: "REPORT",
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
      Depth: "1",
      Authorization: `Basic ${auth}`,
    },
    body,
  });

  if (!res.ok) {
    console.error("CalDAV REPORT failed", res.status, await res.text());
    return [];
  }

  const xml = await res.text();
  const busy = [];
  const veventBlocks = xml.match(/BEGIN:VEVENT[\s\S]*?END:VEVENT/g) || [];
  for (const block of veventBlocks) {
    const start = parseICalDate(block.match(/DTSTART[^:\r\n]*:([^\r\n]+)/)?.[1]);
    const end = parseICalDate(block.match(/DTEND[^:\r\n]*:([^\r\n]+)/)?.[1]);
    if (start && end) busy.push({ start, end });
  }
  return busy;
}
