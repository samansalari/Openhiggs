import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import type { LinkRow } from "@/lib/page-types";

const RANGES = [
  { label: "7 days", days: 7 },
  { label: "30 days", days: 30 },
  { label: "All time", days: 0 },
];

async function count(type: "view" | "click", since: string | null) {
  let q = supabase.from("analytics_events").select("id", { count: "exact", head: true }).eq("event_type", type);
  if (since) q = q.gte("created_at", since);
  const { count: c, error } = await q;
  if (error) throw new Error(error.message);
  return c ?? 0;
}

export function AnalyticsTab({ links }: { links: LinkRow[] }) {
  const [days, setDays] = useState(30);
  const { data, isLoading } = useQuery({
    queryKey: ["admin", "analytics", days],
    queryFn: async () => {
      const since = days ? new Date(Date.now() - days * 86_400_000).toISOString() : null;
      const [views, clicks] = await Promise.all([count("view", since), count("click", since)]);
      const perLink = await Promise.all(
        links.map(async (l) => {
          let q = supabase.from("analytics_events").select("id", { count: "exact", head: true }).eq("event_type", "click").eq("link_id", l.id);
          if (since) q = q.gte("created_at", since);
          const { count: c } = await q;
          return { id: l.id, title: l.title, clicks: c ?? 0 };
        }),
      );
      perLink.sort((a, b) => b.clicks - a.clicks);
      return { views, clicks, perLink };
    },
  });

  const ctr = data && data.views ? Math.round((data.clicks / data.views) * 100) : 0;
  const top = data?.perLink.filter((l) => l.clicks > 0).slice(0, 8) ?? [];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-2">
        {RANGES.map((r) => (
          <Button key={r.days} size="sm" variant={days === r.days ? "default" : "outline"} onClick={() => setDays(r.days)}>
            {r.label}
          </Button>
        ))}
      </div>
      <div className="grid grid-cols-3 gap-3">
        <Stat label="Profile views" value={isLoading ? "…" : data?.views ?? 0} />
        <Stat label="Link clicks" value={isLoading ? "…" : data?.clicks ?? 0} />
        <Stat label="Click rate" value={isLoading ? "…" : `${ctr}%`} />
      </div>
      <div className="rounded-2xl border border-border bg-card p-4">
        <p className="mb-3 text-sm font-semibold">Most popular links</p>
        {top.length ? (
          <ChartContainer config={{ clicks: { label: "Clicks", color: "var(--chart-2)" } }} className="h-[260px] w-full">
            <BarChart data={top} layout="vertical" margin={{ left: 8, right: 8 }}>
              <CartesianGrid horizontal={false} stroke="var(--border)" />
              <XAxis type="number" allowDecimals={false} tickLine={false} axisLine={false} />
              <YAxis type="category" dataKey="title" width={120} tickLine={false} axisLine={false} tick={{ fontSize: 12 }} />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Bar dataKey="clicks" fill="var(--color-clicks)" radius={6} />
            </BarChart>
          </ChartContainer>
        ) : (
          <p className="py-8 text-center text-sm text-muted-foreground">No clicks recorded yet.</p>
        )}
      </div>
      <div className="rounded-2xl border border-border bg-card">
        <p className="border-b border-border px-4 py-3 text-sm font-semibold">Clicks per link</p>
        <ul className="divide-y divide-border">
          {data?.perLink.map((l) => (
            <li key={l.id} className="flex items-center justify-between px-4 py-2.5 text-sm">
              <span className="truncate">{l.title}</span>
              <span className="font-semibold tabular-nums">{l.clicks}</span>
            </li>
          ))}
        </ul>
      </div>
      <p className="text-xs text-muted-foreground">No personal visitor data is stored. Bots and repeated hits are filtered out.</p>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-2xl border border-border bg-card p-4">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-1 text-2xl font-bold tabular-nums">{value}</p>
    </div>
  );
}
