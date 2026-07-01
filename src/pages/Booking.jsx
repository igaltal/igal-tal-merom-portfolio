import { useEffect, useMemo, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import Seo from "@/components/Seo";
import { motion } from "framer-motion";
import {
  CalendarClock,
  ChevronLeft,
  ChevronRight,
  Clock,
  CheckCircle2,
  Loader2,
  Lock,
  Unlock,
} from "lucide-react";
import { useToast } from "@/components/ui/use-toast";

const ADMIN_TOKEN_STORAGE_KEY = "bookingAdminToken";

const DURATIONS = [
  { label: "15 min", value: 15 },
  { label: "30 min", value: 30 },
  { label: "1 hour", value: 60 },
  { label: "2 hours", value: 120 },
];

// Fallback working-hours used only until /api/availability responds, so the
// calendar isn't empty on first paint. The backend's own config (api/_lib/
// workingHours.js) is the source of truth for what's actually bookable.
const DEFAULT_WORKING_HOURS = {
  days: [0, 1, 2, 3, 4],
  startHour: 9,
  endHour: 18,
  slotMinutes: 15,
  timeZone: "Asia/Jerusalem",
};
const DEFAULT_MIN_NOTICE_HOURS = 12;

function startOfDay(date) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

function isSameDay(a, b) {
  return a && b && startOfDay(a).getTime() === startOfDay(b).getTime();
}

function dateKey(date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(
    date.getDate()
  ).padStart(2, "0")}`;
}

function buildMonthCells(year, month) {
  const firstDay = new Date(year, month, 1);
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells = [];
  for (let i = 0; i < firstDay.getDay(); i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(new Date(year, month, d));
  while (cells.length % 7 !== 0) cells.push(null);
  return cells;
}

function isRangeBookable(start, duration, workingHours, busy, minNoticeHours) {
  const end = new Date(start.getTime() + duration * 60000);
  const dayStart = startOfDay(start);
  const withinHours =
    start.getTime() >= dayStart.getTime() + workingHours.startHour * 3600000 &&
    end.getTime() <= dayStart.getTime() + workingHours.endHour * 3600000;
  if (!withinHours) return false;
  if (start.getTime() < Date.now() + minNoticeHours * 3600000) return false;
  return !busy.some((b) => start < new Date(b.end) && end > new Date(b.start));
}

function buildSlotsForDay(day, workingHours, busy, duration, minNoticeHours) {
  const step = workingHours.slotMinutes || 15;
  const { startHour, endHour } = workingHours;
  const slots = [];
  const dayStart = startOfDay(day);

  for (let minutes = startHour * 60; minutes + duration <= endHour * 60; minutes += step) {
    const start = new Date(dayStart.getTime() + minutes * 60000);
    if (isRangeBookable(start, duration, workingHours, busy, minNoticeHours)) {
      slots.push({ start, end: new Date(start.getTime() + duration * 60000) });
    }
  }

  return slots;
}

function formatTime(date) {
  return date.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
}

function formatDay(date) {
  return date.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" });
}

function RequestForm({ selectedSlot, onChooseDifferentTime, form, setForm, isSubmitting, onSubmit }) {
  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div>
        <p className="text-sm text-slate-500">You&apos;re requesting</p>
        <p className="font-semibold text-slate-900">
          {formatDay(selectedSlot.start)} {" · "} {formatTime(selectedSlot.start)}
          {"–"}
          {formatTime(selectedSlot.end)}
        </p>
        <button
          type="button"
          className="text-sm text-blue-600 hover:underline mt-1"
          onClick={onChooseDifferentTime}
        >
          Choose a different time
        </button>
      </div>

      <div>
        <Label htmlFor="name">Your name</Label>
        <Input
          id="name"
          required
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
        />
      </div>
      <div>
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          type="email"
          required
          value={form.email}
          onChange={(e) => setForm({ ...form, email: e.target.value })}
        />
      </div>
      <div>
        <Label htmlFor="message">What&apos;s this about? (optional)</Label>
        <Textarea
          id="message"
          rows={3}
          value={form.message}
          onChange={(e) => setForm({ ...form, message: e.target.value })}
        />
      </div>

      <Button type="submit" className="w-full" disabled={isSubmitting}>
        {isSubmitting ? (
          <Loader2 className="w-4 h-4 animate-spin mr-2" />
        ) : (
          <CalendarClock className="w-4 h-4 mr-2" />
        )}
        Request this time
      </Button>
    </form>
  );
}

export default function Booking() {
  const { toast } = useToast();
  const today = useMemo(() => startOfDay(new Date()), []);
  const [month, setMonth] = useState(new Date(today.getFullYear(), today.getMonth(), 1));
  const [duration, setDuration] = useState(30);
  const [selectedDay, setSelectedDay] = useState(null);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [showExactTime, setShowExactTime] = useState(false);
  const [exactTime, setExactTime] = useState("");
  const [exactTimeError, setExactTimeError] = useState(null);
  const [busy, setBusy] = useState([]);
  const [workingHours, setWorkingHours] = useState(DEFAULT_WORKING_HOURS);
  const [minNoticeHours, setMinNoticeHours] = useState(DEFAULT_MIN_NOTICE_HOURS);
  const [isLoadingAvailability, setIsLoadingAvailability] = useState(false);
  const [loadError, setLoadError] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", message: "" });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const [adminToken, setAdminToken] = useState(null);
  const [showAdminLogin, setShowAdminLogin] = useState(false);
  const [adminTokenInput, setAdminTokenInput] = useState("");
  const [adminError, setAdminError] = useState(null);
  const [blockedDays, setBlockedDays] = useState(new Set());

  // Owner sign-in: accept ?admin=TOKEN once, then remember it locally and
  // scrub it from the visible URL. Otherwise pick up a previously saved token.
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const urlToken = params.get("admin");
    if (urlToken) {
      localStorage.setItem(ADMIN_TOKEN_STORAGE_KEY, urlToken);
      window.history.replaceState(null, "", window.location.pathname);
      setAdminToken(urlToken);
    } else {
      const stored = localStorage.getItem(ADMIN_TOKEN_STORAGE_KEY);
      if (stored) setAdminToken(stored);
    }
  }, []);

  useEffect(() => {
    const rangeStart = startOfDay(new Date(month.getFullYear(), month.getMonth(), 1));
    const rangeEnd = new Date(month.getFullYear(), month.getMonth() + 1, 1);

    setIsLoadingAvailability(true);
    setLoadError(false);

    fetch(
      `/api/availability?start=${encodeURIComponent(rangeStart.toISOString())}&end=${encodeURIComponent(
        rangeEnd.toISOString()
      )}`
    )
      .then((res) => {
        if (!res.ok) throw new Error("Request failed");
        return res.json();
      })
      .then((data) => {
        setBusy(data.busy || []);
        if (data.workingHours) setWorkingHours(data.workingHours);
        if (typeof data.minNoticeHours === "number") setMinNoticeHours(data.minNoticeHours);
      })
      .catch(() => setLoadError(true))
      .finally(() => setIsLoadingAvailability(false));
  }, [month]);

  useEffect(() => {
    if (!adminToken) {
      setBlockedDays(new Set());
      return;
    }
    const rangeStart = startOfDay(new Date(month.getFullYear(), month.getMonth(), 1));
    const rangeEnd = new Date(month.getFullYear(), month.getMonth() + 1, 1);

    fetch(
      `/api/blocked-days?start=${encodeURIComponent(rangeStart.toISOString())}&end=${encodeURIComponent(
        rangeEnd.toISOString()
      )}`,
      { headers: { "x-admin-token": adminToken } }
    )
      .then((res) => {
        if (res.status === 401) throw new Error("unauthorized");
        if (!res.ok) throw new Error("failed");
        return res.json();
      })
      .then((data) => setBlockedDays(new Set(data.blockedDays || [])))
      .catch((err) => {
        if (err.message === "unauthorized") {
          setAdminError("That owner token was rejected.");
          setAdminToken(null);
          localStorage.removeItem(ADMIN_TOKEN_STORAGE_KEY);
        }
      });
  }, [adminToken, month]);

  const monthCells = useMemo(() => buildMonthCells(month.getFullYear(), month.getMonth()), [month]);

  const daySlots = useMemo(() => {
    if (!selectedDay) return [];
    return buildSlotsForDay(selectedDay, workingHours, busy, duration, minNoticeHours);
  }, [selectedDay, workingHours, busy, duration, minNoticeHours]);

  const isDayDisabled = (day) => {
    if (day < today) return true;
    if (!workingHours.days.includes(day.getDay())) return true;
    if (blockedDays.has(dateKey(day))) return true;
    return buildSlotsForDay(day, workingHours, busy, duration, minNoticeHours).length === 0;
  };

  const selectedDayBlocked = selectedDay ? blockedDays.has(dateKey(selectedDay)) : false;

  const resetTimeSelection = () => {
    setSelectedSlot(null);
    setShowExactTime(false);
    setExactTime("");
    setExactTimeError(null);
  };

  const handleSelectDay = (day) => {
    setSelectedDay(day);
    resetTimeSelection();
  };

  const changeMonth = (delta) => {
    setMonth(new Date(month.getFullYear(), month.getMonth() + delta, 1));
    setSelectedDay(null);
    resetTimeSelection();
  };

  const handleUseExactTime = () => {
    if (!exactTime || !selectedDay) return;
    const [h, m] = exactTime.split(":").map(Number);
    const start = new Date(startOfDay(selectedDay).getTime() + (h * 60 + m) * 60000);

    if (!isRangeBookable(start, duration, workingHours, busy, minNoticeHours)) {
      setExactTimeError("That time isn't available - please pick another.");
      return;
    }
    setExactTimeError(null);
    setSelectedSlot({ start, end: new Date(start.getTime() + duration * 60000) });
  };

  const handleAdminLogin = (e) => {
    e.preventDefault();
    const token = adminTokenInput.trim();
    if (!token) return;
    setAdminError(null);
    setAdminToken(token);
    localStorage.setItem(ADMIN_TOKEN_STORAGE_KEY, token);
    setShowAdminLogin(false);
    setAdminTokenInput("");
  };

  const handleAdminLogout = () => {
    setAdminToken(null);
    localStorage.removeItem(ADMIN_TOKEN_STORAGE_KEY);
    setBlockedDays(new Set());
  };

  const handleToggleBlock = async () => {
    if (!selectedDay) return;
    const key = dateKey(selectedDay);
    const action = blockedDays.has(key) ? "unblock" : "block";

    try {
      const res = await fetch("/api/block-day", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-admin-token": adminToken },
        body: JSON.stringify({ date: key, action }),
      });
      if (!res.ok) throw new Error();

      setBlockedDays((prev) => {
        const next = new Set(prev);
        if (action === "block") next.add(key);
        else next.delete(key);
        return next;
      });
      setMonth(new Date(month));
    } catch {
      toast({ title: "Could not update that day", variant: "destructive" });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedSlot) return;
    setIsSubmitting(true);

    try {
      const res = await fetch("/api/book", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name,
          email: form.email,
          message: form.message,
          start: selectedSlot.start.toISOString(),
          end: selectedSlot.end.toISOString(),
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        toast({
          title: "Couldn't send your request",
          description: data.error || "Please try another time slot.",
          variant: "destructive",
        });
        if (res.status === 409) {
          resetTimeSelection();
          setMonth(new Date(month));
        }
        return;
      }

      setIsSubmitted(true);
    } catch {
      toast({
        title: "Couldn't send your request",
        description: "Please check your connection and try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const isAdmin = Boolean(adminToken);

  return (
    <>
      <Seo
        title="Book a Meeting — Igal Tal Merom"
        description="Check my real-time availability and request a time to meet."
        path="/booking"
      />
      <section className="pt-28 pb-16 md:pt-32 bg-slate-50 min-h-screen">
        <div className="container mx-auto px-4 md:px-6 max-w-3xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-8"
          >
            <div className="inline-flex items-center gap-2 text-blue-600 font-medium mb-2">
              <CalendarClock className="w-5 h-5" />
              Book a Meeting
            </div>
            <h1 className="text-2xl md:text-3xl font-bold text-slate-900 mb-2">
              Find a time that works for both of us
            </h1>
            <p className="text-slate-600 max-w-lg mx-auto text-sm md:text-base">
              You&apos;ll only ever see whether I&apos;m free or busy — no calendar details are
              shared. I&apos;ll confirm by email once I approve the request.
            </p>
          </motion.div>

          {loadError && (
            <Card className="p-6 mb-8 border-amber-200 bg-amber-50 text-amber-800 text-sm">
              Availability isn&apos;t available right now. Please try again later, or reach
              out via the contact form instead.
            </Card>
          )}

          {isSubmitted ? (
            <Card className="p-8 text-center">
              <CheckCircle2 className="w-12 h-12 text-green-600 mx-auto mb-4" />
              <h2 className="text-xl font-semibold text-slate-900 mb-2">Request sent!</h2>
              <p className="text-slate-600">
                Thanks, {form.name.split(" ")[0]}. Your request is pending confirmation —
                I&apos;ll follow up by email shortly.
              </p>
            </Card>
          ) : (
            <Card className="overflow-hidden">
              <div className="grid md:grid-cols-2">
                <div className="p-5 md:p-6 border-b md:border-b-0 md:border-r border-slate-100">
                  <div className="flex items-center justify-between mb-4">
                    <Button variant="ghost" size="icon" onClick={() => changeMonth(-1)} aria-label="Previous month">
                      <ChevronLeft className="w-4 h-4" />
                    </Button>
                    <span className="font-medium text-slate-900">
                      {month.toLocaleDateString("en-US", { month: "long", year: "numeric" })}
                    </span>
                    <Button variant="ghost" size="icon" onClick={() => changeMonth(1)} aria-label="Next month">
                      <ChevronRight className="w-4 h-4" />
                    </Button>
                  </div>

                  <div className="grid grid-cols-7 text-center text-xs text-muted-foreground mb-2">
                    {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((label) => (
                      <div key={label}>{label}</div>
                    ))}
                  </div>

                  <div className="grid grid-cols-7 gap-y-1 place-items-center">
                    {monthCells.map((day, i) => {
                      if (!day) return <div key={i} />;
                      const disabled = isDayDisabled(day);
                      const selected = isSameDay(day, selectedDay);
                      return (
                        <button
                          key={i}
                          type="button"
                          disabled={disabled}
                          onClick={() => handleSelectDay(day)}
                          className={`h-9 w-9 rounded-full text-sm transition-colors ${
                            selected
                              ? "bg-blue-600 text-white font-medium"
                              : disabled
                              ? "text-muted-foreground opacity-40 cursor-not-allowed"
                              : isSameDay(day, today)
                              ? "text-blue-600 font-medium hover:bg-blue-50"
                              : "hover:bg-blue-50 text-slate-900"
                          }`}
                        >
                          {day.getDate()}
                        </button>
                      );
                    })}
                  </div>

                  {isLoadingAvailability && (
                    <div className="flex items-center justify-center gap-2 text-sm text-slate-500 mt-3">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Checking availability...
                    </div>
                  )}
                </div>

                <div className="p-5 md:p-6 flex flex-col">
                  {!selectedDay && (
                    <div className="flex-1 flex items-center justify-center text-slate-500 text-sm text-center py-12">
                      Select a date to see available times.
                    </div>
                  )}

                  {selectedDay && !selectedSlot && (
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <h3 className="font-semibold text-slate-900">{formatDay(selectedDay)}</h3>
                        {isAdmin && (
                          <button
                            type="button"
                            onClick={handleToggleBlock}
                            className={`inline-flex items-center gap-1 text-xs font-medium ${
                              selectedDayBlocked ? "text-red-600" : "text-slate-400 hover:text-slate-600"
                            }`}
                          >
                            {selectedDayBlocked ? (
                              <>
                                <Unlock className="w-3.5 h-3.5" /> Unblock
                              </>
                            ) : (
                              <>
                                <Lock className="w-3.5 h-3.5" /> Block day
                              </>
                            )}
                          </button>
                        )}
                      </div>

                      <div className="flex flex-wrap gap-1.5 mb-4">
                        {DURATIONS.map((d) => (
                          <Button
                            key={d.value}
                            variant={duration === d.value ? "default" : "outline"}
                            size="sm"
                            className="rounded-full"
                            onClick={() => {
                              setDuration(d.value);
                              resetTimeSelection();
                            }}
                          >
                            {d.label}
                          </Button>
                        ))}
                      </div>

                      {selectedDayBlocked ? (
                        <p className="text-sm text-slate-500">This day is blocked.</p>
                      ) : daySlots.length === 0 ? (
                        <p className="text-sm text-slate-500">No open slots this day at this length.</p>
                      ) : (
                        <div className="grid grid-cols-3 gap-2 max-h-56 overflow-y-auto pr-1">
                          {daySlots.map((slot) => (
                            <Button
                              key={slot.start.toISOString()}
                              variant="outline"
                              size="sm"
                              onClick={() => setSelectedSlot(slot)}
                            >
                              {formatTime(slot.start)}
                            </Button>
                          ))}
                        </div>
                      )}

                      {!selectedDayBlocked && (
                        <div className="mt-3">
                          {showExactTime ? (
                            <div className="flex items-center gap-2">
                              <Clock className="w-4 h-4 text-slate-400 shrink-0" />
                              <input
                                type="time"
                                step="900"
                                value={exactTime}
                                onChange={(e) => setExactTime(e.target.value)}
                                className="text-sm border border-input rounded-md px-2 py-1 bg-background"
                              />
                              <Button size="sm" onClick={handleUseExactTime}>
                                Use this time
                              </Button>
                            </div>
                          ) : (
                            <button
                              type="button"
                              className="text-sm text-blue-600 hover:underline"
                              onClick={() => setShowExactTime(true)}
                            >
                              Enter an exact time instead
                            </button>
                          )}
                          {exactTimeError && (
                            <p className="text-xs text-red-600 mt-1">{exactTimeError}</p>
                          )}
                        </div>
                      )}
                    </div>
                  )}

                  {selectedSlot && (
                    <RequestForm
                      selectedSlot={selectedSlot}
                      onChooseDifferentTime={resetTimeSelection}
                      form={form}
                      setForm={setForm}
                      isSubmitting={isSubmitting}
                      onSubmit={handleSubmit}
                    />
                  )}
                </div>
              </div>
            </Card>
          )}

          <div className="mt-6 text-center">
            {!isAdmin ? (
              showAdminLogin ? (
                <form onSubmit={handleAdminLogin} className="inline-flex items-center gap-2">
                  <Input
                    type="password"
                    placeholder="Owner token"
                    value={adminTokenInput}
                    onChange={(e) => setAdminTokenInput(e.target.value)}
                    className="w-40 h-8 text-xs"
                  />
                  <Button type="submit" size="sm">
                    Sign in
                  </Button>
                </form>
              ) : (
                <button
                  type="button"
                  className="text-xs text-slate-400 hover:text-slate-600 underline"
                  onClick={() => setShowAdminLogin(true)}
                >
                  Owner? Manage availability
                </button>
              )
            ) : (
              <div className="inline-flex items-center gap-3 text-xs text-slate-500">
                <span className="inline-flex items-center gap-1 text-blue-600 font-medium">
                  <Lock className="w-3 h-3" /> Owner mode
                </span>
                <button type="button" className="underline" onClick={handleAdminLogout}>
                  Sign out
                </button>
              </div>
            )}
            {adminError && <p className="text-xs text-red-600 mt-1">{adminError}</p>}
          </div>
        </div>
      </section>
    </>
  );
}
