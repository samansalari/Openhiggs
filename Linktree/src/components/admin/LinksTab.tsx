import { useRef, useState } from "react";
import { Eye, EyeOff, Pencil, Plus, Star, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { faviconUrl, LINK_ICONS, LinkIconView } from "@/lib/icons";
import type { Category, LinkRow } from "@/lib/page-types";
import { linkSchema } from "@/lib/validation";
import { cn } from "@/lib/utils";
import { qk, saveOrder, uploadImage, useInvalidate } from "./data";
import { SortableList } from "./SortableList";
import { Field } from "./ProfileTab";

type Draft = Pick<LinkRow, "title" | "url" | "description" | "icon" | "thumbnail_url" | "category_id" | "is_visible" | "open_new_tab" | "is_featured" | "use_favicon">;
const EMPTY: Draft = { title: "", url: "https://", description: "", icon: "link", thumbnail_url: null, category_id: null, is_visible: true, open_new_tab: true, is_featured: false, use_favicon: false };

export function LinksTab({ links, categories, signed }: { links: LinkRow[]; categories: Category[]; signed: Record<string, string> }) {
  const invalidate = useInvalidate();
  const [editing, setEditing] = useState<{ id: string | null; draft: Draft } | null>(null);
  const [order, setOrder] = useState<LinkRow[] | null>(null);
  const items = order ?? links;

  async function reorder(next: LinkRow[]) {
    setOrder(next);
    try {
      await saveOrder("links", next.map((l) => l.id));
      await invalidate(qk.links);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not reorder");
    } finally {
      setOrder(null);
    }
  }

  async function patch(id: string, values: Partial<LinkRow>) {
    const { error } = await supabase.from("links").update(values).eq("id", id);
    if (error) return void toast.error(error.message);
    invalidate(qk.links);
  }

  async function remove(l: LinkRow) {
    if (!confirm(`Delete "${l.title}"?`)) return;
    const { error } = await supabase.from("links").delete().eq("id", l.id);
    if (error) return void toast.error(error.message);
    toast.success("Link deleted");
    invalidate(qk.links);
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">Drag the handle to reorder. {links.length} links.</p>
        <Button size="sm" onClick={() => setEditing({ id: null, draft: EMPTY })}>
          <Plus /> Add link
        </Button>
      </div>
      <SortableList
        items={items}
        onReorder={reorder}
        label={(l) => l.title}
        renderItem={(l) => (
          <div className="flex items-center gap-3">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-border bg-background">
              {l.thumbnail_url ? (
                <img src={signed[l.thumbnail_url] ?? l.thumbnail_url} alt="" className="h-full w-full object-cover" />
              ) : l.use_favicon && faviconUrl(l.url) ? (
                <img src={faviconUrl(l.url)!} alt="" className="h-4 w-4" />
              ) : (
                <LinkIconView name={l.icon} className="h-4 w-4" />
              )}
            </span>
            <div className={cn("min-w-0 flex-1", !l.is_visible && "opacity-50")}>
              <p className="truncate text-sm font-semibold">{l.title}</p>
              <p className="truncate text-xs text-muted-foreground">{l.url}</p>
            </div>
            <Button variant="ghost" size="icon" aria-label={l.is_featured ? "Unfeature" : "Feature"} onClick={() => patch(l.id, { is_featured: !l.is_featured })}>
              <Star className={cn(l.is_featured && "fill-secondary text-highlight")} />
            </Button>
            <Button variant="ghost" size="icon" aria-label={l.is_visible ? "Hide" : "Show"} onClick={() => patch(l.id, { is_visible: !l.is_visible })}>
              {l.is_visible ? <Eye /> : <EyeOff />}
            </Button>
            <Button variant="ghost" size="icon" aria-label={`Edit ${l.title}`} onClick={() => setEditing({ id: l.id, draft: { ...l } })}>
              <Pencil />
            </Button>
            <Button variant="ghost" size="icon" aria-label={`Delete ${l.title}`} onClick={() => remove(l)}>
              <Trash2 />
            </Button>
          </div>
        )}
      />
      {editing && (
        <LinkDialog
          initial={editing}
          categories={categories}
          signed={signed}
          nextPosition={links.length}
          onClose={() => setEditing(null)}
          onSaved={() => {
            setEditing(null);
            invalidate(qk.links);
          }}
        />
      )}
    </div>
  );
}

function LinkDialog({
  initial, categories, signed, nextPosition, onClose, onSaved,
}: {
  initial: { id: string | null; draft: Draft };
  categories: Category[];
  signed: Record<string, string>;
  nextPosition: number;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [d, setD] = useState<Draft>(initial.draft);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);
  const [thumbPreview, setThumbPreview] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const set = <K extends keyof Draft>(k: K, v: Draft[K]) => setD({ ...d, [k]: v });

  async function save() {
    const parsed = linkSchema.safeParse({ title: d.title, url: d.url, description: d.description ?? "" });
    if (!parsed.success) {
      setErrors(Object.fromEntries(parsed.error.issues.map((i) => [String(i.path[0]), i.message])));
      return;
    }
    setBusy(true);
    const values = { ...d, title: parsed.data.title, url: parsed.data.url, description: parsed.data.description || null };
    const { error } = initial.id
      ? await supabase.from("links").update(values).eq("id", initial.id)
      : await supabase.from("links").insert({ ...values, position: nextPosition });
    setBusy(false);
    if (error) return void toast.error(error.message);
    toast.success(initial.id ? "Link updated" : "Link added");
    onSaved();
  }

  async function onFile(f?: File) {
    if (!f) return;
    try {
      const path = await uploadImage(f);
      setThumbPreview(URL.createObjectURL(f));
      set("thumbnail_url", path);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Upload failed");
    }
  }

  const thumb = thumbPreview ?? (d.thumbnail_url ? signed[d.thumbnail_url] ?? d.thumbnail_url : null);

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{initial.id ? "Edit link" : "New link"}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <Field id="l-title" label="Title">
            <Input id="l-title" value={d.title} maxLength={100} onChange={(e) => set("title", e.target.value)} />
            {errors["title"] && <p className="text-sm text-destructive">{errors["title"]}</p>}
          </Field>
          <Field id="l-url" label="URL">
            <Input id="l-url" value={d.url} inputMode="url" onChange={(e) => set("url", e.target.value)} />
            {errors["url"] && <p className="text-sm text-destructive">{errors["url"]}</p>}
          </Field>
          <Field id="l-desc" label="Description (optional)">
            <Textarea id="l-desc" rows={2} maxLength={200} value={d.description ?? ""} onChange={(e) => set("description", e.target.value)} />
          </Field>
          <Field id="l-cat" label="Category">
            <Select value={d.category_id ?? "none"} onValueChange={(v) => set("category_id", v === "none" ? null : v)}>
              <SelectTrigger id="l-cat"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="none">No category</SelectItem>
                {categories.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </Field>
          <div className="space-y-2">
            <Label>Icon</Label>
            <div className="grid grid-cols-8 gap-1.5">
              {Object.keys(LINK_ICONS).map((name) => (
                <button
                  key={name}
                  type="button"
                  aria-label={name}
                  aria-pressed={d.icon === name && !d.thumbnail_url}
                  onClick={() => setD({ ...d, icon: name, thumbnail_url: null })}
                  className={cn(
                    "flex aspect-square items-center justify-center rounded-lg border border-border bg-card transition-colors hover:border-highlight hover:text-highlight focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                    d.icon === name && !d.thumbnail_url && "border-primary bg-primary text-primary-foreground hover:text-primary-foreground",
                  )}
                >
                  <LinkIconView name={name} className="h-4 w-4" />
                </button>
              ))}
            </div>
            <div className="flex items-center gap-2 pt-1">
              <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={(e) => onFile(e.target.files?.[0])} />
              {thumb && <img src={thumb} alt="" className="h-10 w-10 rounded-lg border border-border object-cover" />}
              <Button type="button" variant="outline" size="sm" onClick={() => fileRef.current?.click()}>
                {thumb ? "Change thumbnail" : "Upload thumbnail"}
              </Button>
              {thumb && (
                <Button type="button" variant="ghost" size="sm" onClick={() => { setThumbPreview(null); set("thumbnail_url", null); }}>
                  Remove
                </Button>
              )}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <Toggle id="l-vis" label="Visible" checked={d.is_visible} onChange={(v) => set("is_visible", v)} />
            <Toggle id="l-tab" label="New tab" checked={d.open_new_tab} onChange={(v) => set("open_new_tab", v)} />
            <Toggle id="l-feat" label="Featured" checked={d.is_featured} onChange={(v) => set("is_featured", v)} />
            <Toggle id="l-fav" label="Site favicon" checked={d.use_favicon} onChange={(v) => set("use_favicon", v)} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={save} disabled={busy}>{busy ? "Saving…" : "Save link"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function Toggle({ id, label, checked, onChange }: { id: string; label: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <div className="flex items-center justify-between rounded-lg border border-border px-3 py-2">
      <Label htmlFor={id} className="text-sm">{label}</Label>
      <Switch id={id} checked={checked} onCheckedChange={onChange} />
    </div>
  );
}
