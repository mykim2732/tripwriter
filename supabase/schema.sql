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
