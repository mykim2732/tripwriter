-- Sprint 13 publishing fields
alter table posts add column if not exists polished_content text;
alter table posts add column if not exists published_html text;
alter table posts add column if not exists editor_options jsonb;
alter table posts add column if not exists html_updated_at timestamptz;
alter table posts add column if not exists attachment_urls text[];

-- Sprint 9+ storage setup
insert into storage.buckets (id, name, public)
values ('trip-photos', 'trip-photos', true)
on conflict (id) do update set public = true;

insert into storage.buckets (id, name, public)
values ('blog-attachments', 'blog-attachments', true)
on conflict (id) do update set public = true;

-- MVP uses guest writes from the browser anon key.
-- Run these policies in Supabase SQL Editor if RLS blocks saving or image upload.
alter table posts enable row level security;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'posts'
      and policyname = 'tripwriter_guest_select_posts'
  ) then
    create policy tripwriter_guest_select_posts
    on public.posts
    for select
    to anon, authenticated
    using (user_id = 'guest');
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'posts'
      and policyname = 'tripwriter_guest_insert_posts'
  ) then
    create policy tripwriter_guest_insert_posts
    on public.posts
    for insert
    to anon, authenticated
    with check (user_id = 'guest');
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'posts'
      and policyname = 'tripwriter_guest_update_posts'
  ) then
    create policy tripwriter_guest_update_posts
    on public.posts
    for update
    to anon, authenticated
    using (user_id = 'guest')
    with check (user_id = 'guest');
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'posts'
      and policyname = 'tripwriter_guest_delete_posts'
  ) then
    create policy tripwriter_guest_delete_posts
    on public.posts
    for delete
    to anon, authenticated
    using (user_id = 'guest');
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'storage'
      and tablename = 'objects'
      and policyname = 'tripwriter_guest_select_blog_attachments'
  ) then
    create policy tripwriter_guest_select_blog_attachments
    on storage.objects
    for select
    to anon, authenticated
    using (bucket_id = 'blog-attachments');
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'storage'
      and tablename = 'objects'
      and policyname = 'tripwriter_guest_insert_blog_attachments'
  ) then
    create policy tripwriter_guest_insert_blog_attachments
    on storage.objects
    for insert
    to anon, authenticated
    with check (
      bucket_id = 'blog-attachments'
      and (storage.foldername(name))[1] = 'guest'
    );
  end if;
end $$;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'storage'
      and tablename = 'objects'
      and policyname = 'tripwriter_guest_select_trip_photos'
  ) then
    create policy tripwriter_guest_select_trip_photos
    on storage.objects
    for select
    to anon, authenticated
    using (bucket_id = 'trip-photos');
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'storage'
      and tablename = 'objects'
      and policyname = 'tripwriter_guest_insert_trip_photos'
  ) then
    create policy tripwriter_guest_insert_trip_photos
    on storage.objects
    for insert
    to anon, authenticated
    with check (
      bucket_id = 'trip-photos'
      and (storage.foldername(name))[1] = 'guest'
    );
  end if;
end $$;

-- Sprint 43 profiles and credits setup
-- Run this block in Supabase SQL Editor before enabling real credit deduction.
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  display_name text,
  plan text default 'free' not null,
  credits integer default 5 not null,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

create table if not exists public.credit_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  action text not null,
  amount integer not null,
  balance_after integer not null,
  memo text,
  created_at timestamptz default now() not null
);

alter table public.profiles enable row level security;
alter table public.credit_logs enable row level security;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

do $$
begin
  if not exists (
    select 1 from pg_trigger
    where tgname = 'profiles_set_updated_at'
  ) then
    create trigger profiles_set_updated_at
    before update on public.profiles
    for each row execute function public.set_updated_at();
  end if;
end $$;

create or replace function public.handle_new_user_profile()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, display_name, plan, credits)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data ->> 'name', new.raw_user_meta_data ->> 'full_name'),
    'free',
    5
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

do $$
begin
  if not exists (
    select 1 from pg_trigger
    where tgname = 'on_auth_user_created_tripwriter_profile'
  ) then
    create trigger on_auth_user_created_tripwriter_profile
    after insert on auth.users
    for each row execute function public.handle_new_user_profile();
  end if;
