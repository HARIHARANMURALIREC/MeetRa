-- Fix participants RLS: allow users to read/insert their own rows when joining.

drop policy if exists "participants_select_self" on public.participants;
create policy "participants_select_self"
  on public.participants for select to authenticated
  using (user_id = auth.uid());

drop policy if exists "participants_insert_self" on public.participants;
create policy "participants_insert_self"
  on public.participants for insert to authenticated
  with check (
    user_id = auth.uid()
    and exists (
      select 1 from public.rooms r
      where r.id = room_id and r.is_active = true
    )
  );

-- Host creating a meeting inserts themselves before is_room_member would apply.
drop policy if exists "participants_insert_host" on public.participants;
create policy "participants_insert_host"
  on public.participants for insert to authenticated
  with check (
    user_id = auth.uid()
    and exists (
      select 1 from public.rooms r
      where r.id = room_id and r.host_id = auth.uid()
    )
  );
