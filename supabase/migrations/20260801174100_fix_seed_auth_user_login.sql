update auth.users
set confirmation_token          = coalesce(confirmation_token, ''),
    recovery_token              = coalesce(recovery_token, ''),
    email_change_token_new      = coalesce(email_change_token_new, ''),
    email_change_token_current  = coalesce(email_change_token_current, ''),
    email_change                = coalesce(email_change, ''),
    phone_change                = coalesce(phone_change, ''),
    phone_change_token          = coalesce(phone_change_token, ''),
    reauthentication_token      = coalesce(reauthentication_token, '')
where email = 'jose@gmail.com';

insert into auth.identities (id, user_id, provider_id, provider, identity_data, last_sign_in_at, created_at, updated_at)
select gen_random_uuid(), u.id, u.id, 'email',
       jsonb_build_object('sub', u.id::text, 'email', u.email, 'email_verified', true, 'phone_verified', false),
       now(), now(), now()
from auth.users u
where u.email = 'jose@gmail.com'
  and not exists (select 1 from auth.identities i where i.user_id = u.id);
