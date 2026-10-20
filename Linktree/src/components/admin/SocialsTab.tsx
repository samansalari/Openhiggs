import { useState, type FormEvent } from "react";
import { Trash2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { SOCIAL_PLATFORMS, SocialIconView } from "@/lib/icons";
import type { SocialLink } from "@/lib/page-types";
import { safeUrlSchema } from "@/lib/validation";
import { qk, saveOrder, useInvalidate } from "./data";
import { SortableList } from "./SortableList";

export function SocialsTab({ socials }: { socials: SocialLink[] }) {
  const invalidate = useInvalidate();
  const [platform, setPlatform] = useState("instagram");
  const [url, setUrl] = useState("https://");
  const [order, setOrder] = useState<SocialLink[] | null>(null);

  async function add(e: FormEvent) {
    e.preventDefault();
    const parsed = safeUrlSchema.safeParse(url);
    if (!parsed.success) return void toast.error(parsed.error.issues[0]?.message ?? "Invalid URL");
    const { error } = await supabase.from("social_links").insert({ platform, url: parsed.data, position: socials.length });
    if (error) return void toast.error(error.message);
    setUrl("https://");
    invalidate(qk.socials);
  }

  async function remove(s: SocialLink) {
    const { error } = await supabase.from("social_links").delete().eq("id", s.id);
    if (error) return void toast.error(error.message);
    invalidate(qk.socials);
  }

  async function reorder(next: SocialLink[]) {
    setOrder(next);
    try {
      await saveOrder("social_links", next.map((s) => s.id));
      await invalidate(qk.socials);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not reorder");
    } finally {
      setOrder(null);
    }
  }

  return (
    <div className="space-y-4">
      <form onSubmit={add} className="flex flex-col gap-2 sm:flex-row">
        <Select value={platform} onValueChange={setPlatform}>
          <SelectTrigger className="sm:w-40" aria-label="Platform"><SelectValue /></SelectTrigger>
          <SelectContent>
            {Object.entries(SOCIAL_PLATFORMS).map(([k, v]) => <SelectItem key={k} value={k}>{v.label}</SelectItem>)}
          </SelectContent>
        </Select>
        <Input aria-label="Profile URL" value={url} inputMode="url" onChange={(e) => setUrl(e.target.value)} />
        <Button type="submit">Add</Button>
      </form>
      <SortableList
        items={order ?? socials}
        onReorder={reorder}
        label={(s) => SOCIAL_PLATFORMS[s.platform]?.label ?? s.platform}
        renderItem={(s) => (
          <div className="flex items-center gap-3">
            <SocialIconView platform={s.platform} className="h-4 w-4 shrink-0" />
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold">{SOCIAL_PLATFORMS[s.platform]?.label ?? s.platform}</p>
              <p className="truncate text-xs text-muted-foreground">{s.url}</p>
            </div>
            <Button variant="ghost" size="icon" aria-label="Delete" onClick={() => remove(s)}><Trash2 /></Button>
          </div>
        )}
      />
    </div>
  );
}
