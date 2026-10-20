
create type public.app_role as enum ('admin', 'user');

create table public.user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  role app_role not null,
  unique (user_id, role)
);
grant select on public.user_roles to authenticated;
grant all on public.user_roles to service_role;
alter table public.user_roles enable row level security;

create or replace function public.has_role(_user_id uuid, _role app_role)
returns boolean language sql stable security definer set search_path = public
as $$ select exists (select 1 from public.user_roles where user_id = _user_id and role = _role) $$;

create policy "Users read own roles" on public.user_roles for select to authenticated using (user_id = auth.uid());

create or replace function public.admin_exists()
returns boolean language sql stable security definer set search_path = public
as $$ select exists (select 1 from public.user_roles where role = 'admin') $$;
grant execute on function public.admin_exists() to anon, authenticated;

create or replace function public.handle_first_admin()
returns trigger language plpgsql security definer set search_path = public
as $$
begin
  if not exists (select 1 from public.user_roles where role = 'admin') then
    insert into public.user_roles (user_id, role) values (new.id, 'admin');
  end if;
  return new;
end; $$;
create trigger on_auth_user_created_first_admin after insert on auth.users
for each row execute function public.handle_first_admin();

-- profile (single row)
create table public.profile (
  id int primary key default 1 check (id = 1),
  name text not null default '',
  headline text not null default '',
  bio text not null default '',
  location text,
  avatar_url text,
  accent_color text not null default '#E7AC3B',
  theme text not null default 'light' check (theme in ('light','dark')),
  background_style text not null default 'plain' check (background_style in ('plain','texture')),
  show_categories boolean not null default true,
  seo_title text,
  seo_description text,
  updated_at timestamptz not null default now()
);
grant select on public.profile to anon, authenticated;
grant update on public.profile to authenticated;
grant all on public.profile to service_role;
alter table public.profile enable row level security;
create policy "Public read profile" on public.profile for select to anon, authenticated using (true);
create policy "Admins update profile" on public.profile for update to authenticated
  using (public.has_role(auth.uid(), 'admin')) with check (public.has_role(auth.uid(), 'admin'));

create table public.categories (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  position int not null default 0,
  created_at timestamptz not null default now()
);
grant select on public.categories to anon, authenticated;
grant insert, update, delete on public.categories to authenticated;
grant all on public.categories to service_role;
alter table public.categories enable row level security;
create policy "Public read categories" on public.categories for select to anon, authenticated using (true);
create policy "Admins write categories" on public.categories for all to authenticated
  using (public.has_role(auth.uid(), 'admin')) with check (public.has_role(auth.uid(), 'admin'));

create table public.links (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  url text not null,
  description text,
  icon text,
  thumbnail_url text,
  category_id uuid references public.categories(id) on delete set null,
  position int not null default 0,
  is_visible boolean not null default true,
  open_new_tab boolean not null default true,
  is_featured boolean not null default false,
  created_at timestamptz not null default now()
);
grant select on public.links to anon, authenticated;
grant insert, update, delete on public.links to authenticated;
grant all on public.links to service_role;
alter table public.links enable row level security;
create policy "Public read visible links" on public.links for select to anon, authenticated
  using (is_visible or public.has_role(auth.uid(), 'admin'));
create policy "Admins write links" on public.links for all to authenticated
  using (public.has_role(auth.uid(), 'admin')) with check (public.has_role(auth.uid(), 'admin'));

create table public.social_links (
  id uuid primary key default gen_random_uuid(),
  platform text not null,
  url text not null,
  position int not null default 0,
  created_at timestamptz not null default now()
);
grant select on public.social_links to anon, authenticated;
grant insert, update, delete on public.social_links to authenticated;
grant all on public.social_links to service_role;
alter table public.social_links enable row level security;
create policy "Public read socials" on public.social_links for select to anon, authenticated using (true);
create policy "Admins write socials" on public.social_links for all to authenticated
  using (public.has_role(auth.uid(), 'admin')) with check (public.has_role(auth.uid(), 'admin'));

