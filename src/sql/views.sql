CREATE OR REPLACE VIEW solved_by AS
    SELECT COALESCE(vocab_osm_id,tense_osm_id) AS osm_id,
           COALESCE(vocab_solved_by,tense_solved_by) AS user_id,
           num_vocab_solved AS vocab,
           num_tense_solved AS tenses
      FROM ( SELECT vocab_solvers.vocab_osm_id,
                    vocab_solvers.vocab_solved_by,
                    vocab_solvers.num_vocab_solved,
                    tense_solvers.tense_osm_id,
                    tense_solvers.tense_solved_by,
                    tense_solvers.num_tense_solved
               FROM ( SELECT place_vocab.osm_id AS vocab_osm_id,
                             place_vocab.solved_by AS vocab_solved_by,
                             count(*) AS num_vocab_solved
                        FROM place_vocab
                    GROUP BY place_vocab.osm_id, place_vocab.solved_by) vocab_solvers
   FULL OUTER JOIN ( SELECT place_tense.osm_id AS tense_osm_id,
                             place_tense.solved_by AS tense_solved_by,
                             count(*) AS num_tense_solved
                        FROM place_tense
                    GROUP BY place_tense.osm_id, place_tense.solved_by) tense_solvers
                 ON tense_osm_id = vocab_osm_id
                AND tense_solvers.tense_solved_by = vocab_solvers.vocab_solved_by) solved;

CREATE OR REPLACE VIEW owned_locations AS
   SELECT left_side.osm_id,
          left_side.user_id
     FROM solved_by left_side
LEFT JOIN solved_by right_side
       ON left_side.osm_id = right_side.osm_id
      AND left_side.user_id <> right_side.user_id
   WHERE right_side.user_id IS NULL;

-- warning: duplicates are possible in contested_locations
-- clients should use DISTINCT (SELECT * FROM contested_locations ) if necessary
-- e.g. to get a count of the total number of contested_locations.
CREATE OR REPLACE VIEW contested_locations AS
    SELECT left_side.osm_id
      FROM solved_by left_side
INNER JOIN solved_by right_side
        ON left_side.osm_id = right_side.osm_id
       AND left_side.user_id <> right_side.user_id;


