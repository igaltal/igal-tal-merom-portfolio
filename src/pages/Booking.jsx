import { Fragment, useEffect, useMemo, useState } from "react";
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
  CheckCircle2,
  Loader2,
  Lock,
  Unlock,
} from "lucide-react";
import { useToast } from "@/components/ui/use-toast";

const ADMIN_TOKEN_STORAGE_KEY = "bookingAdminToken";

const DURATIONS = [
  { label: "15m", value: 15 },
  { label: "30m", value: 30 },
  { label: "1h", value: 60 },
  { label: "2h", value: 120 },
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

function startOfWeek(date) {
  const d = startOfDay(date);
  d.setDate(d.getDate() - d.getDay());
  return d;
}

function dateKey(date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(
    date.getDate()
  ).padStart(2, "0")}`;
}

function buildWeekDays(weekStart) {
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(weekStart);
    d.setDate(d.getDate() + i);
    return d;
  });
}

function buildSlotsForDay(day, workingHours, busy, duration, minNoticeHours) {
  const step = workingHours.slotMinutes || 15;
  const { startHour, endHour } = workingHours;
  const slots = [];
  const dayStart = startOfDay(day);
  const earliestStart = new Date(Date.now() + minNoticeHours * 3600000);

  for (let minutes = startHour * 60; minutes + duration <= endHour * 60; minutes += step) {
    const slotStart = new Date(dayStart.getTime() + minutes * 60000);
    const slotEnd = new Date(slotStart.getTime() + duration * 60000);

    if (slotStart < earliestStart) continue;

    const isBusy = busy.some((b) => {
      const bStart = new Date(b.start);
      const bEnd = new Date(b.end);
      return slotStart < bEnd && slotEnd > bStart;
    });

    if (!isBusy) slots.push({ start: slotStart, end: slotEnd });
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
  const today = useMemo(() => new Date(), []);
  const [focusDay, setFocusDay] = useState(() => startOfDay(today));
  const [duration, setDuration] = useState(30);
  const [selectedSlot, setSelectedSlot] = useState(null);
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

  const weekStart = useMemo(() => startOfWeek(focusDay), [focusDay]);
  const weekDays = useMemo(() => buildWeekDays(weekStart), [weekStart]);

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
    const rangeStart = weekStart;
    const rangeEnd = new Date(weekStart.getFullYear(), weekStart.getMonth(), weekStart.getDate() + 7);

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
  }, [weekStart]);

  useEffect(() => {
    if (!adminToken) {
      setBlockedDays(new Set());
      return;
    }
    const rangeStart = weekStart;
    const rangeEnd = new Date(weekStart.getFullYear(), weekStart.getMonth(), weekStart.getDate() + 7);

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
  }, [adminToken, weekStart]);

  const slotsByDay = useMemo(() => {
    const map = new Map();
    for (const day of weekDays) {
      map.set(dateKey(day), buildSlotsForDay(day, workingHours, busy, duration, minNoticeHours));
    }
    return map;
  }, [weekDays, workingHours, busy, duration, minNoticeHours]);

  const changeWeek = (delta) => {
    setFocusDay(new Date(weekStart.getFullYear(), weekStart.getMonth(), weekStart.getDate() + delta * 7));
    setSelectedSlot(null);
  };

  const changeDay = (delta) => {
    setFocusDay(new Date(focusDay.getFullYear(), focusDay.getMonth(), focusDay.getDate() + delta));
    setSelectedSlot(null);
  };

  const jumpToDate = (value) => {
    if (!value) return;
    setFocusDay(startOfDay(new Date(`${value}T00:00:00`)));
    setSelectedSlot(null);
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

  const handleToggleBlock = async (day) => {
    const key = dateKey(day);
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
      setFocusDay(new Date(focusDay));
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
          setSelectedSlot(null);
          setFocusDay(new Date(focusDay));
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
  const focusDayKey = dateKey(focusDay);
  const focusDaySlots = slotsByDay.get(focusDayKey) || [];
  const focusDayBlocked = blockedDays.has(focusDayKey);
  const focusDayOff = !workingHours.days.includes(focusDay.getDay());

  return (
    <>
      <Seo
        title="Book a Meeting — Igal Tal Merom"
        description="Check my real-time availability and request a time to meet."
        path="/booking"
      />
      <section className="pt-32 pb-16 md:pt-40 md:pb-24 bg-slate-50 min-h-screen">
        <div className="container mx-auto px-4 md:px-6 max-w-5xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-8"
          >
            <div className="inline-flex items-center gap-2 text-blue-600 font-medium mb-3">
              <CalendarClock className="w-5 h-5" />
              Book a Meeting
            </div>
            <h1 className="text-3xl md:text-4xl font-bold text-slate-900 mb-3">
              Find a time that works for both of us
            </h1>
            <p className="text-slate-600 max-w-xl mx-auto">
              Pick how long you need and an open slot below. You&apos;ll only ever see whether
              I&apos;m free or busy — no calendar details are shared. I&apos;ll confirm by email
              once I approve the request.
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
            <>
              <div className="flex justify-center gap-2 mb-6">
                {DURATIONS.map((d) => (
                  <Button
                    key={d.value}
                    variant={duration === d.value ? "default" : "outline"}
                    size="sm"
                    onClick={() => {
                      setDuration(d.value);
                      setSelectedSlot(null);
                    }}
                  >
                    {d.label}
                  </Button>
                ))}
              </div>

              {/* Mobile: single-day agenda */}
              <div className="md:hidden space-y-4">
                <Card className="p-4">
                  <div className="flex items-center justify-between mb-3">
                    <Button variant="ghost" size="icon" onClick={() => changeDay(-1)} aria-label="Previous day">
                      <ChevronLeft className="w-4 h-4" />
                    </Button>
                    <div className="font-medium text-slate-900 text-center">{formatDay(focusDay)}</div>
                    <Button variant="ghost" size="icon" onClick={() => changeDay(1)} aria-label="Next day">
                      <ChevronRight className="w-4 h-4" />
                    </Button>
                  </div>

                  <div className="flex justify-center mb-4">
                    <input
                      type="date"
                      value={focusDayKey}
                      min={dateKey(today)}
                      onChange={(e) => jumpToDate(e.target.value)}
                      className="text-sm border border-input rounded-md px-2 py-1 bg-background"
                    />
                  </div>

                  {isAdmin && (
                    <Button
                      variant={focusDayBlocked ? "destructive" : "outline"}
                      size="sm"
                      className="w-full mb-4"
                      onClick={() => handleToggleBlock(focusDay)}
                    >
                      {focusDayBlocked ? (
                        <>
                          <Unlock className="w-3.5 h-3.5 mr-1.5" /> Unblock this day
                        </>
                      ) : (
                        <>
                          <Lock className="w-3.5 h-3.5 mr-1.5" /> Block this day
                        </>
                      )}
                    </Button>
                  )}

                  {focusDayOff || focusDayBlocked ? (
                    <p className="text-sm text-slate-500 text-center py-8">
                      {focusDayBlocked ? "This day is blocked." : "Not available on this day."}
                    </p>
                  ) : focusDaySlots.length === 0 ? (
                    <p className="text-sm text-slate-500 text-center py-8">No open slots this day.</p>
                  ) : (
                    <div className="grid grid-cols-3 gap-2">
                      {focusDaySlots.map((slot) => (
                        <Button
                          key={slot.start.toISOString()}
                          variant="outline"
                          onClick={() => setSelectedSlot(slot)}
                        >
                          {formatTime(slot.start)}
                        </Button>
                      ))}
                    </div>
                  )}

                  {isLoadingAvailability && (
                    <div className="flex items-center justify-center gap-2 text-sm text-slate-500 mt-3">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Checking availability...
                    </div>
                  )}
                </Card>

                {selectedSlot && (
                  <Card className="p-4">
                    <RequestForm
                      selectedSlot={selectedSlot}
                      onChooseDifferentTime={() => setSelectedSlot(null)}
                      form={form}
                      setForm={setForm}
                      isSubmitting={isSubmitting}
                      onSubmit={handleSubmit}
                    />
                  </Card>
                )}
              </div>

              {/* Desktop: full week grid */}
              <div className="hidden md:block space-y-6">
                <Card className="p-4 md:p-6">
                  <div className="flex items-center justify-between mb-4">
                    <Button variant="ghost" size="icon" onClick={() => changeWeek(-1)} aria-label="Previous week">
                      <ChevronLeft className="w-4 h-4" />
                    </Button>
                    <div className="flex items-center gap-3">
                      <span className="font-medium text-slate-900">
                        {weekDays[0].toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                        {" – "}
                        {weekDays[6].toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                      </span>
                      <input
                        type="date"
                        value={focusDayKey}
                        min={dateKey(today)}
                        onChange={(e) => jumpToDate(e.target.value)}
                        className="text-xs border border-input rounded-md px-1.5 py-1 bg-background"
                      />
                    </div>
                    <Button variant="ghost" size="icon" onClick={() => changeWeek(1)} aria-label="Next week">
                      <ChevronRight className="w-4 h-4" />
                    </Button>
                  </div>

                  <div className="overflow-x-auto">
                    <div
                      className="grid gap-px bg-slate-200 border border-slate-200 rounded-md overflow-hidden min-w-[640px]"
                      style={{ gridTemplateColumns: "56px repeat(7, 1fr)" }}
                    >
                      <div className="bg-white" />
                      {weekDays.map((day) => {
                        const key = dateKey(day);
                        const blocked = blockedDays.has(key);
                        return (
                          <div key={key} className="bg-white text-center py-2">
                            <div className="text-xs text-muted-foreground">
                              {day.toLocaleDateString("en-US", { weekday: "short" })}
                            </div>
                            <div
                              className={`text-sm font-medium ${
                                isSameDay(day, today) ? "text-blue-600" : "text-slate-900"
                              }`}
                            >
                              {day.getDate()}
                            </div>
                            {isAdmin && (
                              <button
                                type="button"
                                onClick={() => handleToggleBlock(day)}
                                title={blocked ? "Unblock this day" : "Block this day"}
                                className={`mt-1 inline-flex items-center justify-center w-5 h-5 rounded ${
                                  blocked ? "text-red-600" : "text-slate-300 hover:text-slate-500"
                                }`}
                              >
                                {blocked ? <Lock className="w-3.5 h-3.5" /> : <Unlock className="w-3.5 h-3.5" />}
                              </button>
                            )}
                          </div>
                        );
                      })}

                      {(() => {
                        const step = workingHours.slotMinutes || 15;
                        const rows = [];
                        for (let m = workingHours.startHour * 60; m < workingHours.endHour * 60; m += step) {
                          rows.push(m);
                        }
                        return rows.map((minutes) => (
                          <Fragment key={minutes}>
                            <div className="bg-white text-right pr-2 text-[10px] text-muted-foreground pt-1">
                              {minutes % 60 === 0
                                ? new Date(2000, 0, 1, minutes / 60).toLocaleTimeString("en-US", {
                                    hour: "numeric",
                                  })
                                : ""}
                            </div>
                            {weekDays.map((day) => {
                              const key = dateKey(day);
                              const slotStart = new Date(startOfDay(day).getTime() + minutes * 60000);
                              const slotEnd = new Date(slotStart.getTime() + duration * 60000);
                              const isFree = (slotsByDay.get(key) || []).some(
                                (s) => s.start.getTime() === slotStart.getTime()
                              );
                              const isSelected =
                                selectedSlot && selectedSlot.start.getTime() === slotStart.getTime();
                              return (
                                <button
                                  key={key + minutes}
                                  type="button"
                                  disabled={!isFree}
                                  onClick={() => setSelectedSlot({ start: slotStart, end: slotEnd })}
                                  title={isFree ? `${formatTime(slotStart)}–${formatTime(slotEnd)}` : "Busy"}
                                  className={`h-5 transition-colors ${
                                    isSelected
                                      ? "bg-blue-600"
                                      : isFree
                                      ? "bg-green-50 hover:bg-green-200"
                                      : "bg-slate-100"
                                  }`}
                                />
                              );
                            })}
                          </Fragment>
                        ));
                      })()}
                    </div>
                  </div>

                  <div className="flex items-center gap-4 mt-3 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1.5">
                      <span className="w-3 h-3 rounded-sm bg-green-50 border border-green-200" /> Free
                    </span>
                    <span className="flex items-center gap-1.5">
                      <span className="w-3 h-3 rounded-sm bg-slate-100 border border-slate-200" /> Busy /
                      unavailable
                    </span>
                  </div>

                  {isLoadingAvailability && (
                    <div className="flex items-center justify-center gap-2 text-sm text-slate-500 mt-3">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Checking availability...
                    </div>
                  )}
                </Card>

                {selectedSlot && (
                  <Card className="p-4 md:p-6 max-w-md mx-auto">
                    <RequestForm
                      selectedSlot={selectedSlot}
                      onChooseDifferentTime={() => setSelectedSlot(null)}
                      form={form}
                      setForm={setForm}
                      isSubmitting={isSubmitting}
                      onSubmit={handleSubmit}
                    />
                  </Card>
                )}
              </div>
            </>
          )}

          <div className="mt-10 text-center">
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
