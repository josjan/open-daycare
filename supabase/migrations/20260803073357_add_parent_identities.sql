insert into auth.identities (id, user_id, provider_id, provider, identity_data, last_sign_in_at, created_at, updated_at)
select gen_random_uuid(), u.id, u.id, 'email',
       jsonb_build_object('sub', u.id::text, 'email', u.email, 'email_verified', true, 'phone_verified', false),
       now(), now(), now()
from auth.users u
where u.email in (
  'lucia@gmail.com', 'diego@gmail.com', 'ana@gmail.com', 'maria@gmail.com',
  'carlos@gmail.com', 'paula@gmail.com', 'laura@gmail.com', 'roberto@gmail.com',
  'claudia@gmail.com'
)
  and not exists (select 1 from auth.identities i where i.user_id = u.id);
