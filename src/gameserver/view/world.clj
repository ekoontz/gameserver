(ns gameserver.view.world
  (:require [babel.italiano :refer [parse]]
            [babel.parse :refer [leaves]]
            [cemerick.friend :as friend]
            [clojure.data.json :as json]
            [dag_unify.core :as u]
            [korma.core :as k]
            [korma.db :refer [defdb postgres]]
            [cheshire.core :refer [generate-string]]
            [clojure.string :as string]
            [clojure.tools.logging :as log]
            [compojure.core :refer [defroutes GET POST]]
            [gameserver.service.db :refer [korma-db]]
            [gameserver.util.session :refer [current-user]]
            [gameserver.view.auth.users :refer [get-user-from-ring-session]]
            [gameserver.view.common :refer [wrap-layout]]
            [stencil.core :as stencil]))

(declare respond)
(declare root-form)
(declare update-db-on-response)

(defroutes world-routes
  (GET "/" request
         (friend/authenticated
          (let [player-id (:id (get-user-from-ring-session
                                (get-in request [:cookies "ring-session" :value])))]
            (if (nil? player-id)
              (do (log/error (str "player-id is null; ring-session: "
                                  (get-in request [:cookies "ring-session" :value])))
                  {:status 302
                   :headers {"Location" (str "/logout?session-expired")}})
              (do
                (log/info (str "rendering map page: current-user: " (current-user)))
                (log/info (str "rendering map page: player_id: " player-id))
                (wrap-layout "World"
                             (stencil/render-file
                              "gameserver/view/templates/world"
                              {})
                             {:remote-js [{:src "https://api.mapbox.com/mapbox-gl-js/v0.20.1/mapbox-gl.js"}
                                          ;; TODO: use integrity= and crossorigin=
                                          ;; per https://code.jquery.com
                                          ]
                              :remote-css [{:src "https://api.mapbox.com/mapbox-gl-js/v0.20.1/mapbox-gl.css"}
                                           {:src "http://maxcdn.bootstrapcdn.com/font-awesome/4.1.0/css/font-awesome.min.css"}]
                              ;; TODO: consider using http://browserify.org/ to bundle all local js.
                              :local-js [{:src "mustache.min.js"}
                                         {:src "log4.js"}
                                         ;; TODO: move this out of javascript and into a server-side
                                         ;; HTTP proxy service that runs inside the server
                                         ;; and uses these credentials
                                         {:src "credentials.js"}
                                         {:src "config.js"}
                                         ;; these 3 above must remain before others below.
                                         {:src "geolib.js"}
                                         {:src "player.js"}
                                         {:src "placebox.js"}
                                         {:src "actions.js"}
                                         {:src "input.js"}
                                         {:src "streetview.js"}
                                         {:src "vocab.js"}
                                         {:src "world.js"}]
                              :local-css [{:src "animate.min.css"}
                                          {:src "placebox.css"}
                                          {:src "player.css"}
                                          {:src "input.css"}
                                          {:src "streetview.css"}
                                          {:src "vocab.css"}
                                          {:src "world.css"}]
                              :onload (str "load_world('" player-id "');")}))))))

  (GET "/adjacency" request
       (friend/authenticated
        (let [logging (log/info (str "/adjacency"))
              rows (k/exec-raw ["
  SELECT n1.osm_id AS n1,
         ARRAY(SELECT n2.osm_id
                 FROM amsterdam_polygon AS n2
                WHERE n2.admin_level = '10'
                  AND ST_Touches(n1.way,n2.way)
             ORDER BY n2.name) AS adj
    FROM amsterdam_polygon AS n1
   WHERE n1.admin_level='10'
ORDER BY n1.name;
"
                                []] :results)
              body (map (fn [row]
                          {:osm_id (:n1 row)
                           :adj (map str (.getArray (:adj row)))})
                        rows)]
          {:headers {"Content-Type" "application/json;charset=utf-8"}
           :body (generate-string body)})))

  (GET "/owners" request
       (friend/authenticated
        (let [logging (log/info (str "/owners"))
              rows (k/exec-raw ["
SELECT osm_id,user_id AS owner_id FROM owned_locations
"
                                []] :results)]
          {:headers {"Content-Type" "application/json;charset=utf-8"}
           :body (generate-string rows)})))
  
  ;; given a place's OSM id, return the expressions for it, if the user is allowed to see them
  ;; (is the owner).
  (GET "/expr/:osm" request
       (friend/authenticated
        (let [osm-id (Integer. (:osm (:params request)))
              player-id (if-let [id (:id (get-user-from-ring-session
                                          (get-in request [:cookies "ring-session" :value])))]
                          (Integer. id))
              logging (log/info (str "/expr/" osm-id))
              data (k/exec-raw ["SELECT expr.expr,created_on,expr.created_by
                                   FROM place_expression AS expr
                             INNER JOIN owned_locations
                                     ON (owned_locations.osm_id = expr.osm_id)
                                    AND (owned_locations.user_id = ?)
                                  WHERE expr.osm_id=?
                               ORDER BY created_on DESC
"
                                [player-id osm-id]] :results)]
          {:headers {"Content-Type" "application/json;charset=utf-8"}
           :body (generate-string {:expressions data})})))

  (GET "/hoods" request
       (friend/authenticated
          (let [logging (log/info (str "/hoods"))
                data (k/exec-raw ["
SELECT amsterdam_polygon.name,amsterdam_polygon.osm_id,
           ST_AsGeoJSON(ST_Transform(ST_Centroid(amsterdam_polygon.way),4326)) AS centroid,
           vc_user.id AS player,vc_user.email AS email
      FROM amsterdam_polygon
 LEFT JOIN owned_locations
        ON (owned_locations.osm_id = amsterdam_polygon.osm_id)
 LEFT JOIN vc_user
        ON (owned_locations.user_id = vc_user.id)
     WHERE (admin_level = '10') 
  ORDER BY amsterdam_polygon.name ASC
"
                                  []] :results)

                geojson (map (fn [hood]
                               {:type "Feature"
                                :geometry (json/read-str (:centroid hood))
                                :properties {:owner {:id (:player hood)
                                                     :email (:email hood)}
                                             :osm_id (:osm_id hood)
                                             :neighborhood (:name hood)}
                                }
                               )
                             data)]
            (log/debug (str "geojson:" (clojure.string/join ";" geojson)))
            {:headers {"Content-Type" "application/json;charset=utf-8"}
             :body (generate-string {:type "FeatureCollection"
                                     :features geojson})})))

  ;; neighborhoods which are not owned by any player.
  (GET "/hoods/open" request
       (friend/authenticated
          (let [logging (log/info (str "/hoods/open"))
                data (k/exec-raw ["
    SELECT amsterdam_polygon.name,amsterdam_polygon.osm_id,
           ST_AsGeoJSON(ST_Transform(amsterdam_polygon.way,4326)) AS polygon,
           vc_user.id AS player,vc_user.email AS email,
           admin_level
      FROM amsterdam_polygon
 LEFT JOIN owned_locations
        ON (owned_locations.osm_id = amsterdam_polygon.osm_id)
 LEFT JOIN vc_user
        ON (owned_locations.user_id = vc_user.id)
     WHERE (admin_level = '10') 
       AND owned_locations.osm_id IS NULL 
  ORDER BY amsterdam_polygon.name ASC;
"
                                  []] :results)
                geojson (map (fn [hood]
                               {:type "Feature"
                                :geometry (json/read-str (:polygon hood))
                                :properties {:neighborhood (:name hood)
                                             :osm_id (:osm_id hood)
                                             :admin_level (:admin_level hood)}})
                             data)]
            (log/debug (str "geojson:" (clojure.string/join ";" geojson)))
            {:headers {"Content-Type" "application/json;charset=utf-8"}
             :body (generate-string {:type "FeatureCollection"
                                     :features geojson})})))
  
  ;; given an :osm_id, return its polygon (if polygon=true), owner, vocab and tenses.
  ;; polygon is optional and defaults to fals because it increases the size
  ;; of the response so much (makes response about 10x larger), and a client only
  ;; needs that information once assuming osms don't change.
  (GET "/hoods/:osm" request
       (friend/authenticated
        (if-let [osm (Integer. (:osm (:route-params request)))]
          (let [polygon (if (= "true" (:polygon (:params request)))
                          "ST_AsGeoJSON(ST_Transform(amsterdam_polygon.way,4326)) AS polygon,"
                          ""
                          )
                logging (log/info (str "/hoods/" osm))
                data (k/exec-raw [(str "
    SELECT amsterdam_polygon.name,amsterdam_polygon.osm_id,
           vc_user.id AS player,vc_user.email AS email,"
                                  polygon
                                  "
           admin_level, 
           owned_locations.user_id AS owner,
           ARRAY(SELECT item
                   FROM place_vocab
                  WHERE place_vocab.osm_id = amsterdam_polygon.osm_id
                    AND place_vocab.solved_by IS NOT NULL
               ORDER BY item) AS vocab_solved,
           ARRAY(SELECT solved_by
                   FROM place_vocab
                  WHERE place_vocab.osm_id = amsterdam_polygon.osm_id 
                    AND place_vocab.solved_by IS NOT NULL
                ORDER BY item) AS vocab_solvers,
           ARRAY(SELECT item
                   FROM place_tense
                  WHERE place_tense.osm_id = amsterdam_polygon.osm_id
                    AND place_tense.solved_by IS NOT NULL
               ORDER BY item) AS tenses_solved,
           ARRAY(SELECT solved_by
                   FROM place_tense
                  WHERE place_tense.osm_id = amsterdam_polygon.osm_id
                    AND place_tense.solved_by IS NOT NULL
               ORDER BY item) AS tense_solvers,
           ARRAY(SELECT item
                   FROM place_vocab
                  WHERE place_vocab.osm_id = amsterdam_polygon.osm_id
                    AND place_vocab.solved_by IS NULL
               ORDER BY item) AS vocab_unsolved,
           ARRAY(SELECT item
                   FROM place_tense
                  WHERE place_tense.osm_id = amsterdam_polygon.osm_id
                    AND place_tense.solved_by IS NULL
               ORDER BY item) AS tenses_unsolved
      FROM amsterdam_polygon
 LEFT JOIN owned_locations
        ON (owned_locations.osm_id = amsterdam_polygon.osm_id)
 LEFT JOIN vc_user
        ON (owned_locations.user_id = vc_user.id)
     WHERE (admin_level = '10')
       AND amsterdam_polygon.osm_id = ?
")
                                  [osm]] :results)
                geojson (map (fn [hood]
                               (merge
                                (if (= polygon "") {}
                                    {:geometry (json/read-str (:polygon hood))})
                                {:type "Feature"
                                 :properties {:neighborhood (:name hood)
                                              :osm_id (:osm_id hood)
                                              :owner (:owner hood)
                                              :tenses_solved (map str (.getArray (:tenses_solved hood)))
                                              :tense_solvers (map str (.getArray (:tense_solvers hood)))
                                              :tenses_unsolved (map str (.getArray (:tenses_unsolved hood)))
                                              :vocab_solved (map str (.getArray (:vocab_solved hood)))
                                              :vocab_solvers (map str (.getArray (:vocab_solvers hood)))
                                              :vocab_unsolved (map str (.getArray (:vocab_unsolved hood)))
                                              :admin_level (:admin_level hood)}}))
                             data)]
            (log/debug (str "geojson:" (clojure.string/join ";" geojson)))
            {:headers {"Content-Type" "application/json;charset=utf-8"}
             :body (generate-string (first geojson))}))))

  (POST "/move" request
        (friend/authenticated
         ;; 1. deterimine user id
         ;; 2. check if legal move
         ;; 3. update world state
         ;; 4. respond to client about result of their action
         (let [player-id (if-let [id (:id (get-user-from-ring-session
                                           (get-in request [:cookies "ring-session" :value])))]
                           (Integer. id))]
           (if (nil? player-id)
             (do (log/error (str "player-id is null; ring-session: "
                                 (get-in request [:cookies "ring-session" :value])))
                  {:status 302
                   :headers {"Location" (str "/logout?session-expired")}}))
           (let [osm-id (Integer. (:osm (:params request)))]
             (log/info (str "POST /move with osm: " osm-id " and user_id:" player-id))
             (k/exec-raw ["UPDATE player_location 
                              SET osm_id=? 
                            WHERE user_id=? 
                              AND ? IN (SELECT adjacent.osm_id
                                               FROM amsterdam_polygon p1
                                         INNER JOIN amsterdam_polygon adjacent
                                                 ON (p1 != adjacent)
                                                AND p1.admin_level='10'
                                                AND adjacent.admin_level = '10'
                                                AND ST_Touches(p1.way,adjacent.way)
                                                AND p1.osm_id = (SELECT osm_id
                                                                   FROM player_location
                                                                  WHERE user_id=?));" [osm-id player-id osm-id player-id]])
             {:status 302
              :headers {"Location" "/players"}}))))

  (GET "/player/:player" request
       (friend/authenticated
        (if-let [player (:player (:route-params request))]
          (let [player (Integer. player)
                logging (log/info (str "/player/" player))
                data (k/exec-raw ["

     SELECT amsterdam_polygon.name,amsterdam_polygon.osm_id,
            ST_AsGeoJSON(ST_Transform(amsterdam_polygon.way,4326)) AS polygon,
            admin_level,
            vc_user.id AS player,vc_user.email AS email
       FROM amsterdam_polygon
 INNER JOIN owned_locations
         ON (owned_locations.osm_id = amsterdam_polygon.osm_id)
 INNER JOIN vc_user
         ON (owned_locations.user_id = vc_user.id)
      WHERE (admin_level = '10')
        AND vc_user.id = ?
   ORDER BY amsterdam_polygon.name ASC;
"
                                  [player]] :results)
                geojson (map (fn [hood]
                               {:type "Feature"
                                :geometry (json/read-str (:polygon hood))
                                :properties {:neighborhood (:name hood)
                                             :osm_id (:osm_id hood)
                                             :admin_level (:admin_level hood)}})
                             data)]
            (log/debug (str "geojson:" (clojure.string/join ";" geojson)))
            {:headers {"Content-Type" "application/json;charset=utf-8"}
             :body (generate-string {:type "FeatureCollection"
                                     :features geojson})}))))  
  (GET "/players" request
       (friend/authenticated
        (let [player-id (if-let [id (:id (get-user-from-ring-session
                                          (get-in request [:cookies "ring-session" :value])))]
                          (Integer. id))
              
              logging (log/info "/players")
              
              create-if-needed
              (k/exec-raw ["INSERT INTO player_location (osm_id,user_id) 
                                 SELECT ?,?
                       WHERE NOT EXISTS (SELECT 1 
                                           FROM player_location
                                          WHERE user_id=?) LIMIT 1"
                           [-5452709 player-id player-id]])
              ;; TODO: ^^ choose a random location rather than fixed to Colonna.

              data (k/exec-raw ["
    SELECT vc_user.given_name AS player_name,vc_user.id AS user_id,
           amsterdam_polygon.name AS location_name,amsterdam_polygon.osm_id AS neighborhood_osm,
           ST_AsGeoJSON(ST_Transform(ST_Centroid(amsterdam_polygon.way),4326)) AS centroid,
           owned.count AS places_count,COALESCE(points_per_player.points,'0') AS points
      FROM vc_user
INNER JOIN player_location ON (player_location.user_id = vc_user.id)
INNER JOIN amsterdam_polygon 
        ON (player_location.osm_id = amsterdam_polygon.osm_id)
 LEFT JOIN (SELECT user_id AS player_id,count(*) FROM owned_locations GROUP BY player_id) AS owned
        ON (owned.player_id = vc_user.id)
 LEFT JOIN (SELECT player_id,SUM(points) AS points FROM place_points GROUP BY player_id) AS points_per_player
        ON (points_per_player.player_id = vc_user.id)
  ORDER BY vc_user.id
"
                                []] :results)
              geojson {:type "FeatureCollection"
                       :features
                       (map (fn [player]
                              {:type "Feature" ;; intention of this feature: show a player marker.
                               :geometry (json/read-str (:centroid player))
                               :properties {:player (:player_name player)
                                            :osm (:neighborhood_osm player)
                                            :neighborhood (:location_name player)
                                            :points (:points player)
                                            :places_count (:places_count player)
                                            :player_id (:user_id player)}})
                            data)}]
          {:headers {"Content-Type" "application/json;charset=utf-8"}
           :body (generate-string geojson)})))

  ;; use GET for incremental parsing after user presses space (or if doing speech recognition, pauses).
  (GET "/say/:expr" request
       (let [expr (:expr (:route-params request))
             response (respond expr)]
         (log/info (str "GET /say/" expr ": tenses:" (:tenses response) "; vocab:" (:vocab response)))
         {:status 200
          :headers {"Content-Type" "application/json;charset=utf-8"
                    "Cache-Control" "public,max-age=600"} ;; 10 minute client cache to start
          :body (generate-string response)}))
       
  ;; use POST for final-answer parsing (after pressing return).
  (POST "/say" request
        (friend/authenticated
         (let [player-id (if-let [id (:id (get-user-from-ring-session
                                           (get-in request [:cookies "ring-session" :value])))]
                           (Integer. id))
               expr (:expr (:params request))
               response (respond expr)]
           (log/info (str "POST /say " expr ": tenses:" (:tenses response) "; vocab:" (:vocab response)))
           ;; add place_tense: item= and solved_by= for all tenses found:
           (update-db-on-response player-id response)
           {:status 200
            :headers {"Content-Type" "application/json;charset=utf-8"}
            :body (generate-string response)})))

  (GET "/vocab" request
       (friend/authenticated
        (let [data (k/exec-raw ["
SELECT * FROM place_vocab
"
                                []] :results)]
          {:status 200
           :headers {"Content-Type" "application/json;charset=utf-8"
                     "Cache-Control" "public,max-age=600"} ;; 10 minute client cache to start
           :body (generate-string data)})))
  )

(defn player2osm [player-id]
  (->
   (k/exec-raw
    ["SELECT osm_id AS osm
        FROM player_location 
       WHERE user_id=?"
     [player-id]] :results)
   first
   :osm))

(defn is-enemy? [player-id osm]
  (let [results (k/exec-raw ["SELECT 1 FROM owned_locations WHERE osm_id=? AND user_id != ?"
                             [osm player-id]] :results)]
    (not (empty? results))))

(defn is-contested? [osm]
  (let [results (k/exec-raw ["SELECT 1 FROM contested_locations WHERE osm_id=?"
                             [osm]] :results)]
    (not (empty? results))))

(defn update-db-on-response [player-id response]
  "update database based on response and player-id."
  ;; TODO: use sql "RETURNING" to return useful results from UPDATEs and INSERTs.
  (log/info (str "response: " response))
  (let [osm           (player2osm player-id)
        is-enemy?     (is-enemy? player-id osm)
        is-contested? (is-contested? osm)]
    (log/info (str "update-db-on-reponse: player_id=" player-id ";osm=" osm "; response=" response "; is-enemy?=" is-enemy?))
    (cond
      (nil? (:expr response))   (log/warn (str "(:expr response) was unexpectedly null."))
      (empty? (:expr response)) (log/warn (str "(:expr response) was unexpectedly empty."))
      (or (empty? (:vocab response))
          (empty? (:tenses response)))
      (log/warn (str "response: '" (:expr response) "' could not be parsed: ignoring."))

      true
      ;; insert the new sentence if it doesn't already exist (WHERE NOT EXISTS) for this place's osm.
      (do
        (log/info (str "inserting: '" (:expr response) "' into the 'place_expression' table."))
        (k/exec-raw ["INSERT INTO place_expression (osm_id,expr,created_by) 
                           SELECT ?,?,? 
                            WHERE NOT EXISTS (SELECT 1 
                                                FROM place_expression 
                                               WHERE expr=? AND osm_id = ?) LIMIT 1"
                     [osm (:expr response) player-id (:expr response) osm]])))
    (cond
      (or is-enemy? is-contested?)
      ;; TODO: wrap all UPDATEs in a transaction.
      (let [points
            (k/exec-raw ["INSERT INTO place_points (osm_id,player_id,points)
                               SELECT ?,?,?"
                         [osm player-id
                          (* (count (:expr response))
                             (+ (count (:vocab response))
                             (+ (count (:tenses response)))))]])

            vocab-updated
            (count
             (map (fn [vocab]
                    (let [vocab-results
                          (k/exec-raw ["UPDATE place_vocab
                                           SET solved_by=? 
                                         WHERE id = (SELECT id 
                                                       FROM place_vocab 
                                                      WHERE osm_id=? 
                                                        AND item=?
                                                        AND solved_by != ?
                                                      LIMIT 1)"
                                       [player-id osm vocab player-id]])]
                      (log/info (str "update-on-enemy results:" vocab-results))))
                  (:vocab response)))
            tense-updated
            (count
             (map (fn [tense]
                    (let [tense-results
                          (k/exec-raw ["UPDATE place_tense
                                           SET solved_by=? 
                                         WHERE id = (SELECT id
                                                       FROM place_tense
                                                      WHERE osm_id=? 
                                                        AND item=?
                                                        AND solved_by != ?
                                                      LIMIT 1)"
                                       [player-id osm tense player-id]])]
                      (log/info (str "update-on-enemy results:" tense-results))))
                  (:tenses response)))]
        {:vocab-updated vocab-updated
         :tense-updated tense-updated})

      true ;; TODO: wrap both INSERTs in a transaction.
      {:points
       (do
         (k/exec-raw ["INSERT INTO place_points (osm_id,player_id,points)
                          SELECT ?,?,?"
                      [osm player-id
                       (* (count (:expr response))
                          (+ (count (:vocab response))
                             (+ (count (:tenses response)))))]]))
       :tenses-inserted
       (count (map (fn [tense]
                     (let [tense-results
                           (k/exec-raw ["INSERT INTO place_tense
                                        (solved_by,item,osm_id)
                                           SELECT ?,?,?"
                                        [player-id tense osm]])]
                       (log/info (str "results: " (string/join ";" tense-results)))))
                   (:tenses response)))
       :vocab-inserted
       (count (map (fn [vocab]
                     (let [vocab-results
                           (k/exec-raw ["INSERT INTO place_vocab
                                        (solved_by,item,osm_id)
                                           SELECT ?,?,?"
                                        [player-id vocab osm]])]
                       (log/info (str "results: " (string/join ";" vocab-results)))))
                   (:vocab response)))})))

(defn respond [expr]
  (let [analyses (parse expr)
        parses (mapcat :parses analyses)
        response
        (reduce conj
                {:expr (string/lower-case (string/trim expr))}
                [(let [vocab (set (remove nil? (mapcat (fn [parse]
                                                         (map root-form (leaves parse)))
                                                       parses)))]
                   (if (empty? vocab) {} {:vocab vocab}))
                 (let [tenses (set (remove nil? (map (fn [parse]
                                                       (cond
                                                         (and 
                                                          (= (u/get-in parse [:synsem :sem :tense])
                                                             :past)
                                                          (= (u/get-in parse [:synsem :sem :aspect])
                                                             :perfect))
                                                         "p. prossimo"

                                                         (= (u/get-in parse [:synsem :sem :tense])
                                                            :present)
                                                         "present"

                                                         (= (u/get-in parse [:synsem :sem :tense])
                                                            :future)
                                                         "futuro"

                                                         true
                                                         nil))
                                                     parses)))]
                   (if (empty? tenses) {} {:tenses tenses}))])]
    (log/info (str "user said:" expr "; response: " response))
    response))

(defn root-form [word]
  (or (u/get-in word [:italiano :root])
      (u/get-in word [:italiano])))

