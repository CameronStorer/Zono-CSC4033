-- =============================================================================
-- Zono App — Database Seed
-- Run this in the Supabase SQL Editor to populate fake users and friendships.
-- Replace <ADMIN_UUID> with the actual UUID of the admin/test account.
-- =============================================================================

-- ── 1. Fake auth users ────────────────────────────────────────────────────────
-- Each INSERT creates a row in auth.users; the DB trigger then creates the
-- corresponding row in public.users with default values.

INSERT INTO auth.users (id, email, encrypted_password, email_confirmed_at, created_at, updated_at, raw_user_meta_data, role, aud)
VALUES
  ('a1000001-0000-0000-0000-000000000001', 'beau.thibodaux@zono.fake',   crypt('Zono2024!', gen_salt('bf')), NOW(), NOW(), NOW(), '{}', 'authenticated', 'authenticated'),
  ('a1000001-0000-0000-0000-000000000002', 'claire.fontenot@zono.fake',  crypt('Zono2024!', gen_salt('bf')), NOW(), NOW(), NOW(), '{}', 'authenticated', 'authenticated'),
  ('a1000001-0000-0000-0000-000000000003', 'mason.breaux@zono.fake',     crypt('Zono2024!', gen_salt('bf')), NOW(), NOW(), NOW(), '{}', 'authenticated', 'authenticated'),
  ('a1000001-0000-0000-0000-000000000004', 'savannah.delacroix@zono.fake', crypt('Zono2024!', gen_salt('bf')), NOW(), NOW(), NOW(), '{}', 'authenticated', 'authenticated'),
  ('a1000001-0000-0000-0000-000000000005', 'hunter.arceneaux@zono.fake', crypt('Zono2024!', gen_salt('bf')), NOW(), NOW(), NOW(), '{}', 'authenticated', 'authenticated'),
  ('a1000001-0000-0000-0000-000000000006', 'madison.broussard@zono.fake', crypt('Zono2024!', gen_salt('bf')), NOW(), NOW(), NOW(), '{}', 'authenticated', 'authenticated'),
  ('a1000001-0000-0000-0000-000000000007', 'cole.tureaud@zono.fake',     crypt('Zono2024!', gen_salt('bf')), NOW(), NOW(), NOW(), '{}', 'authenticated', 'authenticated'),
  ('a1000001-0000-0000-0000-000000000008', 'abigail.melancon@zono.fake', crypt('Zono2024!', gen_salt('bf')), NOW(), NOW(), NOW(), '{}', 'authenticated', 'authenticated'),
  ('a1000001-0000-0000-0000-000000000009', 'drew.hebert@zono.fake',      crypt('Zono2024!', gen_salt('bf')), NOW(), NOW(), NOW(), '{}', 'authenticated', 'authenticated'),
  ('a1000001-0000-0000-0000-000000000010', 'emma.landry@zono.fake',      crypt('Zono2024!', gen_salt('bf')), NOW(), NOW(), NOW(), '{}', 'authenticated', 'authenticated'),
  ('a1000001-0000-0000-0000-000000000011', 'jake.boudreaux@zono.fake',   crypt('Zono2024!', gen_salt('bf')), NOW(), NOW(), NOW(), '{}', 'authenticated', 'authenticated'),
  ('a1000001-0000-0000-0000-000000000012', 'peyton.gaspard@zono.fake',   crypt('Zono2024!', gen_salt('bf')), NOW(), NOW(), NOW(), '{}', 'authenticated', 'authenticated'),
  ('a1000001-0000-0000-0000-000000000013', 'riley.comeaux@zono.fake',    crypt('Zono2024!', gen_salt('bf')), NOW(), NOW(), NOW(), '{}', 'authenticated', 'authenticated'),
  ('a1000001-0000-0000-0000-000000000014', 'austin.aucoin@zono.fake',    crypt('Zono2024!', gen_salt('bf')), NOW(), NOW(), NOW(), '{}', 'authenticated', 'authenticated'),
  ('a1000001-0000-0000-0000-000000000015', 'taylor.guillory@zono.fake',  crypt('Zono2024!', gen_salt('bf')), NOW(), NOW(), NOW(), '{}', 'authenticated', 'authenticated'),
  ('a1000001-0000-0000-0000-000000000016', 'morgan.thibaut@zono.fake',   crypt('Zono2024!', gen_salt('bf')), NOW(), NOW(), NOW(), '{}', 'authenticated', 'authenticated'),
  ('a1000001-0000-0000-0000-000000000017', 'luke.fontenot@zono.fake',    crypt('Zono2024!', gen_salt('bf')), NOW(), NOW(), NOW(), '{}', 'authenticated', 'authenticated'),
  ('a1000001-0000-0000-0000-000000000018', 'anna.richard@zono.fake',     crypt('Zono2024!', gen_salt('bf')), NOW(), NOW(), NOW(), '{}', 'authenticated', 'authenticated'),
  ('a1000001-0000-0000-0000-000000000019', 'evan.chenevert@zono.fake',   crypt('Zono2024!', gen_salt('bf')), NOW(), NOW(), NOW(), '{}', 'authenticated', 'authenticated'),
  ('a1000001-0000-0000-0000-000000000020', 'grace.lejeune@zono.fake',    crypt('Zono2024!', gen_salt('bf')), NOW(), NOW(), NOW(), '{}', 'authenticated', 'authenticated'),
  ('a1000001-0000-0000-0000-000000000021', 'carter.robichaux@zono.fake', crypt('Zono2024!', gen_salt('bf')), NOW(), NOW(), NOW(), '{}', 'authenticated', 'authenticated'),
  ('a1000001-0000-0000-0000-000000000022', 'hailey.trahan@zono.fake',    crypt('Zono2024!', gen_salt('bf')), NOW(), NOW(), NOW(), '{}', 'authenticated', 'authenticated'),
  ('a1000001-0000-0000-0000-000000000023', 'dylan.theriot@zono.fake',    crypt('Zono2024!', gen_salt('bf')), NOW(), NOW(), NOW(), '{}', 'authenticated', 'authenticated'),
  ('a1000001-0000-0000-0000-000000000024', 'brooke.duhon@zono.fake',     crypt('Zono2024!', gen_salt('bf')), NOW(), NOW(), NOW(), '{}', 'authenticated', 'authenticated'),
  ('a1000001-0000-0000-0000-000000000025', 'caleb.doucet@zono.fake',     crypt('Zono2024!', gen_salt('bf')), NOW(), NOW(), NOW(), '{}', 'authenticated', 'authenticated'),
  ('a1000001-0000-0000-0000-000000000026', 'alexis.babineaux@zono.fake', crypt('Zono2024!', gen_salt('bf')), NOW(), NOW(), NOW(), '{}', 'authenticated', 'authenticated'),
  ('a1000001-0000-0000-0000-000000000027', 'zachary.pitre@zono.fake',    crypt('Zono2024!', gen_salt('bf')), NOW(), NOW(), NOW(), '{}', 'authenticated', 'authenticated'),
  ('a1000001-0000-0000-0000-000000000028', 'kayla.ardoin@zono.fake',     crypt('Zono2024!', gen_salt('bf')), NOW(), NOW(), NOW(), '{}', 'authenticated', 'authenticated'),
  ('a1000001-0000-0000-0000-000000000029', 'hunter.lavergne@zono.fake',  crypt('Zono2024!', gen_salt('bf')), NOW(), NOW(), NOW(), '{}', 'authenticated', 'authenticated'),
  ('a1000001-0000-0000-0000-000000000030', 'paige.daigle@zono.fake',     crypt('Zono2024!', gen_salt('bf')), NOW(), NOW(), NOW(), '{}', 'authenticated', 'authenticated'),
  ('a1000001-0000-0000-0000-000000000031', 'tanner.mouton@zono.fake',    crypt('Zono2024!', gen_salt('bf')), NOW(), NOW(), NOW(), '{}', 'authenticated', 'authenticated'),
  ('a1000001-0000-0000-0000-000000000032', 'jessica.sonnier@zono.fake',  crypt('Zono2024!', gen_salt('bf')), NOW(), NOW(), NOW(), '{}', 'authenticated', 'authenticated'),
  ('a1000001-0000-0000-0000-000000000033', 'kyle.bertrand@zono.fake',    crypt('Zono2024!', gen_salt('bf')), NOW(), NOW(), NOW(), '{}', 'authenticated', 'authenticated'),
  ('a1000001-0000-0000-0000-000000000034', 'sara.benoit@zono.fake',      crypt('Zono2024!', gen_salt('bf')), NOW(), NOW(), NOW(), '{}', 'authenticated', 'authenticated'),
  ('a1000001-0000-0000-0000-000000000035', 'blake.leblanc@zono.fake',    crypt('Zono2024!', gen_salt('bf')), NOW(), NOW(), NOW(), '{}', 'authenticated', 'authenticated')
