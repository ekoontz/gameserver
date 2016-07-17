verbcoach=> \d place_expression
            Table "public.place_expression"
   Column   |           Type           |   Modifiers
------------+--------------------------+---------------
 osm_id     | bigint                   |
 expr       | text                     |
 user_id    | bigint                   |
 created_on | timestamp with time zone | default now()

verbcoach=> \d place_vocab
                         Table "public.place_vocab"
  Column   |  Type  |                       Modifiers
-----------+--------+-------------------------------------------------------
 osm_id    | bigint |
 item      | text   |
 solved_by | bigint |
 id        | bigint | not null default nextval('place_vocab_seq'::regclass)

verbcoach=> \d place_tense
                         Table "public.place_tense"
  Column   |  Type  |                       Modifiers
-----------+--------+-------------------------------------------------------
 osm_id    | bigint |
 item      | text   |
 solved_by | bigint |
 id        | bigint | not null default nextval('place_tense_seq'::regclass)

verbcoach=> \d player_location
Table "public.player_location"
 Column  |  Type  | Modifiers
---------+--------+-----------
 osm_id  | bigint |
 user_id | bigint |

verbcoach=>
