create table if not exists public.stock_records (
  id text primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  record jsonb not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.stock_records enable row level security;

drop policy if exists "Users can read own stock records" on public.stock_records;
drop policy if exists "Users can insert own stock records" on public.stock_records;
drop policy if exists "Users can update own stock records" on public.stock_records;
drop policy if exists "Users can delete own stock records" on public.stock_records;

create policy "Users can read own stock records"
  on public.stock_records
  for select
  using (auth.uid() = user_id);

create policy "Users can insert own stock records"
  on public.stock_records
  for insert
  with check (auth.uid() = user_id);

create policy "Users can update own stock records"
  on public.stock_records
  for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Users can delete own stock records"
  on public.stock_records
  for delete
  using (auth.uid() = user_id);

create index if not exists stock_records_user_updated_idx
  on public.stock_records (user_id, updated_at desc);