ON CONFLICT (id) DO NOTHING;

-- ── 2. Profile data for each fake user ───────────────────────────────────────
-- The trigger already created public.users rows; we UPDATE them with real data.
-- Coordinates are scattered around Ruston, LA (32.52°N, 92.64°W).

UPDATE public.users SET full_name='Beau Thibodaux',    username='beau_t',       bio='LSU fan, crawfish boil king', last_lat=32.5251, last_lng=-92.6521 WHERE id='a1000001-0000-0000-0000-000000000001';
UPDATE public.users SET full_name='Claire Fontenot',   username='claire_f',     bio='Loves hiking and sweet tea',   last_lat=32.5189, last_lng=-92.6398 WHERE id='a1000001-0000-0000-0000-000000000002';
UPDATE public.users SET full_name='Mason Breaux',      username='mason_b',      bio='Football, trucks, and fishing', last_lat=32.5312, last_lng=-92.6445 WHERE id='a1000001-0000-0000-0000-000000000003';
UPDATE public.users SET full_name='Savannah Delacroix',username='savannah_d',   bio='Art and coffee enthusiast',    last_lat=32.5198, last_lng=-92.6587 WHERE id='a1000001-0000-0000-0000-000000000004';
UPDATE public.users SET full_name='Hunter Arceneaux',  username='hunter_arc',   bio='Outdoors, hunting, 4x4',       last_lat=32.5278, last_lng=-92.6312 WHERE id='a1000001-0000-0000-0000-000000000005';
UPDATE public.users SET full_name='Madison Broussard', username='madison_b',    bio='Yoga and brunch on Sundays',   last_lat=32.5145, last_lng=-92.6489 WHERE id='a1000001-0000-0000-0000-000000000006';
UPDATE public.users SET full_name='Cole Tureaud',      username='cole_t',       bio='Car guy, weekend mechanic',    last_lat=32.5334, last_lng=-92.6278 WHERE id='a1000001-0000-0000-0000-000000000007';
UPDATE public.users SET full_name='Abigail Melancon',  username='abigail_m',    bio='Nursing student at Tech',      last_lat=32.5212, last_lng=-92.6534 WHERE id='a1000001-0000-0000-0000-000000000008';
UPDATE public.users SET full_name='Drew Hebert',       username='drew_h',       bio='Music, bass guitar, camping',  last_lat=32.5267, last_lng=-92.6423 WHERE id='a1000001-0000-0000-0000-000000000009';
UPDATE public.users SET full_name='Emma Landry',       username='emma_l',       bio='Dog mom, avid reader',         last_lat=32.5156, last_lng=-92.6362 WHERE id='a1000001-0000-0000-0000-000000000010';
UPDATE public.users SET full_name='Jake Boudreaux',    username='jake_b',       bio='Basketball every Saturday',    last_lat=32.5298, last_lng=-92.6501 WHERE id='a1000001-0000-0000-0000-000000000011';
UPDATE public.users SET full_name='Peyton Gaspard',    username='peyton_g',     bio='Computer science nerd',        last_lat=32.5223, last_lng=-92.6289 WHERE id='a1000001-0000-0000-0000-000000000012';
UPDATE public.users SET full_name='Riley Comeaux',     username='riley_c',      bio='Cajun cooking runs in the family', last_lat=32.5241, last_lng=-92.6467 WHERE id='a1000001-0000-0000-0000-000000000013';
UPDATE public.users SET full_name='Austin Aucoin',     username='austin_a',     bio='Disc golf and cold beers',     last_lat=32.5178, last_lng=-92.6543 WHERE id='a1000001-0000-0000-0000-000000000014';
UPDATE public.users SET full_name='Taylor Guillory',   username='taylor_g',     bio='Track and field at La Tech',   last_lat=32.5289, last_lng=-92.6378 WHERE id='a1000001-0000-0000-0000-000000000015';
UPDATE public.users SET full_name='Morgan Thibaut',    username='morgan_t',     bio='Photography and road trips',   last_lat=32.5167, last_lng=-92.6411 WHERE id='a1000001-0000-0000-0000-000000000016';
UPDATE public.users SET full_name='Luke Fontenot',     username='luke_f',       bio='Mechanical engineering senior',last_lat=32.5321, last_lng=-92.6556 WHERE id='a1000001-0000-0000-0000-000000000017';
UPDATE public.users SET full_name='Anna Richard',      username='anna_r',       bio='Piano, cats, and iced coffee', last_lat=32.5204, last_lng=-92.6323 WHERE id='a1000001-0000-0000-0000-000000000018';
UPDATE public.users SET full_name='Evan Chenevert',    username='evan_c',       bio='Gym rat, protein shake dealer',last_lat=32.5258, last_lng=-92.6589 WHERE id='a1000001-0000-0000-0000-000000000019';
UPDATE public.users SET full_name='Grace Lejeune',     username='grace_l',      bio='Pre-med, loves Mardi Gras',    last_lat=32.5133, last_lng=-92.6445 WHERE id='a1000001-0000-0000-0000-000000000020';
UPDATE public.users SET full_name='Carter Robichaux',  username='carter_r',     bio='Gamer and pizza connoisseur',  last_lat=32.5345, last_lng=-92.6334 WHERE id='a1000001-0000-0000-0000-000000000021';
UPDATE public.users SET full_name='Hailey Trahan',     username='hailey_t',     bio='Interior design student',      last_lat=32.5187, last_lng=-92.6512 WHERE id='a1000001-0000-0000-0000-000000000022';
UPDATE public.users SET full_name='Dylan Theriot',     username='dylan_th',     bio='BMX, skate, and rap music',    last_lat=32.5276, last_lng=-92.6267 WHERE id='a1000001-0000-0000-0000-000000000023';
UPDATE public.users SET full_name='Brooke Duhon',      username='brooke_d',     bio='Nursing and farmers markets',  last_lat=32.5219, last_lng=-92.6578 WHERE id='a1000001-0000-0000-0000-000000000024';
UPDATE public.users SET full_name='Caleb Doucet',      username='caleb_d',      bio='Welding tech, weekend warrior',last_lat=32.5301, last_lng=-92.6423 WHERE id='a1000001-0000-0000-0000-000000000025';
UPDATE public.users SET full_name='Alexis Babineaux',  username='alexis_b',     bio='Broadcast journalism major',   last_lat=32.5163, last_lng=-92.6356 WHERE id='a1000001-0000-0000-0000-000000000026';
UPDATE public.users SET full_name='Zachary Pitre',     username='zach_p',       bio='Hunting club president',       last_lat=32.5289, last_lng=-92.6489 WHERE id='a1000001-0000-0000-0000-000000000027';
UPDATE public.users SET full_name='Kayla Ardoin',      username='kayla_a',      bio='Elementary ed, loves kids',    last_lat=32.5231, last_lng=-92.6301 WHERE id='a1000001-0000-0000-0000-000000000028';
UPDATE public.users SET full_name='Hunter Lavergne',   username='hunter_lav',   bio='Architecture and live music',  last_lat=32.5148, last_lng=-92.6534 WHERE id='a1000001-0000-0000-0000-000000000029';
UPDATE public.users SET full_name='Paige Daigle',      username='paige_d',      bio='French literature and wine',   last_lat=32.5312, last_lng=-92.6267 WHERE id='a1000001-0000-0000-0000-000000000030';
UPDATE public.users SET full_name='Tanner Mouton',     username='tanner_m',     bio='Agriculture, cows, and country', last_lat=32.5256, last_lng=-92.6612 WHERE id='a1000001-0000-0000-0000-000000000031';
UPDATE public.users SET full_name='Jessica Sonnier',   username='jess_s',       bio='Dance and film photography',   last_lat=32.5194, last_lng=-92.6378 WHERE id='a1000001-0000-0000-0000-000000000032';
UPDATE public.users SET full_name='Kyle Bertrand',     username='kyle_b',       bio='CrossFit and meal prepping',   last_lat=32.5267, last_lng=-92.6445 WHERE id='a1000001-0000-0000-0000-000000000033';
UPDATE public.users SET full_name='Sara Benoit',       username='sara_b',       bio='Psychology and true crime pods',last_lat=32.5178, last_lng=-92.6289 WHERE id='a1000001-0000-0000-0000-000000000034';
UPDATE public.users SET full_name='Blake Leblanc',     username='blake_l',      bio='Marketing, fishing, and LSU',  last_lat=32.5334, last_lng=-92.6512 WHERE id='a1000001-0000-0000-0000-000000000035';

