-- Run this in the Supabase SQL editor (Project -> SQL Editor -> New query)

create table if not exists portfolios (
  id uuid primary key default gen_random_uuid(),
  name text,
  title text,
  email text,
  phone text,
  location text,
  summary text,
  linkedin text,
  github text,
  skills jsonb default '[]'::jsonb,
  projects jsonb default '[]'::jsonb,
  education jsonb default '[]'::jsonb,
  experience jsonb default '[]'::jsonb,
  certifications jsonb default '[]'::jsonb,
  achievements jsonb default '[]'::jsonb,
  created_at timestamptz not null default now()
);

-- Enable Row Level Security
alter table portfolios enable row level security;

-- Allow the anon key to insert new portfolios (used by /api/analyze)
create policy "Allow public insert" on portfolios
  for insert
  to anon
  with check (true);

-- Allow the anon key to read portfolios (used by /portfolio)
create policy "Allow public read" on portfolios
  for select
  to anon
  using (true);
