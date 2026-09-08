-- Run once after the Auth user for Mojnu Khan exists.
-- Current Auth UID from the setup conversation:
-- 13f35e20-2b8c-4f75-84cb-07f4eb49cb7e

insert into public.affiliates (
  user_id,
  affiliate_code,
  name,
  brand_name,
  email,
  platform,
  commission_rate,
  status,
  joined_at
)
values (
  '13f35e20-2b8c-4f75-84cb-07f4eb49cb7e',
  'mojnu-khan',
  'Mojnu Khan',
  'Technical Bro BD',
  'moznukhan032@gmail.com',
  'YouTube',
  30.00,
  'active',
  now()
)
on conflict (affiliate_code) do update set
  user_id = excluded.user_id,
  name = excluded.name,
  brand_name = excluded.brand_name,
  email = excluded.email,
  platform = excluded.platform,
  commission_rate = excluded.commission_rate,
  status = excluded.status,
  updated_at = now();

update public.profiles
set role = 'affiliate', updated_at = now()
where id = '13f35e20-2b8c-4f75-84cb-07f4eb49cb7e';

select id, user_id, affiliate_code, name, brand_name, email, commission_rate, status
from public.affiliates
where affiliate_code = 'mojnu-khan';
