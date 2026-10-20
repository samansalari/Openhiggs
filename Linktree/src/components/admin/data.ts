import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { isStoragePath, type Category, type LinkRow, type Profile, type SocialLink } from "@/lib/page-types";

export const qk = {
  profile: ["admin", "profile"] as const,
  categories: ["admin", "categories"] as const,
  links: ["admin", "links"] as const,
  socials: ["admin", "socials"] as const,
  isAdmin: ["admin", "isAdmin"] as const,
};

function unwrap<T>(res: { data: T | null; error: { message: string } | null }): T {
  if (res.error) throw new Error(res.error.message);
  return res.data as T;
}

export const useIsAdmin = () =>
  useQuery({
    queryKey: qk.isAdmin,
    queryFn: async () => {
      const { data: u } = await supabase.auth.getUser();
      if (!u.user) return false;
      return unwrap(await supabase.rpc("has_role", { _user_id: u.user.id, _role: "admin" })) as boolean;
    },
  });

export const useProfile = () =>
  useQuery({ queryKey: qk.profile, queryFn: async () => unwrap<Profile>(await supabase.from("profile").select("*").eq("id", 1).single()) });
export const useCategories = () =>
  useQuery({ queryKey: qk.categories, queryFn: async () => unwrap<Category[]>(await supabase.from("categories").select("*").order("position")) });
export const useLinks = () =>
  useQuery({ queryKey: qk.links, queryFn: async () => unwrap<LinkRow[]>(await supabase.from("links").select("*").order("position")) });
export const useSocials = () =>
  useQuery({ queryKey: qk.socials, queryFn: async () => unwrap<SocialLink[]>(await supabase.from("social_links").select("*").order("position")) });

export function useInvalidate() {
  const qc = useQueryClient();
  return (key: readonly string[]) => qc.invalidateQueries({ queryKey: key });
}

/** Persist a new order: position = index. */
export async function saveOrder(table: "links" | "categories" | "social_links", ids: string[]) {
  const results = await Promise.all(ids.map((id, i) => supabase.from(table).update({ position: i }).eq("id", id)));
  const err = results.find((r) => r.error)?.error;
  if (err) throw new Error(err.message);
}

export async function uploadImage(file: File): Promise<string> {
  if (!file.type.startsWith("image/")) throw new Error("Please choose an image file");
  if (file.size > 5 * 1024 * 1024) throw new Error("Image must be under 5 MB");
  const ext = file.name.split(".").pop()?.toLowerCase().replace(/[^a-z0-9]/g, "") || "jpg";
  const path = `${crypto.randomUUID()}.${ext}`;
  const { error } = await supabase.storage.from("avatars").upload(path, file, { contentType: file.type });
  if (error) throw new Error(error.message);
  return path;
}

/** Resolve stored storage paths into viewable signed URLs for the admin preview. */
export function useSignedUrls(values: (string | null | undefined)[]) {
  const paths = values.filter(isStoragePath).sort();
  return useQuery({
    queryKey: ["admin", "signed", paths],
    enabled: paths.length > 0,
    staleTime: 30 * 60 * 1000,
    queryFn: async () => {
      const { data } = await supabase.storage.from("avatars").createSignedUrls(paths, 60 * 60);
      const map: Record<string, string> = {};
      data?.forEach((d) => d.path && d.signedUrl && (map[d.path] = d.signedUrl));
      return map;
    },
  });
}

export async function uploadPdf(file: File): Promise<string> {
  if (file.type !== "application/pdf") throw new Error("Please choose a PDF file");
  if (file.size > 5 * 1024 * 1024) throw new Error("PDF must be under 5 MB");
  const path = `cv/${crypto.randomUUID()}.pdf`;
  const { error } = await supabase.storage.from("avatars").upload(path, file, { contentType: "application/pdf" });
  if (error) throw new Error(error.message);
  return path;
}
