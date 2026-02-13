-- Create registrations table if it doesn't exist
create table if not exists public.registrations (
  id uuid default gen_random_uuid() primary key,
  first_name text not null,
  last_name text not null,
  age integer,
  gender text check (gender in ('M', 'F')),
  contact text,
  place text,
  type text check (type in ('facilitator', 'participant')),
  participants_count integer,
  books_distributed integer,
  facilitator_uuid uuid,
  source text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  
  -- Foreign key constraint for facilitator_uuid (optional, if we enforce strict integrity)
  -- constraint fk_facilitator foreign key (facilitator_uuid) references public.registrations(id)
  -- For now, loose coupling as facilitators might be uploaded later or via different streams
  
  -- Add a check to ensure participants have a facilitator if in a group? 
  -- Logic handled in frontend, DB can remain flexible.
   unique(id)
);

-- Enable Row Level Security
alter table public.registrations enable row level security;

-- Create policy to allow anonymous inserts (since we are using offline app without strict auth yet)
create policy "Enable insert for all users" 
on public.registrations 
for insert 
with check (true);

-- Create policy to allow reading own data (or public for dashboard for now if auth is loose)
-- For dashboard we might need a service role or authenticated user. 
-- For now, let's allow public read for simplicity in development, OR restrict if requested.
-- "Enable read access for all users"
create policy "Enable read access for all users" 
on public.registrations 
for select 
using (true);

-- If you have a separate participants table from earlier analysis (Dexie has 'participants'), 
-- we might want to mirror it, but 'registrations' seems to handle both types now.
