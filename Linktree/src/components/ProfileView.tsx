import { MapPin, Moon, Sun, ArrowUpRight } from "lucide-react";
import { useState, type CSSProperties, type MouseEvent } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { faviconUrl, LinkIconView, SocialIconView, SOCIAL_PLATFORMS } from "@/lib/icons";
import type { LinkRow, PageData, QuizChoice } from "@/lib/page-types";
import { QuizSection } from "@/components/QuizSection";
import { cn } from "@/lib/utils";

interface Props {
  data: PageData;
  dark: boolean;
  onToggleTheme?: () => void;
  onLinkClick?: (link: LinkRow, e: MouseEvent<HTMLAnchorElement>) => void;
  compact?: boolean;
  onQuizVote?: (choice: QuizChoice) => Promise<unknown>;
}

function initials(name: string) {
  return name.split(/\s+/).filter(Boolean).slice(0, 2).map((p) => p[0]?.toUpperCase()).join("") || "?";
}

/** Thumbnail, site favicon, or fallback icon for a link card. */
function LinkThumb({ link }: { link: LinkRow }) {
  const [failed, setFailed] = useState(false);
  if (link.thumbnail_url) {
    return <img src={link.thumbnail_url} alt="" className="h-full w-full object-cover" loading="lazy" />;
  }
  const favicon = link.use_favicon && !failed ? faviconUrl(link.url) : null;
  if (favicon) {
    return <img src={favicon} alt="" className="h-5 w-5" loading="lazy" onError={() => setFailed(true)} />;
  }
  return <LinkIconView name={link.icon} className="h-5 w-5 text-foreground" />;
}

export function ProfileView({ data, dark, onToggleTheme, onLinkClick, compact, onQuizVote }: Props) {
  const { profile, categories, links, socials } = data;
  const visible = links.filter((l) => l.is_visible).sort((a, b) => a.position - b.position);
  const accentStyle = { "--brand-accent": profile.accent_color } as CSSProperties;

  const groups: { id: string; name: string | null; items: LinkRow[] }[] = [];
  if (profile.show_categories && categories.length) {
    for (const c of [...categories].sort((a, b) => a.position - b.position)) {
      const items = visible.filter((l) => l.category_id === c.id);
      if (items.length) groups.push({ id: c.id, name: c.name, items });
    }
    const rest = visible.filter((l) => !categories.some((c) => c.id === l.category_id));
    if (rest.length) groups.push({ id: "uncategorised", name: null, items: rest });
  } else {
    groups.push({ id: "all", name: null, items: visible });
  }

  return (
    <div className={cn(dark && "dark")} style={accentStyle}>
      <div
        className={cn(
          "min-h-full bg-background text-foreground",
          profile.background_style === "texture" && "bg-texture",
          compact ? "min-h-[640px]" : "min-h-screen",
        )}
      >
        <main className={cn("relative mx-auto w-full max-w-[560px] px-5", compact ? "pt-10 pb-10" : "pt-14 pb-16 sm:pt-20")}>
          {onToggleTheme && (
            <button
              type="button"
              onClick={onToggleTheme}
              aria-label={dark ? "Switch to light mode" : "Switch to dark mode"}
              className="absolute right-5 top-5 inline-flex h-10 w-10 items-center justify-center rounded-full border border-border bg-card text-foreground transition-colors duration-200 hover:border-highlight hover:text-highlight focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              {dark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </button>
          )}

          <header className="animate-rise flex flex-col items-center text-center">
            <Avatar className="h-24 w-24 border border-border sm:h-28 sm:w-28">
              {profile.avatar_url && <AvatarImage src={profile.avatar_url} alt={profile.name} className="object-cover" />}
              <AvatarFallback className="bg-brand-accent text-2xl font-semibold text-brand-accent-foreground">
                {initials(profile.name)}
              </AvatarFallback>
            </Avatar>
            <h1 className="mt-5 text-[1.75rem] font-bold sm:text-3xl">{profile.name}</h1>
            {profile.headline && <p className="mt-1.5 text-base font-medium text-foreground/80">{profile.headline}</p>}
            {profile.location && (
              <p className="mt-2 inline-flex items-center gap-1 text-sm text-muted-foreground">
                <MapPin className="h-3.5 w-3.5" aria-hidden="true" />
                {profile.location}
              </p>
            )}
            {profile.bio && <p className="mt-4 max-w-[42ch] text-[0.95rem] text-muted-foreground">{profile.bio}</p>}
            {socials.length > 0 && (
              <ul className="mt-5 flex flex-wrap justify-center gap-2" aria-label="Social profiles">
                {socials.map((s) => (
                  <li key={s.id}>
                    <a
                      href={s.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label={SOCIAL_PLATFORMS[s.platform]?.label ?? s.platform}
                      className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-border bg-card text-foreground transition-all duration-200 hover:-translate-y-0.5 hover:border-highlight hover:text-highlight focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    >
                      <SocialIconView platform={s.platform} className="h-[18px] w-[18px]" />
                    </a>
                  </li>
                ))}
              </ul>
            )}
          </header>

          <div className="mt-10 space-y-8">
            {groups.map((g, gi) => (
              <section key={g.id} aria-label={g.name ?? "Links"} className="animate-rise" style={{ animationDelay: `${80 + gi * 60}ms` }}>
                {g.name && (
                  <h2 className="mb-3 px-1 text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">{g.name}</h2>
                )}
                <ul className="space-y-3">
                  {g.items.map((l) => (
                    <li key={l.id}>
                      <a
                        href={l.url}
                        target={l.open_new_tab ? "_blank" : undefined}
                        rel={l.open_new_tab ? "noopener noreferrer" : undefined}
                        onClick={(e) => onLinkClick?.(l, e)}
                        className={cn(
                          "link-card group",
                          l.is_featured && "border-brand-accent bg-brand-accent text-brand-accent-foreground",
                        )}
                      >
                        <span
                          className={cn(
                            "flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-border bg-background",
                            l.is_featured && "border-brand-accent-foreground/20 bg-background/70",
                          )}
                        >
                          <LinkThumb link={l} />
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="block font-semibold [display:-webkit-box] [-webkit-box-orient:vertical] [-webkit-line-clamp:2] overflow-hidden">{l.title}</span>
                          {l.description && (
                            <span className={cn("mt-0.5 block text-sm text-muted-foreground [display:-webkit-box] [-webkit-box-orient:vertical] [-webkit-line-clamp:2] overflow-hidden", l.is_featured && "text-brand-accent-foreground/75")}>
                              {l.description}
                            </span>
                          )}
                        </span>
                        <ArrowUpRight
                          className="h-4 w-4 shrink-0 opacity-50 transition-all duration-200 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-highlight group-hover:opacity-100"
                          aria-hidden="true"
                        />
                      </a>
                    </li>
                  ))}
                </ul>
              </section>
            ))}
            {visible.length === 0 && <p className="text-center text-sm text-muted-foreground">No links yet.</p>}
          </div>

          {data.quiz && (
            <div className="mt-8">
              <QuizSection quiz={data.quiz} onVote={onQuizVote} />
            </div>
          )}

          <footer className="mt-14 text-center text-xs text-muted-foreground">© {new Date().getFullYear()} {profile.name}</footer>
        </main>
      </div>
    </div>
  );
}
