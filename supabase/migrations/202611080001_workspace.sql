-- Apply once to a new Supabase project with SQL Editor or supabase db push.
begin;
create table public.shops (
  owner uuid primary key references auth.users(id) on delete cascade,
  name text not null check (length(btrim(name)) between 1 and 80),
  reward text not null check (length(btrim(reward)) between 1 and 120),
  goal integer not null check (goal between 2 and 30)
);
create table public.members (
  id uuid primary key default gen_random_uuid(),
  owner uuid not null references public.shops(owner) on delete cascade,
  name text not null check (length(btrim(name)) between 1 and 80),
  phone text not null check (length(btrim(phone)) between 1 and 30),
  stamps integer not null default 0 check (stamps between 0 and 30),
  visits integer not null default 0 check (visits >= 0),
  last timestamptz not null default now(),
  unique (owner, phone), unique (owner, id)
);
create table public.events (
  id uuid primary key default gen_random_uuid(),
  owner uuid not null references public.shops(owner) on delete cascade,
  member uuid not null,
  kind text not null check (kind in ('stamp', 'redeem')),
  at timestamptz not null default now(),
  foreign key (owner, member) references public.members(owner, id) on delete cascade
);
create index members_owner_last_idx on public.members(owner, last desc);
create index events_owner_at_idx on public.events(owner, at desc);
create table public.workspace_requests (
  owner uuid not null references auth.users(id) on delete cascade,
  request_id uuid not null,
  payload jsonb not null,
  created_at timestamptz not null default now(),
  primary key (owner, request_id)
);
alter table public.shops enable row level security;
alter table public.members enable row level security;
alter table public.events enable row level security;
alter table public.workspace_requests enable row level security;
create policy shops_owner_read on public.shops for select to authenticated using ((select auth.uid()) = owner);
create policy members_owner_read on public.members for select to authenticated using ((select auth.uid()) = owner);
create policy events_owner_read on public.events for select to authenticated using ((select auth.uid()) = owner);
revoke all on public.shops, public.members, public.events, public.workspace_requests from anon, authenticated;
grant select on public.shops, public.members, public.events to authenticated;

create function public.mutate_workspace(payload jsonb, request_id uuid)
returns void language plpgsql security definer set search_path = '' as $$
declare
  actor uuid := auth.uid();
  operation text := payload->>'action';
  program public.shops%rowtype;
  card public.members%rowtype;
  prior jsonb;
  new_goal integer;
begin
  if actor is null then raise exception 'Sign in required.'; end if;
  if request_id is null then raise exception 'A request ID is required.'; end if;
  -- This also serializes first creation, before a shop row exists.
  perform pg_advisory_xact_lock(hashtextextended(actor::text, 0));
  select r.payload into prior from public.workspace_requests r
    where r.owner = actor and r.request_id = mutate_workspace.request_id;
  if found then
    if prior <> payload then raise exception 'This request ID was already used for a different change.'; end if;
    return;
  end if;
  select * into program from public.shops where owner = actor for update;
  if operation = 'settings' then
    if jsonb_typeof(payload->'goal') <> 'number' or (payload->>'goal') !~ '^[0-9]+$'
      then raise exception 'Choose a whole stamp goal between 2 and 30.'; end if;
    new_goal := (payload->>'goal')::integer;
    if new_goal is null or new_goal not between 2 and 30
      or coalesce(length(btrim(payload->>'name')), 0) not between 1 and 80
      or coalesce(length(btrim(payload->>'reward')), 0) not between 1 and 120
      then raise exception 'Enter a business name, reward, and goal of 2 to 30.'; end if;
    if program.owner is not null and program.goal <> new_goal
      and exists(select 1 from public.members where owner = actor)
      then raise exception 'The stamp goal is locked after enrollment to protect earned rewards.'; end if;
    insert into public.shops(owner, name, reward, goal)
      values(actor, btrim(payload->>'name'), btrim(payload->>'reward'), new_goal)
      on conflict(owner) do update set name = excluded.name, reward = excluded.reward, goal = excluded.goal;
  elsif operation = 'enroll' then
    if program.owner is null then raise exception 'Create your program first.'; end if;
    if coalesce(length(btrim(payload->>'name')), 0) not between 1 and 80
      or coalesce(length(btrim(payload->>'phone')), 0) not between 1 and 30
      then raise exception 'Name and phone are required.'; end if;
    if exists(select 1 from public.members where owner = actor and phone = btrim(payload->>'phone'))
      then raise exception 'This phone is already enrolled. Search for their existing card.'; end if;
    insert into public.members(owner, name, phone) values(actor, btrim(payload->>'name'), btrim(payload->>'phone'));
  elsif operation in ('stamp', 'redeem') then
    if program.owner is null then raise exception 'Create your program first.'; end if;
    select * into card from public.members where owner = actor and id = (payload->>'id')::uuid for update;
    if not found then raise exception 'Card not found in this business.'; end if;
    if operation = 'stamp' then
      if card.stamps >= program.goal then raise exception 'Card is full. Redeem the reward first.'; end if;
      update public.members set stamps = stamps + 1, visits = visits + 1, last = now() where id = card.id;
    else
      if card.stamps < program.goal then raise exception 'This card is not ready to redeem.'; end if;
      update public.members set stamps = stamps - program.goal, last = now() where id = card.id;
    end if;
    insert into public.events(owner, member, kind) values(actor, card.id, operation);
  else
    raise exception 'Unknown action.';
  end if;
  insert into public.workspace_requests(owner, request_id, payload) values(actor, request_id, payload);
end;
$$;
revoke all on function public.mutate_workspace(jsonb, uuid) from public, anon;
grant execute on function public.mutate_workspace(jsonb, uuid) to authenticated;
commit;
