import type { Tables } from "@/integrations/supabase/types";

export type Profile = Tables<"profile">;
export type Category = Tables<"categories">;
export type LinkRow = Tables<"links">;
export type SocialLink = Tables<"social_links">;
export type Quiz = Tables<"quiz">;
export type QuizChoice = "a" | "b" | "c";

/** Quiz as shown publicly. Answer and totals are only present after the owner reveals them. */
export interface PublicQuiz extends Quiz {
  reveal: { correct: QuizChoice; votesA: number; votesB: number; votesC: number } | null;
}

/** Data needed to render the public page. Image fields hold display-ready URLs. */
export interface PageData {
  profile: Profile;
  categories: Category[];
  links: LinkRow[];
  socials: SocialLink[];
  quiz?: PublicQuiz | null;
}

/** Stored media values are full URLs, same-site paths ("/..."), or a path inside the avatars bucket. */
export function isStoragePath(value: string | null | undefined): value is string {
  return !!value && !/^https?:\/\//.test(value) && !value.startsWith("/");
}
