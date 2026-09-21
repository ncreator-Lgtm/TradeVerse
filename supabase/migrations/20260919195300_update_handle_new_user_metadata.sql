-- Safe for an existing TradeVerse database.
-- Does NOT create or drop tables, policies, or the auth.users trigger.
-- Replaces only the handle_new_user() function body so new users get
-- username and display_name from auth metadata.

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, username, display_name)
  values (
    new.id,
    new.raw_user_meta_data ->> 'username',
    new.raw_user_meta_data ->> 'display_name'
  )
  on conflict (id) do update
  set
    username = coalesce(nullif(excluded.username, ''), public.profiles.username),
    display_name = coalesce(nullif(excluded.display_name, ''), public.profiles.display_name);

  if not exists (
    select 1
    from public.personal_portfolios
    where user_id = new.id
  ) then
    insert into public.personal_portfolios (user_id, starting_capital, cash_balance)
    values (new.id, 100000, 100000);
  end if;

  return new;
end;
$$;
