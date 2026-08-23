create table if not exists public.buildathon_registrations (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  first_name text not null,
  email text not null,
  business_name text not null,
  source text not null default 'xc-ai-buildathon',
  confirmation_email_status text not null default 'pending',
  confirmation_email_sent_at timestamptz,
  postmark_message_id text,
  constraint buildathon_confirmation_email_status_check
    check (confirmation_email_status in ('pending','sent','failed'))
);

create unique index if not exists buildathon_registrations_email_unique
  on public.buildathon_registrations (email);

alter table public.buildathon_registrations enable row level security;

-- No public insert policy is required.
-- The public registration Edge Function validates input and writes with the service-role key.
