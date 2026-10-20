import { Pause, Play, RotateCcw, Volume2, VolumeX, Check, Sparkles, PartyPopper, XCircle } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import type { PublicQuiz, QuizChoice } from "@/lib/page-types";
import { cn } from "@/lib/utils";

interface Props {
  quiz: PublicQuiz;
  /** Omit to render a non-interactive preview (admin). */
  onVote?: ((choice: QuizChoice) => Promise<unknown>) | undefined;
}


export function QuizSection({ quiz, onVote }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [playing, setPlaying] = useState(false);
  const [muted, setMuted] = useState(true);
  const [ended, setEnded] = useState(false);
  const [vote, setVote] = useState<QuizChoice | null>(null);
  const [outcome, setOutcome] = useState<"correct" | "wrong" | null>(null);
  const [shaking, setShaking] = useState(false);
  const [sending, setSending] = useState(false);

  // Fresh voting session on every page load (incl. back/forward cache restores).
  useEffect(() => {
    const onShow = (e: PageTransitionEvent) => {
      if (e.persisted) { setVote(null); setOutcome(null); setShaking(false); setSending(false); }
    };
    window.addEventListener("pageshow", onShow);
    return () => window.removeEventListener("pageshow", onShow);
  }, []);

  const toggle = () => {
    const v = videoRef.current;
    if (!v) return;
    if (v.paused) void v.play().catch(() => {});
    else v.pause();
  };
  const replay = () => {
    const v = videoRef.current;
    if (!v) return;
    v.currentTime = 0;
    void v.play().catch(() => {});
  };
  const toggleMute = () => {
    const v = videoRef.current;
    if (!v) return;
    v.muted = !v.muted;
    setMuted(v.muted);
  };

  const triggerShake = () => {
    setShaking(false);
    requestAnimationFrame(() => requestAnimationFrame(() => setShaking(true)));
  };

  async function choose(choice: QuizChoice) {
    if (!onVote || sending) return;
    if (vote && outcome === "correct") return; // already won — nothing more to do
    if (vote) {
      // Both characters tapped: still wrong, shake again.
      if (outcome === "wrong") triggerShake();
      return;
    }
    setSending(true);
    setVote(choice);
    let result: "correct" | "wrong" | null = null;
    try {
      const res = (await onVote(choice)) as { correct?: boolean | null } | undefined;
      result = res?.correct === true ? "correct" : res?.correct === false ? "wrong" : null;
    } catch {
      result = null;
    }
    setOutcome(result);
    if (result === "wrong") triggerShake();
    setSending(false);
  }

  const options: { key: QuizChoice; label: string }[] = [
    { key: "a", label: quiz.option_a },
    { key: "b", label: quiz.option_b },
    ...(quiz.option_c.trim() ? [{ key: "c" as const, label: quiz.option_c }] : []),
  ];
  const labelFor = (key: QuizChoice) => options.find((o) => o.key === key)?.label ?? "";
  const reveal = quiz.reveal;
  const total = reveal ? reveal.votesA + reveal.votesB + reveal.votesC : 0;
  const pct = (n: number) => (total ? Math.round((n / total) * 100) : 0);

  return (
    <section
      aria-labelledby="quiz-title"
      className={cn("animate-rise relative rounded-2xl border border-border bg-card p-4 sm:p-5", shaking && "animate-shake")}
      onAnimationEnd={(e) => {
        if (e.target === e.currentTarget) setShaking(false);
      }}
    >
      {outcome === "correct" && <Confetti />}
      <p className="inline-flex items-center gap-1.5 rounded-full bg-brand-accent px-2.5 py-1 text-[0.7rem] font-semibold uppercase tracking-[0.12em] text-brand-accent-foreground">
        <Sparkles className="h-3 w-3" aria-hidden="true" /> Quick game
      </p>
      <h2 id="quiz-title" className="mt-3 text-xl font-bold">{quiz.title}</h2>
      {quiz.subtitle && <p className="mt-1 text-sm text-muted-foreground">{quiz.subtitle}</p>}

      {quiz.video_url && (
        <div className="relative mx-auto mt-4 aspect-[9/16] w-full max-w-[320px] overflow-hidden rounded-2xl border border-border bg-foreground/5 max-h-[70vh]">
          <video
            ref={videoRef}
            src={quiz.video_url}
            poster={quiz.poster_url ?? undefined}
            className="h-full w-full object-cover"
            playsInline
            muted
            autoPlay
            preload="metadata"
            onClick={toggle}
            onPlay={() => { setPlaying(true); setEnded(false); }}
            onPause={() => setPlaying(false)}
            onEnded={() => { setPlaying(false); setEnded(true); }}
            aria-label={quiz.title}
          />
          {ended && (
            <button
              type="button"
              onClick={replay}
              className="absolute inset-0 m-auto inline-flex h-14 w-14 items-center justify-center rounded-full bg-background/90 text-foreground shadow-lift transition-transform duration-200 hover:scale-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              aria-label="Replay video"
            >
              <RotateCcw className="h-6 w-6" />
            </button>
          )}
          <div className="absolute inset-x-3 bottom-3 flex items-center justify-between">
            <div className="flex gap-2">
              <VideoBtn onClick={toggle} label={playing ? "Pause" : "Play"}>
                {playing ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
              </VideoBtn>
              <VideoBtn onClick={replay} label="Replay from start">
                <RotateCcw className="h-4 w-4" />
              </VideoBtn>
            </div>
            <VideoBtn onClick={toggleMute} label={muted ? "Unmute" : "Mute"}>
              {muted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
            </VideoBtn>
          </div>
        </div>
      )}

      {quiz.question && <p className="mt-4 text-center font-semibold">{quiz.question}</p>}

      <div className="mt-3 grid gap-2.5 sm:grid-cols-2" role="group" aria-label={quiz.question || "Your guess"}>
        {options.map((o) => {
          const picked = vote === o.key;
          const correct = reveal?.correct === o.key;
          const votes = o.key === "a" ? reveal?.votesA ?? 0 : o.key === "b" ? reveal?.votesB ?? 0 : reveal?.votesC ?? 0;
          return (
            <button
              key={o.key}
              type="button"
              onClick={() => choose(o.key)}
              disabled={!onVote || sending || outcome === "correct"}
              aria-pressed={picked}
              className={cn(
                "relative flex min-h-12 items-center justify-center gap-2 overflow-hidden rounded-xl border border-border bg-background px-4 py-3 text-sm font-semibold transition-all duration-200",
                !vote && onVote && !sending && "hover:-translate-y-0.5 hover:border-highlight hover:text-highlight active:scale-[0.98]",
                picked && "border-brand-accent bg-brand-accent text-brand-accent-foreground",
                vote && !picked && outcome && "opacity-60",
                o.key === "c" && "sm:col-span-2",
                reveal && correct && "ring-2 ring-highlight",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-default",
              )}
            >
              {picked && (outcome === "wrong" ? <XCircle className="h-4 w-4" aria-hidden="true" /> : <Check className="h-4 w-4" aria-hidden="true" />)}
              <span>{o.label}</span>
              {reveal && <span className="text-xs font-medium opacity-75">· {pct(votes)}%</span>}
            </button>
          );
        })}
      </div>

      <div aria-live="polite" className="mt-3 min-h-5 text-center text-sm">
        {outcome === "correct" && (
          <p className="animate-pop inline-flex items-center justify-center gap-1.5 font-bold text-highlight">
            <PartyPopper className="h-4 w-4" aria-hidden="true" /> Correct — you spotted the AI!
          </p>
        )}
        {outcome === "wrong" && (
          <p role="alert" className="inline-flex items-center justify-center gap-1.5 font-semibold text-destructive">
            <XCircle className="h-4 w-4" aria-hidden="true" /> {quiz.wrong_message.trim() || "Not quite — try again!"}
          </p>
        )}
        {vote && !outcome && <p className="font-semibold text-highlight">Thanks for guessing!</p>}
        {reveal && (
          <p className="mt-1 text-muted-foreground">
            The AI one was <span className="font-semibold text-foreground">{labelFor(reveal.correct)}</span>
            {vote && (vote === reveal.correct ? " — you got it right." : " — tricky, right?")}
          </p>
        )}
      </div>
    </section>
  );
}

const CONFETTI_COLORS = ["var(--golden)", "var(--burnt)", "var(--espresso)", "oklch(0.93 0.08 95)"];

/** Small celebratory burst rendered inside the quiz card on a correct guess. */
function Confetti() {
  const pieces = Array.from({ length: 18 }, (_, i) => ({
    left: 4 + Math.random() * 92,
    delay: Math.random() * 0.35,
    duration: 1.5 + Math.random() * 1.2,
    color: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
    size: 5 + Math.random() * 6,
  }));
  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden">
      {pieces.map((p, i) => (
        <span
          key={i}
          className="confetti-piece"
          style={{
            left: `${p.left}%`,
            width: p.size,
            height: p.size * 0.62,
            background: p.color,
            animationDelay: `${p.delay}s`,
            animationDuration: `${p.duration}s`,
          }}
        />
      ))}
    </div>
  );
}

function VideoBtn({ onClick, label, children }: { onClick: () => void; label: string; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-background/85 text-foreground transition-colors duration-200 hover:text-highlight focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
    >
      {children}
    </button>
  );
}