-- ── 3. Friendships (admin ↔ all 35 fake users) ───────────────────────────────
-- Replace <ADMIN_UUID> with the admin account's actual UUID before running.
-- Friendships are bidirectional so we insert both directions.

DO $$
DECLARE
  admin_id uuid := '<ADMIN_UUID>';  -- REPLACE THIS
  fake_ids uuid[] := ARRAY[
    'a1000001-0000-0000-0000-000000000001',
    'a1000001-0000-0000-0000-000000000002',
    'a1000001-0000-0000-0000-000000000003',
    'a1000001-0000-0000-0000-000000000004',
    'a1000001-0000-0000-0000-000000000005',
    'a1000001-0000-0000-0000-000000000006',
    'a1000001-0000-0000-0000-000000000007',
    'a1000001-0000-0000-0000-000000000008',
    'a1000001-0000-0000-0000-000000000009',
    'a1000001-0000-0000-0000-000000000010',
    'a1000001-0000-0000-0000-000000000011',
    'a1000001-0000-0000-0000-000000000012',
    'a1000001-0000-0000-0000-000000000013',
    'a1000001-0000-0000-0000-000000000014',
    'a1000001-0000-0000-0000-000000000015',
    'a1000001-0000-0000-0000-000000000016',
    'a1000001-0000-0000-0000-000000000017',
    'a1000001-0000-0000-0000-000000000018',
    'a1000001-0000-0000-0000-000000000019',
    'a1000001-0000-0000-0000-000000000020',
    'a1000001-0000-0000-0000-000000000021',
    'a1000001-0000-0000-0000-000000000022',
    'a1000001-0000-0000-0000-000000000023',
    'a1000001-0000-0000-0000-000000000024',
    'a1000001-0000-0000-0000-000000000025',
    'a1000001-0000-0000-0000-000000000026',
    'a1000001-0000-0000-0000-000000000027',
    'a1000001-0000-0000-0000-000000000028',
    'a1000001-0000-0000-0000-000000000029',
    'a1000001-0000-0000-0000-000000000030'
  ];
  fid uuid;
BEGIN
  FOREACH fid IN ARRAY fake_ids LOOP
    INSERT INTO public.friendships (user_id, friend_id, status)
    VALUES (admin_id, fid, 'active'), (fid, admin_id, 'active')
    ON CONFLICT DO NOTHING;
  END LOOP;
END $$;
