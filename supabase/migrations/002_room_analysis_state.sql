alter table rooms add column if not exists analyzed_at timestamptz;
alter table rooms add column if not exists analyzed_chat_count integer not null default 0;
alter table rooms add column if not exists analysis_status text not null default 'idle';
alter table rooms add column if not exists analysis_error text;

create index if not exists rooms_analysis_due_idx on rooms(analysis_status, analyzed_at);
