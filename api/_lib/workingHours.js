// Owner-configurable availability rules. Edit these directly, or block a
// single day from the booking page itself (see api/block-day.js) - either
// way it's a real Google Calendar event, so there's nothing else to sync.

export const TIMEZONE = "Asia/Jerusalem";

// 0 = Sunday ... 6 = Saturday
export const WORKING_DAYS = [0, 1, 2, 3, 4]; // Sunday - Thursday

export const START_HOUR = 9; // 09:00
export const END_HOUR = 18; // 18:00

// Smallest start-time increment the calendar grid snaps to. Visitors can
// still book any duration (15/30/60/120 min - see DURATIONS in Booking.jsx);
// this only controls which start times are considered.
export const SLOT_MINUTES = 15;

// Don't allow booking a slot less than this many hours from now.
export const MIN_NOTICE_HOURS = 12;

// Don't allow booking further out than this many days.
export const MAX_DAYS_AHEAD = 30;
