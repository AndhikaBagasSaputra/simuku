-- Simuku: tabel untuk sinkron data antar perangkat.
-- Jalankan sekali di Supabase: SQL Editor -> New query -> tempel -> Run.
-- Aman dijalankan ulang.

create table if not exists public.items (
  user_id    uuid        not null default auth.uid() references auth.users (id) on delete cascade,
  collection text        not null, -- transactions | debts | splitBills | goals | bills
  id         text        not null,
  data       jsonb       not null default '{}'::jsonb,
  deleted    boolean     not null default false, -- data yang dihapus hanya ditandai, tidak dibuang
  updated_at timestamptz not null default now(),
  primary key (user_id, collection, id)
);

create index if not exists items_user_updated_idx on public.items (user_id, updated_at);

-- Waktu perubahan selalu memakai jam server, bukan jam perangkat
create or replace function public.items_touch()
returns trigger
language plpgsql
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists items_touch on public.items;
create trigger items_touch
  before insert or update on public.items
  for each row execute function public.items_touch();

-- Tiap akun hanya bisa membaca dan mengubah datanya sendiri
alter table public.items enable row level security;

drop policy if exists "items milik sendiri" on public.items;
create policy "items milik sendiri" on public.items
  for all
  to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));
