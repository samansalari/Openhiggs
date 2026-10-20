import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";
import { ExternalLink, LogOut } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ProfileView } from "@/components/ProfileView";
import { profileSchema, hexColorSchema } from "@/lib/validation";
import { isStoragePath, type Profile } from "@/lib/page-types";
import { qk, useCategories, useIsAdmin, useLinks, useProfile, useSignedUrls, useSocials } from "@/components/admin/data";
import { ProfileTab } from "@/components/admin/ProfileTab";
import { AppearanceTab } from "@/components/admin/AppearanceTab";
import { LinksTab } from "@/components/admin/LinksTab";
import { CategoriesTab } from "@/components/admin/CategoriesTab";
import { SocialsTab } from "@/components/admin/SocialsTab";
import { AnalyticsTab } from "@/components/admin/AnalyticsTab";
import { QuizTab } from "@/components/admin/QuizTab";

export const Route = createFileRoute("/_authenticated/admin")({
  head: () => ({
    meta: [
      { title: "Dashboard — Link page admin" },
      { name: "description", content: "Manage your profile, links and analytics." },
      { property: "og:title", content: "Dashboard — Link page admin" },
      { property: "og:description", content: "Manage your profile, links and analytics." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AdminPage,
});

function AdminPage() {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const isAdmin = useIsAdmin();
  const profile = useProfile();
  const categories = useCategories();
  const links = useLinks();
  const socials = useSocials();
  const [draft, setDraft] = useState<Profile | null>(null);
  const [saving, setSaving] = useState(false);
  const [previewDark, setPreviewDark] = useState(false);

  useEffect(() => {
    if (profile.data && !draft) {
      setDraft(profile.data);
      setPreviewDark(profile.data.theme === "dark");
    }
  }, [profile.data, draft]);
  useEffect(() => {
    if (draft) setPreviewDark(draft.theme === "dark");
  }, [draft?.theme]); // eslint-disable-line react-hooks/exhaustive-deps

  const signed = useSignedUrls([draft?.avatar_url, ...(links.data ?? []).map((l) => l.thumbnail_url)]);
  const map = signed.data ?? {};
  const resolve = (v: string | null | undefined) => (v ? (isStoragePath(v) ? map[v] ?? null : v) : null);

  const previewData = useMemo(
    () =>
      draft && {
        profile: { ...draft, avatar_url: resolve(draft.avatar_url), accent_color: hexColorSchema.safeParse(draft.accent_color).success ? draft.accent_color : "#E7AC3B" },
        categories: categories.data ?? [],
        links: (links.data ?? []).map((l) => ({ ...l, thumbnail_url: resolve(l.thumbnail_url) })),
        socials: socials.data ?? [],
      },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [draft, categories.data, links.data, socials.data, map],
  );

  async function saveProfile() {
    if (!draft) return;
    const parsed = profileSchema.safeParse({ ...draft, location: draft.location ?? "" });
    if (!parsed.success) return void toast.error(parsed.error.issues[0]?.message ?? "Check the form");
    setSaving(true);
    const { id: _id, updated_at: _u, ...rest } = draft;
    const { error } = await supabase
      .from("profile")
      .update({ ...rest, ...parsed.data, location: parsed.data.location || null, updated_at: new Date().toISOString() })
      .eq("id", 1);
    setSaving(false);
    if (error) return void toast.error(error.message);
    toast.success("Saved — your public page is updated.");
    qc.invalidateQueries({ queryKey: qk.profile });
  }

  async function signOut() {
    await qc.cancelQueries();
    qc.clear();
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  }

  if (isAdmin.isLoading || profile.isLoading || !draft) {
    return <div className="flex min-h-screen items-center justify-center text-muted-foreground">Loading…</div>;
  }
  if (!isAdmin.data) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 px-5 text-center">
        <h1 className="text-xl font-bold">No admin access</h1>
        <p className="max-w-sm text-sm text-muted-foreground">This account can't manage the page. Sign in with the owner account.</p>
        <Button onClick={signOut}>Sign out</Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-20 border-b border-border bg-background/95 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-5">
          <p className="font-bold">Dashboard</p>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" asChild>
              <a href="/" target="_blank" rel="noopener noreferrer"><ExternalLink /> View page</a>
            </Button>
            <Button variant="ghost" size="sm" onClick={signOut}><LogOut /> <span className="hidden sm:inline">Sign out</span></Button>
          </div>
        </div>
      </header>

      <div className="mx-auto grid max-w-6xl gap-8 px-5 py-8 lg:grid-cols-[1fr_380px]">
        <Tabs defaultValue="links" className="min-w-0">
          <TabsList className="mb-6 flex h-auto w-full flex-wrap justify-start gap-1 rounded-xl bg-muted p-1">
            {["links", "profile", "categories", "socials", "appearance", "quiz", "analytics"].map((t) => (
              <TabsTrigger key={t} value={t} className="rounded-lg capitalize data-[state=active]:bg-card">
                {t}
              </TabsTrigger>
            ))}
          </TabsList>
          <TabsContent value="links">
            <LinksTab links={links.data ?? []} categories={categories.data ?? []} signed={map} />
          </TabsContent>
          <TabsContent value="profile">
            <ProfileTab draft={draft} setDraft={setDraft} avatarUrl={resolve(draft.avatar_url)} onSave={saveProfile} saving={saving} />
          </TabsContent>
          <TabsContent value="categories">
            <CategoriesTab categories={categories.data ?? []} />
          </TabsContent>
          <TabsContent value="socials">
            <SocialsTab socials={socials.data ?? []} />
          </TabsContent>
          <TabsContent value="appearance">
            <AppearanceTab draft={draft} setDraft={setDraft} onSave={saveProfile} saving={saving} />
          </TabsContent>
          <TabsContent value="quiz">
            <QuizTab />
          </TabsContent>
          <TabsContent value="analytics">
            <AnalyticsTab links={links.data ?? []} />
          </TabsContent>
        </Tabs>

        <aside className="hidden lg:block">
          <div className="sticky top-24">
            <p className="mb-3 text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">Live preview</p>
            <div className="h-[720px] overflow-y-auto rounded-[2rem] border-[6px] border-primary bg-background shadow-lift">
              {previewData && <ProfileView data={previewData} dark={previewDark} onToggleTheme={() => setPreviewDark((d) => !d)} compact onLinkClick={(_, e) => e.preventDefault()} />}
            </div>
            <p className="mt-2 text-xs text-muted-foreground">Profile and appearance edits show here before you save.</p>
          </div>
        </aside>
      </div>
    </div>
  );
}
