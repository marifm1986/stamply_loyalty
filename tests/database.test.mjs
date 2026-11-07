import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { randomUUID } from 'node:crypto';
import { PGlite } from '@electric-sql/pglite';

let db;
const alice = '11111111-1111-4111-8111-111111111111';
const bob = '22222222-2222-4222-8222-222222222222';
before(async () => {
  db = new PGlite();
  await db.exec(`create role anon; create role authenticated;
    create schema auth; create table auth.users(id uuid primary key);
    create function auth.uid() returns uuid language sql stable as
    $$ select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid $$;
    grant usage on schema auth, public to authenticated, anon;
    insert into auth.users values ('${alice}'), ('${bob}');`);
  await db.exec(await readFile(new URL('../supabase/migrations/202611080001_workspace.sql', import.meta.url), 'utf8'));
});
after(async () => { await db?.close(); });

async function asUser(owner) {
  await db.exec('reset role');
  await db.query("select set_config('request.jwt.claim.sub', $1, false)", [owner]);
  await db.exec('set role authenticated');
}
async function mutate(payload, requestId = randomUUID()) {
  await db.query('select public.mutate_workspace($1::jsonb, $2::uuid)', [JSON.stringify(payload), requestId]);
  return requestId;
}
async function rows(table) { return (await db.query(`select * from public.${table}`)).rows; }

test('real PostgreSQL migration, owner isolation, atomic writes and retry protection', async () => {
  await asUser(alice);
  await mutate({ action: 'settings', name: 'Alice Cafe', reward: 'Tea', goal: 2 });
  await mutate({ action: 'enroll', name: 'Customer', phone: '+880123' });
  const [member] = await rows('members');
  await assert.rejects(mutate({ action: 'enroll', name: 'Duplicate', phone: '+880123' }), /already enrolled/);
  await assert.rejects(mutate({ action: 'settings', name: 'Alice Cafe', reward: 'Tea', goal: 3 }), /goal is locked/);
  await assert.rejects(db.exec(`insert into public.members(owner, name, phone) values ('${alice}', 'Bypass', '1')`), /permission denied/);
  const stamp = { action: 'stamp', id: member.id };
  const request = await mutate(stamp);
  await mutate(stamp, request);
  assert.equal((await rows('members'))[0].stamps, 1);
  assert.equal((await rows('events')).length, 1);
  await assert.rejects(mutate({ action: 'redeem', id: member.id }, request), /already used/);
  await assert.rejects(mutate({ action: 'redeem', id: member.id }), /not ready/);
  assert.equal((await rows('members'))[0].stamps, 1);
  await mutate(stamp);
  await assert.rejects(mutate(stamp), /Card is full/);
  const redemption = await mutate({ action: 'redeem', id: member.id });
  await mutate({ action: 'redeem', id: member.id }, redemption);
  await assert.rejects(mutate({ action: 'redeem', id: member.id }), /not ready/);
  assert.equal((await rows('members'))[0].stamps, 0);
  assert.equal((await rows('members'))[0].visits, 2);
  assert.equal((await rows('events')).length, 3);

  // Force event insertion to fail after the member update, verifying rollback.
  await db.exec('reset role');
  await db.exec(`create function public.reject_event() returns trigger language plpgsql as $$
    begin raise exception 'test event failure'; end $$;
    create trigger fail_event before insert on public.events for each row execute function public.reject_event();`);
  await asUser(alice);
  await assert.rejects(mutate(stamp), /test event failure/);
  assert.equal((await rows('members'))[0].stamps, 0);
  assert.equal((await rows('events')).length, 3);
  await db.exec('reset role; drop trigger fail_event on public.events');

  await asUser(bob);
  assert.deepEqual(await rows('shops'), []);
  assert.deepEqual(await rows('members'), []);
  assert.deepEqual(await rows('events'), []);
  await mutate({ action: 'settings', name: 'Bob Cafe', reward: 'Coffee', goal: 2 });
  await assert.rejects(mutate(stamp), /Card not found/);
  // Owner fields from an untrusted caller cannot select another business.
  await mutate({ action: 'enroll', name: 'Bobs customer', phone: '+880123', owner: alice });
  assert.equal((await rows('members'))[0].owner, bob);
  await asUser(alice);
  assert.equal((await rows('members')).length, 1);
  await db.exec('reset role; set role anon');
  await assert.rejects(db.query('select public.mutate_workspace($1::jsonb, $2::uuid)', ['{}', randomUUID()]), /permission denied/);
  await assert.rejects(db.exec('select * from public.members'), /permission denied/);
});
