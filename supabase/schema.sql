create table if not exists public.buildathon_registrations (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  first_name text not null,
  email text not null,
  business_name text not null,
  source text not null default 'xc-ai-buildathon'
);

create unique index if not exists buildathon_registrations_email_unique
  on public.buildathon_registrations (lower(email));

alter table public.buildathon_registrations enable row level security;

-- No public insert policy is required.
-- The Edge Function uses the service-role key server-side.
