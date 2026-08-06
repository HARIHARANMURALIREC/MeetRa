-- Meetra v1.1–v1.3 feature schema

-- Profiles
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  avatar_url text,
  updated_at timestamptz default now()
);

-- Workspaces
create table if not exists public.workspaces (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text unique not null,
  owner_id uuid references auth.users(id) on delete set null,
  created_at timestamptz default now()
);

create table if not exists public.workspace_members (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid references public.workspaces(id) on delete cascade not null,
  user_id uuid references auth.users(id) on delete cascade not null,
  role text not null default 'member' check (role in ('owner', 'member')),
  created_at timestamptz default now(),
  unique (workspace_id, user_id)
);

-- Extend rooms
alter table public.rooms
  add column if not exists waiting_room_enabled boolean default true,
  add column if not exists passcode text,
  add column if not exists is_persistent boolean default false,
  add column if not exists scheduled_at timestamptz,
  add column if not exists ended_at timestamptz,
  add column if not exists workspace_id uuid references public.workspaces(id) on delete set null;

-- Room notes
create table if not exists public.room_notes (
  id uuid primary key default gen_random_uuid(),
  room_id uuid references public.rooms(id) on delete cascade not null,
  author_id uuid references auth.users(id) on delete set null,
  body text not null,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Room recordings
create table if not exists public.room_recordings (
  id uuid primary key default gen_random_uuid(),
  room_id uuid references public.rooms(id) on delete cascade not null,
  storage_path text,
  duration_sec integer,
  status text not null default 'processing' check (status in ('processing', 'ready', 'failed')),
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz default now()
);

-- Polls
create table if not exists public.polls (
  id uuid primary key default gen_random_uuid(),
  room_id uuid references public.rooms(id) on delete cascade not null,
  created_by uuid references auth.users(id) on delete set null,
  question text not null,
  options jsonb not null default '[]',
  closed_at timestamptz,
  created_at timestamptz default now()
);

create table if not exists public.poll_votes (
  id uuid primary key default gen_random_uuid(),
  poll_id uuid references public.polls(id) on delete cascade not null,
  user_id uuid references auth.users(id) on delete cascade not null,
  option_index integer not null,
  created_at timestamptz default now(),
  unique (poll_id, user_id)
);

-- Chat attachments
alter table public.chat_messages
  add column if not exists attachment_path text,
  add column if not exists attachment_name text;

-- Helper: attended room (past or present)
create or replace function private.has_attended_room(p_room_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.participants p
    where p.room_id = p_room_id
      and p.user_id = auth.uid()
  )
  or exists (
    select 1 from public.rooms r
    where r.id = p_room_id and r.host_id = auth.uid()
  );
$$;

create or replace function private.is_workspace_member(p_workspace_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.workspace_members wm
    where wm.workspace_id = p_workspace_id and wm.user_id = auth.uid()
  );
$$;

-- Auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, display_name)
  values (
    new.id,
    coalesce(
      new.raw_user_meta_data->>'full_name',
      new.raw_user_meta_data->>'name',
      split_part(new.email, '@', 1),
      'Guest'
    )
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- RLS
alter table public.profiles enable row level security;
alter table public.workspaces enable row level security;
alter table public.workspace_members enable row level security;
alter table public.room_notes enable row level security;
alter table public.room_recordings enable row level security;
alter table public.polls enable row level security;
alter table public.poll_votes enable row level security;

drop policy if exists "profiles_select_all" on public.profiles;
create policy "profiles_select_all"
  on public.profiles for select to authenticated using (true);

drop policy if exists "profiles_update_self" on public.profiles;
create policy "profiles_update_self"
  on public.profiles for update to authenticated
  using (id = auth.uid()) with check (id = auth.uid());

drop policy if exists "profiles_insert_self" on public.profiles;
create policy "profiles_insert_self"
  on public.profiles for insert to authenticated
  with check (id = auth.uid());

drop policy if exists "workspaces_select_member" on public.workspaces;
create policy "workspaces_select_member"
  on public.workspaces for select to authenticated
  using (
    owner_id = auth.uid()
    or private.is_workspace_member(id)
  );

drop policy if exists "workspaces_insert_authenticated" on public.workspaces;
create policy "workspaces_insert_authenticated"
  on public.workspaces for insert to authenticated
  with check (owner_id = auth.uid());

drop policy if exists "workspaces_update_owner" on public.workspaces;
create policy "workspaces_update_owner"
  on public.workspaces for update to authenticated
  using (owner_id = auth.uid()) with check (owner_id = auth.uid());

drop policy if exists "workspace_members_select" on public.workspace_members;
create policy "workspace_members_select"
  on public.workspace_members for select to authenticated
  using (
    user_id = auth.uid()
    or exists (select 1 from public.workspaces w where w.id = workspace_id and w.owner_id = auth.uid())
    or private.is_workspace_member(workspace_id)
  );

drop policy if exists "workspace_members_insert_owner" on public.workspace_members;
create policy "workspace_members_insert_owner"
  on public.workspace_members for insert to authenticated
  with check (
    exists (select 1 from public.workspaces w where w.id = workspace_id and w.owner_id = auth.uid())
    or (user_id = auth.uid() and role = 'owner')
  );

drop policy if exists "room_notes_select_attended" on public.room_notes;
create policy "room_notes_select_attended"
  on public.room_notes for select to authenticated
  using (private.has_attended_room(room_id));

drop policy if exists "room_notes_insert_attended" on public.room_notes;
create policy "room_notes_insert_attended"
  on public.room_notes for insert to authenticated
  with check (author_id = auth.uid() and private.has_attended_room(room_id));

drop policy if exists "room_notes_update_author" on public.room_notes;
create policy "room_notes_update_author"
  on public.room_notes for update to authenticated
  using (author_id = auth.uid()) with check (author_id = auth.uid());

drop policy if exists "room_notes_delete_author" on public.room_notes;
create policy "room_notes_delete_author"
  on public.room_notes for delete to authenticated
  using (author_id = auth.uid());

drop policy if exists "room_recordings_select_attended" on public.room_recordings;
create policy "room_recordings_select_attended"
  on public.room_recordings for select to authenticated
  using (private.has_attended_room(room_id));

drop policy if exists "room_recordings_insert_host" on public.room_recordings;
create policy "room_recordings_insert_host"
  on public.room_recordings for insert to authenticated
  with check (
    created_by = auth.uid()
    and exists (select 1 from public.rooms r where r.id = room_id and r.host_id = auth.uid())
  );

drop policy if exists "polls_select_room" on public.polls;
create policy "polls_select_room"
  on public.polls for select to authenticated
  using (private.can_access_room(room_id) or private.has_attended_room(room_id));

drop policy if exists "polls_insert_host" on public.polls;
create policy "polls_insert_host"
  on public.polls for insert to authenticated
  with check (
    created_by = auth.uid()
    and exists (select 1 from public.rooms r where r.id = room_id and r.host_id = auth.uid())
  );

drop policy if exists "polls_update_host" on public.polls;
create policy "polls_update_host"
  on public.polls for update to authenticated
  using (
    exists (select 1 from public.rooms r where r.id = room_id and r.host_id = auth.uid())
  );

drop policy if exists "poll_votes_select_room" on public.poll_votes;
create policy "poll_votes_select_room"
  on public.poll_votes for select to authenticated
  using (
    exists (select 1 from public.polls p where p.id = poll_id and (private.can_access_room(p.room_id) or private.has_attended_room(p.room_id)))
  );

drop policy if exists "poll_votes_insert_self" on public.poll_votes;
create policy "poll_votes_insert_self"
  on public.poll_votes for insert to authenticated
  with check (
    user_id = auth.uid()
    and exists (
      select 1 from public.polls p
      where p.id = poll_id and private.can_access_room(p.room_id) and p.closed_at is null
    )
  );

-- Realtime
do $$ begin
  alter publication supabase_realtime add table public.room_notes;
exception when duplicate_object then null;
end $$;

do $$ begin
  alter publication supabase_realtime add table public.polls;
exception when duplicate_object then null;
end $$;

do $$ begin
  alter publication supabase_realtime add table public.poll_votes;
exception when duplicate_object then null;
end $$;

do $$ begin
  alter publication supabase_realtime add table public.room_recordings;
exception when duplicate_object then null;
end $$;

-- Grants
grant all on public.profiles to authenticated;
grant all on public.workspaces to authenticated;
grant all on public.workspace_members to authenticated;
grant all on public.room_notes to authenticated;
grant all on public.room_recordings to authenticated;
grant all on public.polls to authenticated;
grant all on public.poll_votes to authenticated;
grant execute on function private.has_attended_room(uuid) to authenticated;
grant execute on function private.is_workspace_member(uuid) to authenticated;

-- Storage buckets (idempotent via insert)
insert into storage.buckets (id, name, public)
values ('avatars', 'avatars', true)
on conflict (id) do nothing;

insert into storage.buckets (id, name, public)
values ('chat-files', 'chat-files', false)
on conflict (id) do nothing;

insert into storage.buckets (id, name, public)
values ('recordings', 'recordings', false)
on conflict (id) do nothing;

drop policy if exists "avatars_public_read" on storage.objects;
create policy "avatars_public_read"
  on storage.objects for select to public
  using (bucket_id = 'avatars');

drop policy if exists "avatars_owner_write" on storage.objects;
create policy "avatars_owner_write"
  on storage.objects for insert to authenticated
  with check (bucket_id = 'avatars' and auth.uid()::text = (storage.foldername(name))[1]);

drop policy if exists "avatars_owner_update" on storage.objects;
create policy "avatars_owner_update"
  on storage.objects for update to authenticated
  using (bucket_id = 'avatars' and auth.uid()::text = (storage.foldername(name))[1]);

drop policy if exists "avatars_owner_delete" on storage.objects;
create policy "avatars_owner_delete"
  on storage.objects for delete to authenticated
  using (bucket_id = 'avatars' and auth.uid()::text = (storage.foldername(name))[1]);

drop policy if exists "chat_files_insert" on storage.objects;
create policy "chat_files_insert"
  on storage.objects for insert to authenticated
  with check (bucket_id = 'chat-files');

drop policy if exists "chat_files_select" on storage.objects;
create policy "chat_files_select"
  on storage.objects for select to authenticated
  using (bucket_id = 'chat-files');

drop policy if exists "recordings_select" on storage.objects;
create policy "recordings_select"
  on storage.objects for select to authenticated
  using (bucket_id = 'recordings');