end $$;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'profiles'
      and policyname = 'tripwriter_profiles_select_own'
  ) then
    create policy tripwriter_profiles_select_own
    on public.profiles
    for select
    to authenticated
    using (auth.uid() = id);
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'profiles'
      and policyname = 'tripwriter_profiles_insert_own'
  ) then
    create policy tripwriter_profiles_insert_own
    on public.profiles
    for insert
    to authenticated
    with check (auth.uid() = id);
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'profiles'
      and policyname = 'tripwriter_profiles_update_own'
  ) then
    create policy tripwriter_profiles_update_own
    on public.profiles
    for update
    to authenticated
    using (auth.uid() = id)
    with check (auth.uid() = id);
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'credit_logs'
      and policyname = 'tripwriter_credit_logs_select_own'
  ) then
    create policy tripwriter_credit_logs_select_own
    on public.credit_logs
    for select
    to authenticated
    using (auth.uid() = user_id);
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'credit_logs'
      and policyname = 'tripwriter_credit_logs_insert_own'
  ) then
    create policy tripwriter_credit_logs_insert_own
    on public.credit_logs
    for insert
    to authenticated
    with check (auth.uid() = user_id);
  end if;
end $$;

-- Authenticated users can manage posts where posts.user_id equals auth.uid()::text.
do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'posts'
      and policyname = 'tripwriter_auth_select_own_posts'
  ) then
    create policy tripwriter_auth_select_own_posts
    on public.posts
    for select
    to authenticated
    using (user_id = auth.uid()::text);
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'posts'
      and policyname = 'tripwriter_auth_insert_own_posts'
  ) then
    create policy tripwriter_auth_insert_own_posts
    on public.posts
    for insert
    to authenticated
    with check (user_id = auth.uid()::text);
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'posts'
      and policyname = 'tripwriter_auth_update_own_posts'
  ) then
    create policy tripwriter_auth_update_own_posts
    on public.posts
    for update
    to authenticated
    using (user_id = auth.uid()::text)
    with check (user_id = auth.uid()::text);
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'posts'
      and policyname = 'tripwriter_auth_delete_own_posts'
  ) then
    create policy tripwriter_auth_delete_own_posts
    on public.posts
    for delete
    to authenticated
    using (user_id = auth.uid()::text);
  end if;
end $$;

-- Sprint 63~67 profile, avatar, and admin foundation
-- Run this block in Supabase SQL Editor before enabling /profile and /admin features.
alter table public.profiles add column if not exists avatar_url text;
alter table public.profiles add column if not exists bio text;
alter table public.profiles add column if not exists provider text;
alter table public.profiles add column if not exists content_fields text[] default '{}';
alter table public.profiles add column if not exists preferred_tone text;
alter table public.profiles add column if not exists role text default 'user' not null;
alter table public.profiles add column if not exists onboarding_completed boolean default false not null;
alter table public.profiles add column if not exists profile_completed_at timestamptz;

insert into storage.buckets (id, name, public)
values ('profile-images', 'profile-images', true)
on conflict (id) do update set public = true;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'storage'
      and tablename = 'objects'
      and policyname = 'posty_profile_images_select'
  ) then
    create policy posty_profile_images_select
    on storage.objects
    for select
    to anon, authenticated
    using (bucket_id = 'profile-images');
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'storage'
      and tablename = 'objects'
      and policyname = 'posty_profile_images_insert_own'
  ) then
    create policy posty_profile_images_insert_own
    on storage.objects
    for insert
    to authenticated
    with check (
      bucket_id = 'profile-images'
      and (storage.foldername(name))[1] = auth.uid()::text
    );
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'storage'
      and tablename = 'objects'
      and policyname = 'posty_profile_images_update_own'
  ) then
    create policy posty_profile_images_update_own
    on storage.objects
    for update
    to authenticated
    using (
      bucket_id = 'profile-images'
      and (storage.foldername(name))[1] = auth.uid()::text
    )
    with check (
      bucket_id = 'profile-images'
      and (storage.foldername(name))[1] = auth.uid()::text
    );
  end if;
end $$;
