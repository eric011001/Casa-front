"use client";

import { useEffect, useRef, useState } from "react";
import { ExpenseCalendar } from "./ExpenseCalendar";
import { StatCards } from "./StatCards";

export function CalendarStatsLayout({ houseId }: { houseId: string }) {
  const calendarRef = useRef<HTMLDivElement>(null);
  const [calendarHeight, setCalendarHeight] = useState<number | null>(null);
  const [isDesktop, setIsDesktop] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia("(min-width: 1024px)");
    const updateIsDesktop = () => setIsDesktop(mediaQuery.matches);
    updateIsDesktop();
    mediaQuery.addEventListener("change", updateIsDesktop);
    return () => mediaQuery.removeEventListener("change", updateIsDesktop);
  }, []);

  useEffect(() => {
    const node = calendarRef.current;
    if (!node) return;
    const observer = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (entry) setCalendarHeight(entry.contentRect.height);
    });
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
      <div ref={calendarRef} className="lg:col-span-2">
        <ExpenseCalendar houseId={houseId} />
      </div>
      <div
        className="lg:col-span-1 lg:overflow-y-auto"
        style={
          isDesktop && calendarHeight
            ? { maxHeight: calendarHeight }
            : undefined
        }
      >
        <StatCards houseId={houseId} />
      </div>
    </div>
  );
}
