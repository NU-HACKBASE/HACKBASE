import type pg from 'pg'

export const ensureDatabaseSchema = async (db: pg.Pool) => {
  await db.query(`
    create table if not exists users (
      id text primary key,
      name text not null,
      role text not null check (role in ('anonymous', 'admin')),
      created_at timestamptz not null default now()
    );

    create table if not exists events (
      id text primary key,
      title text not null,
      address text not null default '',
      latitude double precision,
      longitude double precision,
      radius integer not null default 0,
      manager_id text references users(id),
      starts_at timestamptz,
      created_at timestamptz not null default now()
    );

    create table if not exists rooms (
      id text primary key,
      event_id text not null references events(id) on delete cascade,
      title text not null,
      heat integer not null default 0,
      summary text not null default '',
      created_at timestamptz not null default now()
    );

    create table if not exists chats (
      id text primary key,
      event_id text not null references events(id) on delete cascade,
      room_id text not null references rooms(id) on delete cascade,
      user_id text not null references users(id),
      body text not null,
      created_at timestamptz not null default now(),
      updated_at timestamptz,
      deleted_at timestamptz
    );

    create table if not exists likes (
      user_id text not null references users(id) on delete cascade,
      chat_id text not null references chats(id) on delete cascade,
      created_at timestamptz not null default now(),
      primary key (user_id, chat_id)
    );

    create table if not exists participants (
      event_id text not null references events(id) on delete cascade,
      user_id text not null references users(id) on delete cascade,
      joined_at timestamptz not null default now(),
      primary key (event_id, user_id)
    );

    create index if not exists events_created_at_idx on events(created_at desc);
    create index if not exists rooms_event_id_idx on rooms(event_id);
    create index if not exists chats_room_created_at_idx on chats(room_id, created_at desc);
    create index if not exists likes_chat_id_idx on likes(chat_id);
    create index if not exists participants_user_id_idx on participants(user_id);
  `)
}
