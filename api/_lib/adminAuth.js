// Gates the owner-only day-blocking endpoints. The owner signs in on the
// booking page with this token (stored in their browser's localStorage,
// never committed) and it's sent back as a header on each admin request.
export function isAuthorized(req) {
  const token = req.headers["x-admin-token"];
  return Boolean(process.env.ADMIN_TOKEN) && token === process.env.ADMIN_TOKEN;
}
