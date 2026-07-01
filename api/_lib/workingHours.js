// Owner-configurable availability rules. Edit these directly - no admin UI.
// To block a specific day off, just add an event on your Google Calendar for
// that day; it will automatically show as busy without any change here.

export const TIMEZONE = "Asia/Jerusalem";

// 0 = Sunday ... 6 = Saturday
export const WORKING_DAYS = [0, 1, 2, 3, 4]; // Sunday - Thursday

export const START_HOUR = 9; // 09:00
export const END_HOUR = 18; // 18:00
export const SLOT_MINUTES = 30;

// Don't allow booking a slot less than this many hours from now.
export const MIN_NOTICE_HOURS = 12;

// Don't allow booking further out than this many days.
export const MAX_DAYS_AHEAD = 30;
