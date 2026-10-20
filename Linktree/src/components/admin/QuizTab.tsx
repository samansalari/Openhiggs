import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { Upload } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { QuizSection } from "@/components/QuizSection";
import { isStoragePath, type Quiz, type QuizChoice } from "@/lib/page-types";
import { useSignedUrls } from "./data";
import { cn } from "@/lib/utils";

const keys = { quiz: ["admin", "quiz"] as const, answer: ["admin", "quiz-answer"] as const, votes: ["admin", "quiz-votes"] as const };

async function uploadVideo(file: File): Promise<string> {
  if (!file.type.startsWith("video/")) throw new Error("Please choose a video file (MP4 works best)");
  if (file.size > 50 * 1024 * 1024) throw new Error("Video must be under 50 MB");
  const ext = file.name.split(".").pop()?.toLowerCase().replace(/[^a-z0-9]/g, "") || "mp4";
  const path = `quiz/${crypto.randomUUID()}.${ext}`;
  const { error } = await supabase.storage.from("avatars").upload(path, file, { contentType: file.type });
  if (error) throw new Error(error.message);
  return path;
}

export function QuizTab() {
  const qc = useQueryClient();
  const quiz = useQuery({
    queryKey: keys.quiz,
    queryFn: async () => {
      const r = await supabase.from("quiz").select("*").eq("id", 1).single();
      if (r.error) throw new Error(r.error.message);
      return r.data;
    },
  });
  const answer = useQuery({
    queryKey: keys.answer,
    queryFn: async () => (await supabase.from("quiz_answer").select("correct_option").eq("id", 1).maybeSingle()).data?.correct_option ?? null,
  });
  const votes = useQuery({
    queryKey: keys.votes,
    queryFn: async () => {
      const { data } = await supabase.from("quiz_votes").select("choice");
      return { a: data?.filter((v) => v.choice === "a").length ?? 0, b: data?.filter((v) => v.choice === "b").length ?? 0, c: data?.filter((v) => v.choice === "c").length ?? 0 };
    },
  });

  const [draft, setDraft] = useState<Quiz | null>(null);
  const [correct, setCorrect] = useState<QuizChoice | null>(null);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => { if (quiz.data && !draft) setDraft(quiz.data); }, [quiz.data, draft]);
  useEffect(() => { if (answer.data !== undefined) setCorrect((answer.data as QuizChoice | null) ?? null); }, [answer.data]);

  const signed = useSignedUrls([draft?.video_url, draft?.poster_url]);
  if (!draft) return <p className="text-sm text-muted-foreground">Loading…</p>;
  const set = <K extends keyof Quiz>(k: K, v: Quiz[K]) => setDraft({ ...draft, [k]: v });
  const resolve = (v: string | null) => (isStoragePath(v) ? signed.data?.[v] ?? null : v);

  async function onFile(file?: File) {
    if (!file || !draft) return;
    setUploading(true);
    try {
      const path = await uploadVideo(file);
      setDraft({ ...draft, video_url: path, poster_url: null });
      toast.success("Video uploaded — press Save to publish it.");
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setUploading(false);
    }
  }

  async function save() {
    if (!draft) return;
    if (draft.reveal_answer && !correct) return void toast.error("Pick the correct answer before revealing it.");
    if (!draft.option_a.trim() || !draft.option_b.trim()) return void toast.error("Both options need a label.");
    if (correct === "c" && !draft.option_c.trim()) return void toast.error("Option 3 needs a label before it can be the answer.");
    setSaving(true);
    const { id: _id, updated_at: _u, round: _r, ...rest } = draft;
    const [a, b] = await Promise.all([
      supabase.from("quiz").update({ ...rest, updated_at: new Date().toISOString() }).eq("id", 1),
      supabase.from("quiz_answer").update({ correct_option: correct }).eq("id", 1),
    ]);
    setSaving(false);
    const err = a.error ?? b.error;
    if (err) return void toast.error(err.message);
    toast.success("Saved — your public page is updated.");
    qc.invalidateQueries({ queryKey: keys.quiz });
    qc.invalidateQueries({ queryKey: keys.answer });
  }

  async function resetVotes() {
    if (!draft || !confirm("Clear all votes and let everyone vote again?")) return;
    const del = await supabase.from("quiz_votes").delete().not("id", "is", null);
    if (del.error) return void toast.error(del.error.message);
    const up = await supabase.from("quiz").update({ round: draft.round + 1 }).eq("id", 1);
    if (up.error) return void toast.error(up.error.message);
    setDraft({ ...draft, round: draft.round + 1 });
    toast.success("Votes cleared.");
    qc.invalidateQueries({ queryKey: keys.votes });
  }

  const total = (votes.data?.a ?? 0) + (votes.data?.b ?? 0) + (votes.data?.c ?? 0);

  return (
    <div className="space-y-7">
      <div className="flex items-center justify-between rounded-xl border border-border bg-card p-4">
        <div>
          <p className="font-semibold">Show "Spot the AI" game</p>
          <p className="text-sm text-muted-foreground">Appears below your links.</p>
        </div>
        <Switch checked={draft.is_enabled} onCheckedChange={(v) => set("is_enabled", v)} aria-label="Show game" />
      </div>

      <div className="grid gap-4">
        <Field label="Title"><Input value={draft.title} maxLength={80} onChange={(e) => set("title", e.target.value)} /></Field>
        <Field label="Subtitle"><Input value={draft.subtitle} maxLength={200} onChange={(e) => set("subtitle", e.target.value)} /></Field>
        <Field label="Question"><Input value={draft.question} maxLength={120} onChange={(e) => set("question", e.target.value)} /></Field>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Option 1"><Input value={draft.option_a} maxLength={60} onChange={(e) => set("option_a", e.target.value)} /></Field>
          <Field label="Option 2"><Input value={draft.option_b} maxLength={60} onChange={(e) => set("option_b", e.target.value)} /></Field>
        </div>
        <Field label="Option 3 (optional — leave empty to hide this button)"><Input value={draft.option_c} maxLength={60} onChange={(e) => set("option_c", e.target.value)} /></Field>
      </div>

      <div className="space-y-2">
        <Label>Video</Label>
        <input ref={fileRef} type="file" accept="video/mp4,video/webm,video/quicktime" className="hidden" onChange={(e) => onFile(e.target.files?.[0])} />
        <Button type="button" variant="outline" onClick={() => fileRef.current?.click()} disabled={uploading}>
          <Upload /> {uploading ? "Uploading…" : "Replace video"}
        </Button>
        <p className="text-xs text-muted-foreground">Vertical MP4 under 50 MB works best. Consider resetting votes after changing it.</p>
      </div>

      <div className="space-y-3 rounded-xl border border-border bg-card p-4">
        <p className="font-semibold">Answer</p>
        <div className="grid gap-2 sm:grid-cols-2" role="radiogroup" aria-label="Correct answer">
          {(draft.option_c.trim() ? (["a", "b", "c"] as const) : (["a", "b"] as const)).map((k) => (
            <button
              key={k}
              type="button"
              role="radio"
              aria-checked={correct === k}
              onClick={() => setCorrect(k)}
              className={cn("rounded-xl border border-border px-3 py-2.5 text-sm font-semibold transition-colors", correct === k ? "border-brand-accent bg-brand-accent text-brand-accent-foreground" : "hover:border-highlight")}
            >
              {k === "a" ? draft.option_a : k === "b" ? draft.option_b : draft.option_c} is AI
            </button>
          ))}
        </div>
        <Field label="Message shown on a wrong guess"><Input value={draft.wrong_message} maxLength={120} onChange={(e) => set("wrong_message", e.target.value)} /></Field>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium">Reveal answer to visitors</p>
            <p className="text-xs text-muted-foreground">Kept secret until you switch this on and save.</p>
          </div>
          <Switch checked={draft.reveal_answer} onCheckedChange={(v) => set("reveal_answer", v)} aria-label="Reveal answer" />
        </div>
      </div>

      <div className="space-y-2 rounded-xl border border-border bg-card p-4">
        <p className="font-semibold">Votes so far: {total}</p>
        <p className="text-sm text-muted-foreground">{[`${draft.option_a}: ${votes.data?.a ?? 0}`, `${draft.option_b}: ${votes.data?.b ?? 0}`, ...(draft.option_c.trim() ? [`${draft.option_c}: ${votes.data?.c ?? 0}`] : [])].join(" · ")}</p>
        <Button type="button" variant="ghost" size="sm" onClick={resetVotes}>Reset votes</Button>
      </div>

      <Button onClick={save} disabled={saving}>{saving ? "Saving…" : "Save"}</Button>

      <div>
        <p className="mb-2 text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">Preview</p>
        <div className="max-w-[420px]">
          <QuizSection
            quiz={{
              ...draft,
              video_url: resolve(draft.video_url),
              poster_url: resolve(draft.poster_url),
              reveal: draft.reveal_answer && correct ? { correct, votesA: votes.data?.a ?? 0, votesB: votes.data?.b ?? 0, votesC: votes.data?.c ?? 0 } : null,
            }}
          />
        </div>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label>{label}</Label>
      {children}
    </div>
  );
}
