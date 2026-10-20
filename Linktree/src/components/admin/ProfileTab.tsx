import { useRef, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import type { Profile } from "@/lib/page-types";
import { uploadImage, uploadPdf } from "./data";

interface Props {
  draft: Profile;
  setDraft: (p: Profile) => void;
  avatarUrl: string | null;
  onSave: () => Promise<void>;
  saving: boolean;
}

export function ProfileTab({ draft, setDraft, avatarUrl, onSave, saving }: Props) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const set = <K extends keyof Profile>(k: K, v: Profile[K]) => setDraft({ ...draft, [k]: v });

  async function onFile(f: File | undefined) {
    if (!f) return;
    setUploading(true);
    try {
      set("avatar_url", await uploadImage(f));
      toast.success("Photo uploaded — save to publish it.");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  }

  const cvRef = useRef<HTMLInputElement>(null);
  async function onCv(f: File | undefined) {
    if (!f) return;
    setUploading(true);
    try {
      set("cv_path", await uploadPdf(f));
      toast.success("CV uploaded — save the profile to publish it.");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Avatar className="h-20 w-20 border border-border">
          {avatarUrl && <AvatarImage src={avatarUrl} alt="" className="object-cover" />}
          <AvatarFallback className="bg-secondary text-xl font-semibold">{draft.name.slice(0, 1)}</AvatarFallback>
        </Avatar>
        <div className="flex flex-wrap gap-2">
          <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={(e) => onFile(e.target.files?.[0])} />
          <Button variant="outline" size="sm" onClick={() => fileRef.current?.click()} disabled={uploading}>
            {uploading ? "Uploading…" : "Change photo"}
          </Button>
          {draft.avatar_url && (
            <Button variant="ghost" size="sm" onClick={() => set("avatar_url", null)}>
              Remove
            </Button>
          )}
        </div>
      </div>
      <Field id="name" label="Name">
        <Input id="name" value={draft.name} maxLength={80} onChange={(e) => set("name", e.target.value)} />
      </Field>
      <Field id="headline" label="Headline">
        <Input id="headline" value={draft.headline} maxLength={120} onChange={(e) => set("headline", e.target.value)} />
      </Field>
      <Field id="bio" label="Bio">
        <Textarea id="bio" rows={4} value={draft.bio} maxLength={500} onChange={(e) => set("bio", e.target.value)} />
      </Field>
      <Field id="location" label="Location (optional)">
        <Input id="location" value={draft.location ?? ""} maxLength={80} onChange={(e) => set("location", e.target.value || null)} />
      </Field>
      <div className="rounded-xl border border-border bg-background/50 p-4 space-y-3">
        <p className="text-sm font-semibold">CV (PDF)</p>
        <p className="text-sm text-muted-foreground">
          {draft.cv_path ? "A CV is uploaded." : "No CV uploaded yet."} It downloads from the link <span className="font-mono">/cv</span> — point a link there and make it visible.
        </p>
        <div className="flex gap-2">
          <input ref={cvRef} type="file" accept="application/pdf" className="hidden" onChange={(e) => onCv(e.target.files?.[0])} />
          <Button variant="outline" size="sm" onClick={() => cvRef.current?.click()} disabled={uploading}>
            {draft.cv_path ? "Replace CV" : "Upload CV"}
          </Button>
          {draft.cv_path && (
            <Button variant="ghost" size="sm" onClick={() => set("cv_path", null)}>Remove</Button>
          )}
        </div>
      </div>
      <div className="rounded-xl border border-border bg-background/50 p-4 space-y-4">
        <p className="text-sm font-semibold">Search & sharing</p>
        <Field id="seo_title" label="Page title">
          <Input id="seo_title" value={draft.seo_title ?? ""} maxLength={70} placeholder={draft.name} onChange={(e) => set("seo_title", e.target.value || null)} />
        </Field>
        <Field id="seo_description" label="Meta description">
          <Textarea id="seo_description" rows={2} maxLength={160} value={draft.seo_description ?? ""} onChange={(e) => set("seo_description", e.target.value || null)} />
        </Field>
      </div>
      <Button onClick={onSave} disabled={saving}>{saving ? "Saving…" : "Save profile"}</Button>
    </div>
  );
}

export function Field({ id, label, children }: { id: string; label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id}>{label}</Label>
      {children}
    </div>
  );
}
