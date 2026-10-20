# Welcome to your Lovable project

This project was built with [Lovable](https://lovable.dev).

## Build with Lovable

Open your project in the [Lovable editor](https://lovable.dev) and keep building.

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: connect the project to GitHub and every change made in Lovable is committed straight to your repository.
- **Full ownership**: this code is yours. Push to your repository and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```

## Built with

- TanStack Start
- TypeScript
- React
- Tailwind CSS

## Deploying to Railway

This repository ships a `Dockerfile`, and Railway always builds with a
Dockerfile when it finds one — so no build or start command needs to be
configured in the dashboard.

1. In Railway: **New project → Deploy from GitHub repo** and pick this repo.
2. In the service's **Variables** tab, set the server-side values:
   - `SUPABASE_URL` — your backend URL
   - `SUPABASE_PUBLISHABLE_KEY` — your publishable (public) key
3. Deploy. Railway injects `PORT` and the server binds to it automatically.

The two browser-facing values (`VITE_SUPABASE_URL`,
`VITE_SUPABASE_PUBLISHABLE_KEY`) are committed in `.env`, so the build works
as-is. To point the deployed site at a different backend, edit `.env` or pass
build args:

```sh
docker build \
  --build-arg VITE_SUPABASE_URL=https://your-project.supabase.co \
  --build-arg VITE_SUPABASE_PUBLISHABLE_KEY=sb_publishable_xxx \
  .
```

Locally the same image runs with:

```sh
docker build -t profile-hub .
docker run -p 8080:8080 --env-file .env profile-hub
```

### What needs extra variables on another host

The public page (profile, links, categories, socials, the quiz video and
buttons) only needs the two variables above. Click analytics and quiz vote
recording write through a privileged key that Lovable Cloud does not hand out,
so on Railway those two stay inactive unless you provide
`SUPABASE_SERVICE_ROLE_KEY` yourself.

