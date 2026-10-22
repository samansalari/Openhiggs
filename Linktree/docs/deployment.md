# Deployment

The repository ships a multi-stage `Dockerfile` (Bun build → Node 22 runtime).
The build produces a plain Node server via Nitro (`NITRO_PRESET=node-server`),
listening on `0.0.0.0:8080` and honouring the `PORT` environment variable.

## Railway

Railway always builds with a `Dockerfile` when it finds one, so no build or
start command needs to be configured in the dashboard.

1. In Railway: **New project → Deploy from GitHub repo** and pick this repo.
2. In the service's **Variables** tab, set the server-side values:
   - `SUPABASE_URL` — your backend URL
   - `SUPABASE_PUBLISHABLE_KEY` — your publishable (public) key
3. Deploy. Railway injects `PORT` and the server binds to it automatically.

The two browser-facing values (`VITE_SUPABASE_URL`,
`VITE_SUPABASE_PUBLISHABLE_KEY`) are needed at **build time**. Pass them as
build args, or provide them in a committed `.env`:

```sh
docker build \
  --build-arg VITE_SUPABASE_URL=https://your-project.supabase.co \
  --build-arg VITE_SUPABASE_PUBLISHABLE_KEY=sb_publishable_xxx \
  .
```

## Local Docker run

```sh
docker build -t profile-hub .
docker run -p 8080:8080 --env-file .env profile-hub
```

## Variables by host capability

The public page (profile, links, categories, socials, the quiz video and
buttons) only needs the URL and publishable key. Click analytics and quiz
vote recording write through a privileged key that Lovable Cloud does not
hand out, so on another host those two stay inactive unless you also provide
`SUPABASE_SERVICE_ROLE_KEY`.
