<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

## Architecture rules
- Public page data loads via `getPublicPage` server fn with the publishable key; keeps SSR + share metadata working without auth.
- Admin UI talks to the database directly with the browser client; RLS (`has_role(..., 'admin')`) is the security boundary.
- Analytics writes only go through the `trackEvent` server fn (bot filter + hashed, day-salted rate limit); no visitor PII is stored.
- Images live in the private `avatars` bucket; DB stores the storage path and readers sign URLs (workspace blocks public buckets).
- The first account to sign up becomes admin via an `auth.users` trigger; sign-up UI hides once an admin exists.
- All colours come from tokens in src/styles.css; the per-profile accent is injected as the `--brand-accent` CSS var.
- The "Spot the AI" quiz answer lives in an admin-only table and is exposed publicly only via the `quiz_public_reveal()` function once revealed; votes go only through the `castQuizVote` server fn (hashed, one per visitor per round).
