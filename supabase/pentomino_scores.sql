-- 未作成の場合にSupabase SQL Editorで実行。scoreは秒（小数点以下2桁）。
create table if not exists public.pentomino_scores (
  id bigint generated always as identity primary key,
  name text not null check (char_length(name) between 1 and 12),
  score numeric(12,2) not null check (score >= 0),
  moves integer not null check (moves >= 0),
  created_at timestamptz not null default now()
);
create index if not exists pentomino_scores_order_idx
  on public.pentomino_scores (score asc, moves asc, created_at asc);
alter table public.pentomino_scores enable row level security;
grant usage on schema public to anon;
grant select on public.pentomino_scores to anon;
grant insert (name, score, moves) on public.pentomino_scores to anon;
grant usage on sequence public.pentomino_scores_id_seq to anon;
drop policy if exists pentomino_public_read on public.pentomino_scores;
create policy pentomino_public_read on public.pentomino_scores for select to anon using (true);
drop policy if exists pentomino_public_insert on public.pentomino_scores;
create policy pentomino_public_insert on public.pentomino_scores for insert to anon
  with check (char_length(name) between 1 and 12 and score >= 0 and moves >= 0);
-- ブラウザからの直接登録方式。競技用の不正防止が必要な場合は、
-- 別途サーバー側でプレイ履歴を検証するAPIを設ける。