create table public.analytics_events (
  id uuid primary key default gen_random_uuid(),
  event_type text not null check (event_type in ('view','click')),
  link_id uuid references public.links(id) on delete set null,
  referrer text,
  created_at timestamptz not null default now()
);
create index analytics_events_created_idx on public.analytics_events (created_at);
grant select on public.analytics_events to authenticated;
grant all on public.analytics_events to service_role;
alter table public.analytics_events enable row level security;
create policy "Admins read analytics" on public.analytics_events for select to authenticated
  using (public.has_role(auth.uid(), 'admin'));

create table public.rate_limits (
  key text not null,
  window_start timestamptz not null,
  count int not null default 0,
  primary key (key, window_start)
);
grant all on public.rate_limits to service_role;
alter table public.rate_limits enable row level security;

create or replace function public.hit_rate_limit(_key text, _window_start timestamptz)
returns int language sql security definer set search_path = public
as $$
  insert into public.rate_limits (key, window_start, count) values (_key, _window_start, 1)
  on conflict (key, window_start) do update set count = rate_limits.count + 1
  returning count;
$$;
revoke execute on function public.hit_rate_limit(text, timestamptz) from public, anon, authenticated;
grant execute on function public.hit_rate_limit(text, timestamptz) to service_role;

-- storage policies
create policy "Public read avatars" on storage.objects for select using (bucket_id = 'avatars');
create policy "Admins upload avatars" on storage.objects for insert to authenticated
  with check (bucket_id = 'avatars' and public.has_role(auth.uid(), 'admin'));
create policy "Admins update avatars" on storage.objects for update to authenticated
  using (bucket_id = 'avatars' and public.has_role(auth.uid(), 'admin'));
create policy "Admins delete avatars" on storage.objects for delete to authenticated
  using (bucket_id = 'avatars' and public.has_role(auth.uid(), 'admin'));

-- seed
insert into public.profile (id, name, headline, bio, location, seo_title, seo_description)
values (1, 'Alex Morgan', 'Product Designer & Builder',
 'I design calm, useful software and write about craft, tools and the small details that make products feel good.',
 'London, UK', 'Alex Morgan — Product Designer & Builder',
 'Projects, writing and ways to get in touch with Alex Morgan, product designer and builder.');

insert into public.categories (id, name, position) values
 ('11111111-1111-1111-1111-111111111111', 'Portfolio & Projects', 0),
 ('22222222-2222-2222-2222-222222222222', 'Professional Profiles', 1),
 ('33333333-3333-3333-3333-333333333333', 'Contact', 2),
 ('44444444-4444-4444-4444-444444444444', 'Other Links', 3);

insert into public.links (title, url, description, icon, category_id, position, is_featured) values
 ('Selected work', 'https://example.com/portfolio', 'Case studies from the last five years', 'briefcase', '11111111-1111-1111-1111-111111111111', 0, true),
 ('Side project: Field Notes', 'https://example.com/field-notes', 'A tiny journaling app for makers', 'sparkles', '11111111-1111-1111-1111-111111111111', 1, false),
 ('Design newsletter', 'https://example.com/newsletter', 'One thoughtful email a month', 'newspaper', '11111111-1111-1111-1111-111111111111', 2, false),
 ('LinkedIn', 'https://www.linkedin.com/', 'Experience and recommendations', 'linkedin', '22222222-2222-2222-2222-222222222222', 3, false),
 ('Read.cv', 'https://read.cv/', null, 'file-text', '22222222-2222-2222-2222-222222222222', 4, false),
 ('Book a 30-minute call', 'https://cal.com/', 'Open for freelance and advisory work', 'calendar', '33333333-3333-3333-3333-333333333333', 5, false),
 ('Email me', 'mailto:hello@example.com', null, 'mail', '33333333-3333-3333-3333-333333333333', 6, false),
 ('My reading list', 'https://example.com/books', 'Books that shaped how I work', 'book-open', '44444444-4444-4444-4444-444444444444', 7, false);

insert into public.social_links (platform, url, position) values
 ('instagram', 'https://instagram.com/', 0),
 ('linkedin', 'https://linkedin.com/', 1),
 ('x', 'https://x.com/', 2),
 ('github', 'https://github.com/', 3);
