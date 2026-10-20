import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useState, type MouseEvent } from "react";
import { ProfileView } from "@/components/ProfileView";
import { castQuizVote, getPublicPage, trackEvent } from "@/lib/public-page.functions";
import type { LinkRow } from "@/lib/page-types";

export const Route = createFileRoute("/")({
  loader: () => getPublicPage(),
  head: ({ loaderData }) => {
    const p = loaderData?.profile;
    const title = p?.seo_title || (p ? `${p.name}${p.headline ? ` — ${p.headline}` : ""}` : "Links");
    const description = p?.seo_description || p?.bio || "Links, projects and ways to get in touch.";
    return {
      meta: [
        { title },
        { name: "description", content: description },
        { property: "og:title", content: title },
        { property: "og:description", content: description },
        { property: "og:type", content: "profile" },
        { name: "twitter:card", content: "summary" },
        { name: "twitter:title", content: title },
        { name: "twitter:description", content: description },
      ],
      links: p?.avatar_url ? [{ rel: "icon", href: p.avatar_url }] : [],
    };
  },
  component: PublicPage,
});

function PublicPage() {
  const data = Route.useLoaderData();
  const track = useServerFn(trackEvent);
  const vote = useServerFn(castQuizVote);
  const [dark, setDark] = useState(data.profile.theme === "dark");

  useEffect(() => {
    const saved = localStorage.getItem("theme");
    if (saved === "dark" || saved === "light") setDark(saved === "dark");
    track({ data: { type: "view", referrer: document.referrer || undefined } }).catch(() => {});
  }, [track]);

  const toggle = () =>
    setDark((d) => {
      localStorage.setItem("theme", d ? "light" : "dark");
      return !d;
    });

  const onLinkClick = (link: LinkRow, e: MouseEvent<HTMLAnchorElement>) => {
    const p = track({ data: { type: "click", linkId: link.id } }).catch(() => {});
    if (!link.open_new_tab && !e.metaKey && !e.ctrlKey) {
      e.preventDefault();
      Promise.race([p, new Promise((r) => setTimeout(r, 350))]).then(() => {
        window.location.href = link.url;
      });
    }
  };

  return <ProfileView data={data} dark={dark} onToggleTheme={toggle} onLinkClick={onLinkClick} onQuizVote={(choice) => vote({ data: { choice } })} />;
}
