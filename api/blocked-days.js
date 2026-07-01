// Vercel serverless function: owner-only. Lists which days in a range have
// been blocked via the booking page (see api/block-day.js).

import { isAuthorized } from "./_lib/adminAuth.js";
import { listBlockedDays } from "./_lib/googleCalendar.js";

export default async function handler(req, res) {
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return res.status(405).json({ error: "Method not allowed" });
  }

  if (!isAuthorized(req)) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const { start, end } = req.query;
  if (!start || !end || Number.isNaN(new Date(start).getTime()) || Number.isNaN(new Date(end).getTime())) {
    return res.status(400).json({ error: "start and end query params are required (ISO dates)" });
  }

  try {
    const blockedDays = await listBlockedDays(start, end);
    res.status(200).json({ blockedDays });
  } catch (err) {
    console.error("Blocked-days handler error", err);
    res.status(500).json({ error: "Failed to fetch blocked days" });
  }
}
