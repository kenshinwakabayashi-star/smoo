-- households: 同棲ペア・グループ単位
create table households (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  invite_code text unique not null default substring(gen_random_uuid()::text, 1, 8),
  created_at timestamptz default now()
);

-- users: Supabase Auth のユーザーと紐付け
create table user_profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null,
  household_id uuid references households(id),
  created_at timestamptz default now()
);

-- categories: 支出カテゴリ
create table categories (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references households(id) on delete cascade,
  name text not null,
  icon text not null,
  color text not null,
  is_default boolean default false
);

-- transactions: 支出・収入の明細
create table transactions (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references households(id) on delete cascade,
  user_id uuid references user_profiles(id) on delete set null,
  amount integer not null check (amount > 0),
  type text not null check (type in ('expense', 'income')),
  category_id uuid references categories(id) on delete set null,
  description text,
  date date not null default current_date,
  is_shared boolean not null default true,
  is_recurring boolean not null default false,
  created_at timestamptz default now()
);

-- budgets: 予算設定
create table budgets (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references households(id) on delete cascade,
  category_id uuid references categories(id) on delete cascade,
  amount integer not null check (amount > 0),
  month date not null,
  unique (household_id, category_id, month)
);

-- settlements: 精算記録
create table settlements (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references households(id) on delete cascade,
  from_user_id uuid references user_profiles(id),
  to_user_id uuid references user_profiles(id),
  amount integer not null check (amount > 0),
  month date not null,
  settled_at timestamptz
);

-- ============================================================
-- Row Level Security
-- ============================================================

alter table households enable row level security;
alter table user_profiles enable row level security;
alter table categories enable row level security;
alter table transactions enable row level security;
alter table budgets enable row level security;
alter table settlements enable row level security;

-- households: 同一 household のメンバーのみ参照可能
-- （未参加ユーザーによる招待コード検索は SECURITY DEFINER RPC で行う）
create policy "household members can view" on households
  for select using (
    id in (
      select household_id from user_profiles where id = auth.uid()
    )
  );

create policy "household members can update" on households
  for update using (
    id in (
      select household_id from user_profiles where id = auth.uid()
    )
  );

-- household の INSERT は SECURITY DEFINER RPC 経由のみ許可
create policy "authenticated users can create household" on households
  for insert with check (auth.uid() is not null);

-- user_profiles: 本人のみ書き込み、同一 household は参照可能
create policy "users can view profiles in same household" on user_profiles
  for select using (
    id = auth.uid()
    or household_id in (
      select household_id from user_profiles where id = auth.uid()
    )
  );

create policy "users can insert own profile" on user_profiles
  for insert with check (id = auth.uid());

create policy "users can update own profile" on user_profiles
  for update using (id = auth.uid());

-- categories: 同一 household 全員が読み書き可能
create policy "household members can manage categories" on categories
  for all using (
    household_id in (
      select household_id from user_profiles where id = auth.uid()
    )
  );

-- transactions: is_shared=true なら同一 household 全員、false なら本人のみ
create policy "view shared transactions" on transactions
  for select using (
    (is_shared = true and household_id in (
      select household_id from user_profiles where id = auth.uid()
    ))
    or user_id = auth.uid()
  );

create policy "household members can insert transactions" on transactions
  for insert with check (
    household_id in (
      select household_id from user_profiles where id = auth.uid()
    )
    and (user_id = auth.uid() or user_id is null)
  );

create policy "owners can update transactions" on transactions
  for update using (user_id = auth.uid());

create policy "owners can delete transactions" on transactions
  for delete using (user_id = auth.uid());

-- budgets: 同一 household 全員が読み書き可能
create policy "household members can select budgets" on budgets
  for select using (
    household_id in (
      select household_id from user_profiles where id = auth.uid()
    )
  );

create policy "household members can insert budgets" on budgets
  for insert with check (
    household_id in (
      select household_id from user_profiles where id = auth.uid()
    )
  );

