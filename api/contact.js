// Vercel serverless function: secure contact form handler.
//
// Security properties:
//   • Server-side validation (no trust in client).
//   • Honeypot field rejection (spam bots).
//   • Best-effort in-memory rate limiting per IP (see note for durable option).
//   • Secrets (RESEND_API_KEY) never reach the client bundle.
//
// Required env vars (set in Vercel project settings, NOT committed):
//   RESEND_API_KEY   — from https://resend.com (server-only)
//   CONTACT_TO       — destination inbox (defaults to the address below)
//   CONTACT_FROM     — verified sender, e.g. "Portfolio <contact@igaltal.com>"
//
// For durable, multi-instance rate limiting use @upstash/ratelimit + Upstash Redis
// (free tier). The in-memory limiter below resets per cold start / instance.

import { z } from "zod";

const schema = z.object({
  from_name: z.string().trim().min(2).max(100),
  from_email: z.string().trim().email().max(200),
  message: z.string().trim().min(10).max(5000),
  company: z.string().optional(), // honeypot
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

  const { from_name, from_email, message, company } = parsed.data;

  // Honeypot: real users never see/fill this field.
  if (company && company.trim() !== "") {
    return res.status(200).json({ ok: true }); // silently accept & drop
  }

  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.error("RESEND_API_KEY is not configured");
    return res.status(503).json({ error: "Email service unavailable" });
  }

  const to = process.env.CONTACT_TO || "talm13124@gmail.com";
  const from = process.env.CONTACT_FROM || "Portfolio Contact <onboarding@resend.dev>";

  try {
    const r = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from,
        to,
        reply_to: from_email,
        subject: `Portfolio contact from ${from_name}`,
        html: `
          <h2>New portfolio message</h2>
          <p><strong>Name:</strong> ${escapeHtml(from_name)}</p>
          <p><strong>Email:</strong> ${escapeHtml(from_email)}</p>
          <p><strong>Message:</strong></p>
          <p style="white-space:pre-wrap">${escapeHtml(message)}</p>
        `,
      }),
    });

    if (!r.ok) {
      console.error("Resend error", r.status, await r.text());
      return res.status(502).json({ error: "Failed to send" });
    }
    return res.status(200).json({ ok: true });
  } catch (err) {
    console.error("Contact handler error", err);
    return res.status(500).json({ error: "Unexpected error" });
  }
}
