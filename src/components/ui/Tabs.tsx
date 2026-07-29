"use client";

export type TabItem = {
  key: string;
  label: string;
};

export function Tabs({
  tabs,
  activeKey,
  onChange,
}: {
  tabs: TabItem[];
  activeKey: string;
  onChange: (key: string) => void;
}) {
  return (
    <div className="flex w-fit items-center gap-1 rounded-full bg-black/[.04] p-1 dark:bg-white/[.06]">
      {tabs.map((tab) => (
        <button
          key={tab.key}
          type="button"
          onClick={() => onChange(tab.key)}
          className={`rounded-full px-3 py-1.5 text-sm font-medium transition-colors ${
            activeKey === tab.key
              ? "bg-foreground text-background"
              : "text-zinc-600 hover:bg-black/[.06] dark:text-zinc-400 dark:hover:bg-white/[.1]"
          }`}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}
