import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import type { Profile } from "@/lib/page-types";
import { hexColorSchema } from "@/lib/validation";
import { cn } from "@/lib/utils";

// Brand palette swatches offered as accent presets.
const PRESETS = [
  { name: "Golden Yellow", hex: "#E7AC3B" },
  { name: "Burnt Orange", hex: "#C07429" },
  { name: "Cream", hex: "#F6E7AF" },
  { name: "Dark Espresso", hex: "#482C0A" },
];

interface Props {
  draft: Profile;
  setDraft: (p: Profile) => void;
  onSave: () => Promise<void>;
  saving: boolean;
}

export function AppearanceTab({ draft, setDraft, onSave, saving }: Props) {
  const set = <K extends keyof Profile>(k: K, v: Profile[K]) => setDraft({ ...draft, [k]: v });
  const validAccent = hexColorSchema.safeParse(draft.accent_color).success;

  return (
    <div className="space-y-7">
      <div className="space-y-3">
        <Label>Accent colour (featured links)</Label>
        <div className="flex flex-wrap gap-2">
          {PRESETS.map((p) => (
            <button
              key={p.hex}
              type="button"
              onClick={() => set("accent_color", p.hex)}
              aria-label={p.name}
              aria-pressed={draft.accent_color.toUpperCase() === p.hex}
              className={cn(
                "h-10 w-10 rounded-full border border-border transition-transform duration-150 hover:scale-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                draft.accent_color.toUpperCase() === p.hex && "ring-2 ring-primary ring-offset-2 ring-offset-background",
              )}
              style={{ backgroundColor: p.hex }}
            />
          ))}
        </div>
        <div className="flex items-center gap-2">
          <input
            type="color"
            aria-label="Custom accent colour"
            value={validAccent ? draft.accent_color : "#E7AC3B"}
            onChange={(e) => set("accent_color", e.target.value.toUpperCase())}
            className="h-10 w-12 cursor-pointer rounded-lg border border-border bg-card"
          />
          <Input value={draft.accent_color} maxLength={7} onChange={(e) => set("accent_color", e.target.value)} className="w-32 font-mono" />
        </div>
        {!validAccent && <p className="text-sm text-destructive">Use a hex colour like #E7AC3B</p>}
      </div>

      <div className="space-y-2">
        <Label>Default theme</Label>
        <div className="flex gap-2">
          {(["light", "dark"] as const).map((t) => (
            <Button key={t} variant={draft.theme === t ? "default" : "outline"} size="sm" onClick={() => set("theme", t)}>
              {t === "light" ? "Light" : "Dark"}
            </Button>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        <Label>Background</Label>
        <div className="flex gap-2">
          {(["plain", "texture"] as const).map((b) => (
            <Button key={b} variant={draft.background_style === b ? "default" : "outline"} size="sm" onClick={() => set("background_style", b)}>
              {b === "plain" ? "Plain" : "Subtle dots"}
            </Button>
          ))}
        </div>
      </div>

      <div className="flex items-center justify-between rounded-xl border border-border bg-card p-4">
        <div>
          <Label htmlFor="show-cats">Group links by category</Label>
          <p className="text-sm text-muted-foreground">Turn off for a simple single list.</p>
        </div>
        <Switch id="show-cats" checked={draft.show_categories} onCheckedChange={(v) => set("show_categories", v)} />
      </div>

      <Button onClick={onSave} disabled={saving || !validAccent}>{saving ? "Saving…" : "Save appearance"}</Button>
    </div>
  );
}
