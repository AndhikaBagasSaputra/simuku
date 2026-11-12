-- Simuku: langganan notifikasi (pengingat tagihan).
-- Jalankan sekali di Supabase: SQL Editor -> New query -> tempel -> Run.
-- Aman dijalankan ulang.

create table if not exists public.push_subscriptions (
  endpoint   text        primary key, -- alamat unik dari browser/HP
  user_id    uuid        not null default auth.uid() references auth.users (id) on delete cascade,
  p256dh     text        not null,
  auth       text        not null,
  user_agent text,
  created_at timestamptz not null default now()
);

create index if not exists push_subscriptions_user_idx on public.push_subscriptions (user_id);

-- Tiap akun hanya bisa melihat dan mengubah langganannya sendiri.
-- Server pengirim notifikasi memakai kunci service role, jadi tidak terikat aturan ini.
alter table public.push_subscriptions enable row level security;

drop policy if exists "langganan milik sendiri" on public.push_subscriptions;
create policy "langganan milik sendiri" on public.push_subscriptions
  for all
  to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));
