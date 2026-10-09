-- Optional persistent settings table for Finrise admin. Only existing admins may read/write through backend; no direct browser grants are added.
create table if not exists public.platform_settings (
  setting_key text primary key,
  setting_value jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now(),
  updated_by uuid references auth.users(id)
);
alter table public.platform_settings enable row level security;
revoke all on public.platform_settings from anon, authenticated;
