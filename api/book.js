// Vercel serverless function: meeting request handler.
//
// Re-validates the requested slot is still free, then inserts a *tentative*
// event on the owner's Google Calendar - that event doubles as the pending
// request record (no database). The owner confirms or deletes it in their
// own Google Calendar app to accept/decline. Emails both parties via Resend,
// same provider/pattern as api/contact.js.
//
// Required env vars (set in Vercel project settings, NOT committed):
//   GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, GOOGLE_REFRESH_TOKEN
//   GOOGLE_CALENDAR_ID  (defaults to "primary")
//   APPLE_ID, APPLE_APP_SPECIFIC_PASSWORD, APPLE_CALDAV_URL  (optional)
//   RESEND_API_KEY, CONTACT_TO, CONTACT_FROM  (shared with the contact form)

import { z } from "zod";
import { getGoogleBusy, createTentativeEvent } from "./_lib/googleCalendar.js";
import { getAppleBusy } from "./_lib/appleCalDAV.js";
import { TIMEZONE } from "./_lib/workingHours.js";

const schema = z.object({
  name: z.string().trim().min(2).max(100),
  email: z.string().trim().email().max(200),
  message: z.string().trim().max(2000).optional(),
  start: z.string().datetime(),
  end: z.string().datetime(),
});

const WINDOW_MS = 10 * 60 * 1000; // 10 minutes
const MAX_PER_WINDOW = 5;
const hits = new Map(); // ip -> number[] (timestamps)

function rateLimited(ip) {
  const now = Date.now();
  const recent = (hits.get(ip) || []).filter((t) => now - t < WINDOW_MS);
  recent.push(now);
  hits.set(ip, recent);
  return recent.length > MAX_PER_WINDOW;
}

function clientIp(req) {
  const fwd = req.headers["x-forwarded-for"];
  if (typeof fwd === "string" && fwd.length) return fwd.split(",")[0].trim();
  return req.socket?.remoteAddress || "unknown";
}

function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, (c) => (
    { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]
  ));
}

async function sendEmail({ apiKey, from, to, replyTo, subject, html }) {
  const r = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ from, to, reply_to: replyTo, subject, html }),
  });
  if (!r.ok) console.error("Resend error", r.status, await r.text());
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method not allowed" });
  }

  if (rateLimited(clientIp(req))) {
    return res.status(429).json({ error: "Too many requests" });
  }

  const parsed = schema.safeParse(req.body || {});
  if (!parsed.success) {
    return res.status(400).json({ error: "Invalid submission" });
  }

  const { name, email, message, start, end } = parsed.data;

  if (new Date(start).getTime() >= new Date(end).getTime()) {
    return res.status(400).json({ error: "Invalid time range" });
  }

  try {
    const [googleBusy, appleBusy] = await Promise.all([
      getGoogleBusy(start, end),
      getAppleBusy(start, end),
    ]);

    const requestedStart = new Date(start).getTime();
    const requestedEnd = new Date(end).getTime();
    const overlaps = [...googleBusy, ...appleBusy].some((b) => {
      const bStart = new Date(b.start).getTime();
      const bEnd = new Date(b.end).getTime();
      return requestedStart < bEnd && requestedEnd > bStart;
    });

    if (overlaps) {
      return res.status(409).json({ error: "This time slot is no longer available. Please pick another." });
    }

    const event = await createTentativeEvent({
      summary: `Meeting request: ${name}`,
      description: `Requested via portfolio site.\nEmail: ${email}\nMessage: ${message || "(none)"}`,
      start,
      end,
      timeZone: TIMEZONE,
    });

    const apiKey = process.env.RESEND_API_KEY;
    if (apiKey) {
      const ownerEmail = process.env.CONTACT_TO || "talm13124@gmail.com";
      const fromAddress = process.env.CONTACT_FROM || "Portfolio Contact <onboarding@resend.dev>";
      const when = `${new Date(start).toLocaleString("en-US", {
        timeZone: TIMEZONE,
        dateStyle: "full",
        timeStyle: "short",
      })} - ${new Date(end).toLocaleString("en-US", { timeZone: TIMEZONE, timeStyle: "short" })}`;

      await sendEmail({
        apiKey,
        from: fromAddress,
        to: ownerEmail,
        replyTo: email,
        subject: `New meeting request from ${name}`,
        html: `
          <h2>New meeting request</h2>
          <p><strong>${escapeHtml(name)}</strong> (${escapeHtml(email)}) requested:</p>
          <p>${escapeHtml(when)}</p>
          <p><strong>Message:</strong></p>
          <p style="white-space:pre-wrap">${escapeHtml(message || "(none)")}</p>
          <p>A tentative event was added to your Google Calendar - confirm it there to accept, or delete it to decline.</p>
        `,
      });

      await sendEmail({
        apiKey,
        from: fromAddress,
        to: email,
        subject: "Your meeting request has been received",
        html: `
          <p>Hi ${escapeHtml(name)},</p>
          <p>Thanks for reaching out! Your request for ${escapeHtml(when)} has been received and is pending confirmation. I'll follow up by email shortly.</p>
          <p>Best,<br/>Igal</p>
        `,
      });
    } else {
      console.error("RESEND_API_KEY is not configured - skipping booking emails");
    }

    res.status(200).json({ ok: true, eventId: event.id });
  } catch (err) {
    console.error("Booking handler error", err);
    res.status(500).json({ error: "Failed to submit booking request" });
  }
}
