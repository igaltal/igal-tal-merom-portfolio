// Vercel serverless function: owner-only. Blocks or unblocks a whole day by
// creating/removing a real all-day event on Google Calendar - that event is
// the only "state" this feature has, so it stays in sync with the calendar
// automatically (deleting it manually in Google Calendar unblocks the day
// too).

import { z } from "zod";
import { isAuthorized } from "./_lib/adminAuth.js";
import { blockDay, unblockDay } from "./_lib/googleCalendar.js";

const schema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Expected YYYY-MM-DD"),
  action: z.enum(["block", "unblock"]),
});

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method not allowed" });
  }

  if (!isAuthorized(req)) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const parsed = schema.safeParse(req.body || {});
  if (!parsed.success) {
    return res.status(400).json({ error: "Invalid request" });
  }

  try {
    if (parsed.data.action === "block") {
      await blockDay(parsed.data.date);
    } else {
      await unblockDay(parsed.data.date);
    }
    res.status(200).json({ ok: true });
  } catch (err) {
    console.error("Block-day handler error", err);
    res.status(500).json({ error: "Failed to update calendar" });
  }
}
