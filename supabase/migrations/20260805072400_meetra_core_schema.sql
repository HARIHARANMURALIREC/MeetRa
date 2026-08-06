-- Meetra core schema

create table public.rooms (
  id uuid primary key default gen_random_uuid(),
  room_code text unique not null,
  host_id uuid references auth.users(id),
  title text,
  created_at timestamptz default now(),
  is_active boolean default true
);

create table public.participants (
  id uuid primary key default gen_random_uuid(),
  room_id uuid references public.rooms(id) on delete cascade,
  user_id uuid references auth.users(id),
  display_name text,
  joined_at timestamptz default now(),
  left_at timestamptz,
  approved boolean default false
);

create table public.chat_messages (
  id uuid primary key default gen_random_uuid(),
  room_id uuid references public.rooms(id) on delete cascade,
  user_id uuid references auth.users(id),
  display_name text,
  message text not null,
  created_at timestamptz default now()
);

create index idx_rooms_room_code on public.rooms(room_code);
create index idx_participants_room_user on public.participants(room_id, user_id);
create index idx_chat_messages_room_created on public.chat_messages(room_id, created_at);

-- Helpers live in an unexposed schema so they are unreachable via the Data API
-- while remaining usable inside RLS policies.
create schema if not exists private;

create or replace function private.is_room_member(p_room_id uuid)
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
      and p.left_at is null
  );
$$;

create or replace function private.can_access_room(p_room_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.rooms r
    where r.id = p_room_id and r.host_id = auth.uid()
  )
  or exists (
    select 1 from public.participants p
    where p.room_id = p_room_id
      and p.user_id = auth.uid()
      and p.left_at is null
      and p.approved = true
  );
$$;

alter table public.rooms enable row level security;
alter table public.participants enable row level security;
alter table public.chat_messages enable row level security;

create policy "rooms_insert_authenticated"
  on public.rooms for insert to authenticated
  with check (host_id = auth.uid());

create policy "rooms_select_member_or_host"
  on public.rooms for select to authenticated
  using (
    host_id = auth.uid()
    or private.is_room_member(id)
    or is_active = true
  );

create policy "rooms_update_host"
  on public.rooms for update to authenticated
  using (host_id = auth.uid())
  with check (host_id = auth.uid());

create policy "participants_insert_self"
  on public.participants for insert to authenticated
  with check (
    user_id = auth.uid()
    and exists (
      select 1 from public.rooms r
      where r.id = room_id and r.is_active = true
    )
  );

create policy "participants_insert_host"
  on public.participants for insert to authenticated
  with check (
    user_id = auth.uid()
    and exists (
      select 1 from public.rooms r
      where r.id = room_id and r.host_id = auth.uid()
    )
  );

create policy "participants_select_self"
  on public.participants for select to authenticated
  using (user_id = auth.uid());

create policy "participants_select_room_members"
  on public.participants for select to authenticated
  using (
    private.is_room_member(room_id)
    or exists (select 1 from public.rooms r where r.id = room_id and r.host_id = auth.uid())
  );

create policy "participants_update_self_or_host"
  on public.participants for update to authenticated
  using (
    user_id = auth.uid()
    or exists (select 1 from public.rooms r where r.id = room_id and r.host_id = auth.uid())
  )
  with check (
    user_id = auth.uid()
    or exists (select 1 from public.rooms r where r.id = room_id and r.host_id = auth.uid())
  );

create policy "chat_select_approved"
  on public.chat_messages for select to authenticated
  using (private.can_access_room(room_id));

create policy "chat_insert_approved"
  on public.chat_messages for insert to authenticated
  with check (user_id = auth.uid() and private.can_access_room(room_id));

alter publication supabase_realtime add table public.participants;
alter publication supabase_realtime add table public.chat_messages;

grant usage on schema public to authenticated;
grant all on public.rooms to authenticated;
grant all on public.participants to authenticated;
grant all on public.chat_messages to authenticated;

grant usage on schema private to authenticated;
grant execute on function private.is_room_member(uuid) to authenticated;
grant execute on function private.can_access_room(uuid) to authenticated;
