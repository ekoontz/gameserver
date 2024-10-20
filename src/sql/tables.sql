-- TODO: add foreign keys (e.g. user_id is primary key of vc_user)

-- gameserver=> \d place_expression
--             Table "public.place_expression"
--    Column   |           Type           |   Modifiers
-- ------------+--------------------------+---------------
-- osm_id     | bigint                   |
-- expr       | text                     |
-- user_id    | bigint                   |
-- created_on | timestamp with time zone | default now()
-- 

CREATE TABLE place_expression (osm_id bigint, expr text, user_id bigint, created_on TIMESTAMP WITH TIME ZONE DEFAULT now());

-- gameserver=> \d place_vocab
--                          Table "public.place_vocab"
--   Column   |  Type  |                       Modifiers
-- -----------+--------+-------------------------------------------------------
--  osm_id    | bigint |
--  item      | text   |
--  solved_by | bigint |
--  id        | bigint | not null default nextval('place_vocab_seq'::regclass)

CREATE SEQUENCE place_vocab_seq;
CREATE TABLE place_vocab (osm_id BIGINT, item TEXT,
   solved_by BIGINT, id BIGINT NOT NULL DEFAULT nextval('place_vocab_seq'::regclass));

-- 
-- gameserver=> \d place_tense
--                          Table "public.place_tense"
--   Column   |  Type  |                       Modifiers
-- -----------+--------+-------------------------------------------------------
--  osm_id    | bigint |
--  item      | text   |
--  solved_by | bigint |
--  id        | bigint | not null default nextval('place_tense_seq'::regclass)

CREATE SEQUENCE place_tense_seq;
CREATE TABLE place_tense (osm_id BIGINT, item BIGINT, solved_by BIGINT, id BIGINT NOT NULL DEFAULT nextval('place_tense_seq'));
-- 
-- gameserver=> \d player_location
-- Table "public.player_location"
--  Column  |  Type  | Modifiers
-- ---------+--------+-----------
--  osm_id  | bigint |
--  user_id | bigint |

CREATE TABLE player_location (osm_id BIGINT, user_id BIGINT);

-- 
-- gameserver=> \d place_points
--   Table "public.place_points"
--   Column   |  Type  | Modifiers
-- -----------+--------+-----------
--  player_id | bigint |
--  osm_id    | bigint |
--  points    | bigint |
-- 
CREATE TABLE place_points (player_id BIGINT, osm_id BIGINT, points BIGINT);