create policy "household members can update budgets" on budgets
  for update using (
    household_id in (
      select household_id from user_profiles where id = auth.uid()
    )
  );

create policy "household members can delete budgets" on budgets
  for delete using (
    household_id in (
      select household_id from user_profiles where id = auth.uid()
    )
  );

-- settlements: 同一 household 全員が読み書き可能
create policy "household members can select settlements" on settlements
  for select using (
    household_id in (
      select household_id from user_profiles where id = auth.uid()
    )
  );

create policy "household members can insert settlements" on settlements
  for insert with check (
    household_id in (
      select household_id from user_profiles where id = auth.uid()
    )
  );

create policy "household members can update settlements" on settlements
  for update using (
    household_id in (
      select household_id from user_profiles where id = auth.uid()
    )
  );

-- ============================================================
-- SECURITY DEFINER 関数 (RLS をバイパスしてアトミック操作を行う)
-- ============================================================

-- household を作成してデフォルトカテゴリを挿入し、user_profile を作成する
create or replace function create_household_with_categories(
  p_household_name text,
  p_display_name   text
)
returns json
language plpgsql
security definer
set search_path = public
as $$
declare
  v_household_id uuid;
  v_invite_code  text;
  v_user_id      uuid;
begin
  v_user_id := auth.uid();

  if v_user_id is null then
    return json_build_object('error', 'Not authenticated');
  end if;

  -- すでに user_profile が存在する場合は更新のみ行う
  if exists (select 1 from user_profiles where id = v_user_id and household_id is not null) then
    return json_build_object('error', 'Already joined a household');
  end if;

  -- household 作成
  insert into households (name)
  values (p_household_name)
  returning id, invite_code into v_household_id, v_invite_code;

  -- デフォルトカテゴリ挿入
  insert into categories (household_id, name, icon, color, is_default) values
    (v_household_id, '食費',   '🛒', '#fef9c3', true),
    (v_household_id, '住居',   '🏠', '#dbeafe', true),
    (v_household_id, '光熱費', '💡', '#dbeafe', true),
    (v_household_id, '娯楽',   '🎬', '#fce7f3', true),
    (v_household_id, '日用品', '🧴', '#f0fdf4', true),
    (v_household_id, '交通',   '🚃', '#f5f3ff', true),
    (v_household_id, '医療',   '💊', '#fff7ed', true),
    (v_household_id, 'その他', '➕', '#f9fafb', true);

  -- user_profile を upsert
  insert into user_profiles (id, display_name, household_id)
  values (v_user_id, p_display_name, v_household_id)
  on conflict (id) do update
    set display_name = excluded.display_name,
        household_id = excluded.household_id;

  return json_build_object(
    'success',     true,
    'household_id', v_household_id::text,
    'invite_code', v_invite_code
  );
exception
  when others then
    return json_build_object('error', sqlerrm);
end;
$$;

-- 招待コードで household に参加する
create or replace function join_household_by_invite_code(
  p_invite_code  text,
  p_display_name text
)
returns json
language plpgsql
security definer
set search_path = public
as $$
declare
  v_household_id uuid;
  v_user_id      uuid;
begin
  v_user_id := auth.uid();

  if v_user_id is null then
    return json_build_object('error', 'Not authenticated');
  end if;

  -- すでに household に参加済みか確認
  if exists (select 1 from user_profiles where id = v_user_id and household_id is not null) then
    return json_build_object('error', 'Already joined a household');
  end if;

  -- 招待コードで household を検索 (RLS バイパス)
  select id into v_household_id
  from households
  where invite_code = p_invite_code;

  if v_household_id is null then
    return json_build_object('error', 'Invalid invite code');
  end if;

  -- user_profile を upsert
  insert into user_profiles (id, display_name, household_id)
  values (v_user_id, p_display_name, v_household_id)
  on conflict (id) do update
    set display_name = excluded.display_name,
        household_id = excluded.household_id;

  return json_build_object(
    'success',     true,
    'household_id', v_household_id::text
  );
exception
  when others then
    return json_build_object('error', sqlerrm);
end;
$$;
