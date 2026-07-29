"use client";

import { useEffect, useRef, useState } from "react";
import { Tabs } from "@/components/ui/Tabs";
import { ExpenseCalendar } from "./ExpenseCalendar";
import { UpcomingExpensesList } from "./UpcomingExpensesList";
import { StatCards } from "./StatCards";

const CALENDAR_TABS = [
  { key: "calendario", label: "Calendario" },
  { key: "proximos", label: "Próximos" },
];

export function CalendarStatsLayout({ houseId }: { houseId: string }) {
  const calendarRef = useRef<HTMLDivElement>(null);
  const [calendarHeight, setCalendarHeight] = useState<number | null>(null);
  const [isDesktop, setIsDesktop] = useState(false);
  const [activeTab, setActiveTab] = useState("calendario");

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
      <div ref={calendarRef} className="flex flex-col gap-4 lg:col-span-2">
        <Tabs tabs={CALENDAR_TABS} activeKey={activeTab} onChange={setActiveTab} />
        {activeTab === "calendario" ? (
          <ExpenseCalendar houseId={houseId} />
        ) : (
          <UpcomingExpensesList houseId={houseId} />
        )}
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
