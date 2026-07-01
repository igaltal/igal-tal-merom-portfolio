import { Fragment, useEffect, useMemo, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import Seo from "@/components/Seo";
import { motion } from "framer-motion";
import { CalendarClock, ChevronLeft, ChevronRight, Clock, CheckCircle2, Loader2 } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";

const WEEKDAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

// Fallback working-hours used only until /api/availability responds, so the
// calendar isn't empty on first paint. The backend's own config (api/_lib/
// workingHours.js) is the source of truth for what's actually bookable.
const DEFAULT_WORKING_HOURS = {
  days: [0, 1, 2, 3, 4],
  startHour: 9,
  endHour: 18,
  slotMinutes: 30,
  timeZone: "Asia/Jerusalem",
};

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

function buildMonthCells(year, month) {
  const firstDay = new Date(year, month, 1);
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells = [];
  for (let i = 0; i < firstDay.getDay(); i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(new Date(year, month, d));
  while (cells.length % 7 !== 0) cells.push(null);
  return cells;
}

function buildWeekDays(weekStart) {
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(weekStart);
    d.setDate(d.getDate() + i);
    return d;
  });
}

function buildSlotsForDay(day, workingHours, busy) {
  const { startHour, endHour, slotMinutes } = workingHours;
  const slots = [];
  const dayStart = startOfDay(day);

  for (let minutes = startHour * 60; minutes < endHour * 60; minutes += slotMinutes) {
    const slotStart = new Date(dayStart.getTime() + minutes * 60000);
    const slotEnd = new Date(slotStart.getTime() + slotMinutes * 60000);

    if (slotStart < new Date()) continue;

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

function RequestForm({ selectedDay, selectedSlot, onChooseDifferentTime, form, setForm, isSubmitting, onSubmit }) {
  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div>
        <p className="text-sm text-slate-500">You&apos;re requesting</p>
        <p className="font-semibold text-slate-900">
          {formatDay(selectedDay)} {" · "} {formatTime(selectedSlot.start)}
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
  const [view, setView] = useState("week");
  const [month, setMonth] = useState(new Date(today.getFullYear(), today.getMonth(), 1));
  const [weekStart, setWeekStart] = useState(() => startOfWeek(today));
  const [selectedDay, setSelectedDay] = useState(null);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [busy, setBusy] = useState([]);
  const [workingHours, setWorkingHours] = useState(DEFAULT_WORKING_HOURS);
  const [isLoadingAvailability, setIsLoadingAvailability] = useState(false);
  const [loadError, setLoadError] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", message: "" });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  useEffect(() => {
    const rangeStart =
      view === "week" ? weekStart : startOfDay(new Date(month.getFullYear(), month.getMonth(), 1));
    const rangeEnd =
      view === "week"
        ? new Date(weekStart.getFullYear(), weekStart.getMonth(), weekStart.getDate() + 7)
        : new Date(month.getFullYear(), month.getMonth() + 1, 1);

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
      })
      .catch(() => setLoadError(true))
      .finally(() => setIsLoadingAvailability(false));
  }, [view, month, weekStart]);

  const monthCells = useMemo(
    () => buildMonthCells(month.getFullYear(), month.getMonth()),
    [month]
  );

  const weekDays = useMemo(() => buildWeekDays(weekStart), [weekStart]);

  const timeRows = useMemo(() => {
    const rows = [];
    for (let m = workingHours.startHour * 60; m < workingHours.endHour * 60; m += workingHours.slotMinutes) {
      rows.push(m);
    }
    return rows;
  }, [workingHours]);

  const daySlots = useMemo(() => {
    if (!selectedDay) return [];
    return buildSlotsForDay(selectedDay, workingHours, busy);
  }, [selectedDay, workingHours, busy]);

  const weekFreeSlotsByDay = useMemo(
    () =>
      weekDays.map((day) => {
        const isOff = startOfDay(day) < startOfDay(today) || !workingHours.days.includes(day.getDay());
        const freeStarts = isOff ? new Set() : new Set(buildSlotsForDay(day, workingHours, busy).map((s) => s.start.getTime()));
        return { day, isOff, freeStarts };
      }),
    [weekDays, workingHours, busy, today]
  );

  const isDayDisabled = (day) => {
    if (startOfDay(day) < startOfDay(today)) return true;
    if (!workingHours.days.includes(day.getDay())) return true;
    return buildSlotsForDay(day, workingHours, busy).length === 0;
  };

  const handleSelectDay = (day) => {
    if (isDayDisabled(day)) return;
    setSelectedDay(day);
    setSelectedSlot(null);
  };

  const changeMonth = (delta) => {
    setMonth(new Date(month.getFullYear(), month.getMonth() + delta, 1));
    setSelectedDay(null);
    setSelectedSlot(null);
  };

  const changeWeek = (delta) => {
    setWeekStart(new Date(weekStart.getFullYear(), weekStart.getMonth(), weekStart.getDate() + delta * 7));
    setSelectedDay(null);
    setSelectedSlot(null);
  };

  const handleSelectWeekSlot = (day, minutes) => {
    const start = new Date(startOfDay(day).getTime() + minutes * 60000);
    const end = new Date(start.getTime() + workingHours.slotMinutes * 60000);
    setSelectedDay(day);
    setSelectedSlot({ start, end });
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
          setWeekStart(new Date(weekStart));
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
            className="text-center mb-10"
          >
            <div className="inline-flex items-center gap-2 text-blue-600 font-medium mb-3">
              <CalendarClock className="w-5 h-5" />
              Book a Meeting
            </div>
            <h1 className="text-3xl md:text-4xl font-bold text-slate-900 mb-3">
              Find a time that works for both of us
            </h1>
            <p className="text-slate-600 max-w-xl mx-auto">
              Pick an open slot below and send a request. You&apos;ll only ever see whether
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
                <Button
                  variant={view === "week" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setView("week")}
                >
                  Week
                </Button>
                <Button
                  variant={view === "month" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setView("month")}
                >
                  Month
                </Button>
              </div>

              {view === "week" ? (
                <div className="space-y-6">
                  <Card className="p-4 md:p-6">
                    <div className="flex items-center justify-between mb-4">
                      <Button variant="ghost" size="icon" onClick={() => changeWeek(-1)} aria-label="Previous week">
                        <ChevronLeft className="w-4 h-4" />
                      </Button>
                      <span className="font-medium text-slate-900">
                        {weekDays[0].toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                        {" – "}
                        {weekDays[6].toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                      </span>
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
                        {weekDays.map((day) => (
                          <div key={day.toISOString()} className="bg-white text-center py-2">
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
                          </div>
                        ))}

                        {timeRows.map((minutes) => (
                          <Fragment key={minutes}>
                            <div className="bg-white text-right pr-2 text-[10px] text-muted-foreground pt-1">
                              {minutes % 60 === 0
                                ? new Date(2000, 0, 1, minutes / 60).toLocaleTimeString("en-US", {
                                    hour: "numeric",
                                  })
                                : ""}
                            </div>
                            {weekFreeSlotsByDay.map(({ day, isOff, freeStarts }) => {
                              const slotStart = new Date(startOfDay(day).getTime() + minutes * 60000);
                              const isFree = !isOff && freeStarts.has(slotStart.getTime());
                              const isSelected =
                                selectedSlot && selectedSlot.start.getTime() === slotStart.getTime();
                              return (
                                <button
                                  key={day.toISOString() + minutes}
                                  type="button"
                                  disabled={!isFree}
                                  onClick={() => handleSelectWeekSlot(day, minutes)}
                                  title={isFree ? formatTime(slotStart) : "Busy"}
                                  className={`h-6 transition-colors ${
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
                        ))}
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
                        selectedDay={selectedDay}
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
              ) : (
                <div className="grid md:grid-cols-2 gap-6">
                  <Card className="p-4 md:p-6">
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

                    <div className="grid grid-cols-7 gap-1 text-center text-xs text-muted-foreground mb-2">
                      {WEEKDAY_LABELS.map((label) => (
                        <div key={label}>{label}</div>
                      ))}
                    </div>

                    <div className="grid grid-cols-7 gap-1">
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
                            className={`h-9 rounded-md text-sm transition-colors ${
                              selected
                                ? "bg-blue-600 text-white"
                                : disabled
                                ? "text-muted-foreground opacity-40 cursor-not-allowed"
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
                  </Card>

                  <Card className="p-4 md:p-6">
                    {!selectedDay && (
                      <div className="h-full flex items-center justify-center text-slate-500 text-sm text-center py-12">
                        Select an available day to see open time slots.
                      </div>
                    )}

                    {selectedDay && !selectedSlot && (
                      <div>
                        <h3 className="font-semibold text-slate-900 mb-3">{formatDay(selectedDay)}</h3>
                        {daySlots.length === 0 ? (
                          <p className="text-sm text-slate-500">No open slots this day.</p>
                        ) : (
                          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                            {daySlots.map((slot) => (
                              <Button
                                key={slot.start.toISOString()}
                                variant="outline"
                                className="flex items-center gap-1.5"
                                onClick={() => setSelectedSlot(slot)}
                              >
                                <Clock className="w-3.5 h-3.5" />
                                {formatTime(slot.start)}
                              </Button>
                            ))}
                          </div>
                        )}
                      </div>
                    )}

                    {selectedSlot && (
                      <RequestForm
                        selectedDay={selectedDay}
                        selectedSlot={selectedSlot}
                        onChooseDifferentTime={() => setSelectedSlot(null)}
                        form={form}
                        setForm={setForm}
                        isSubmitting={isSubmitting}
                        onSubmit={handleSubmit}
                      />
                    )}
                  </Card>
                </div>
              )}
            </>
          )}
        </div>
      </section>
    </>
  );
}
