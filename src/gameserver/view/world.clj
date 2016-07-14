(ns gameserver.view.world
  (:require [babel.italiano :refer [parse]]
            [cemerick.friend :as friend]
            [clojure.data.json :as json]
            [dag_unify.core :as u]
            [korma.core :as k]
            [cheshire.core :refer [generate-string]]
            [clojure.tools.logging :as log]
            [compojure.core :refer [defroutes GET POST]]
            [gameserver.util.session :refer [current-user]]
            [gameserver.view.auth.users :refer [get-user-from-ring-session]]
            [gameserver.view.common :refer [wrap-layout]]
            [stencil.core :as stencil]))

(declare leaves)
(declare respond)
(declare root-form)

(defroutes world-routes
  (GET "/world" request
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
                                          {:src "https://code.jquery.com/jquery-1.12.4.min.js"}]
                              :remote-css [{:src "https://api.mapbox.com/mapbox-gl-js/v0.20.1/mapbox-gl.css"}
                                           {:src "http://maxcdn.bootstrapcdn.com/font-awesome/4.1.0/css/font-awesome.min.css"}]
                              ;; TODO: consider using http://browserify.org/ to bundle all local js.
                              :local-js [{:src "mustache.min.js"}
                                         {:src "log4.js"}
                                         {:src "config.js"}
                                         ;; these 3 above must remain before others below.
                                         {:src "geolib.js"}
                                         {:src "player.js"}
                                         {:src "placebox.js"}
                                         {:src "actions.js"}
                                         {:src "input.js"}
                                         {:src "world.js"}]
                              :local-css [{:src "placebox.css"}
                                          {:src "player.css"}
                                          {:src "input.css"}
                                          {:src "streetview.css"}
                                          {:src "world.css"}]
                              :onload (str "load_world('" player-id "');")}))))))

  (GET "/world/adjacency" request
       (friend/authenticated
        (let [logging (log/info (str "/world/adjacency"))
              rows (k/exec-raw ["
  SELECT n1.osm_id AS n1,
         ARRAY(SELECT n2.osm_id
                 FROM rome_polygon AS n2
                WHERE n2.admin_level = '10'
                  AND ST_Touches(n1.way,n2.way)
             ORDER BY n2.name) AS adj
    FROM rome_polygon AS n1
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

  (GET "/world/owners" request
       (friend/authenticated
        (let [logging (log/info (str "/world/owners"))
              rows (k/exec-raw ["
SELECT osm_id,user_id AS owner_id FROM owned_locations
"
                                []] :results)]
          {:headers {"Content-Type" "application/json;charset=utf-8"}
           :body (generate-string rows)})))
  
  (GET "/world/hoods" request
       (friend/authenticated
          (let [logging (log/info (str "/world/hoods"))
                data (k/exec-raw ["
SELECT rome_polygon.name,rome_polygon.osm_id,
           ST_AsGeoJSON(ST_Transform(ST_Centroid(rome_polygon.way),4326)) AS centroid,
           vc_user.id AS player,vc_user.email AS email
      FROM rome_polygon
 LEFT JOIN owned_locations
        ON (owned_locations.osm_id = rome_polygon.osm_id)
 LEFT JOIN vc_user
        ON (owned_locations.user_id = vc_user.id)
     WHERE (admin_level = '10') 
  ORDER BY rome_polygon.name ASC
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
  (GET "/world/hoods/open" request
       (friend/authenticated
          (let [logging (log/info (str "/world/hoods/open"))
                data (k/exec-raw ["
    SELECT rome_polygon.name,rome_polygon.osm_id,
           ST_AsGeoJSON(ST_Transform(rome_polygon.way,4326)) AS polygon,
           vc_user.id AS player,vc_user.email AS email,
           admin_level
      FROM rome_polygon
 LEFT JOIN owned_locations
        ON (owned_locations.osm_id = rome_polygon.osm_id)
 LEFT JOIN vc_user
        ON (owned_locations.user_id = vc_user.id)
     WHERE (admin_level = '10') 
       AND owned_locations.osm_id IS NULL 
  ORDER BY rome_polygon.name ASC;
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
  (GET "/world/hoods/:osm" request
       (friend/authenticated
        (if-let [osm (Integer. (:osm (:route-params request)))]
          (let [polygon (if (= "true" (:polygon (:params request)))
                          "ST_AsGeoJSON(ST_Transform(rome_polygon.way,4326)) AS polygon,"
                          ""
                          )
                logging (log/info (str "/world/hoods/" osm))
                data (k/exec-raw [(str "
    SELECT rome_polygon.name,rome_polygon.osm_id,
           vc_user.id AS player,vc_user.email AS email,"
                                  polygon
                                  "
           admin_level, 
           ARRAY(SELECT item
                   FROM place_vocab
                  WHERE place_vocab.osm_id = rome_polygon.osm_id
                    AND place_vocab.solved_by IS NOT NULL
               ORDER BY item) AS vocab_solved,
           ARRAY(SELECT solved_by
                   FROM place_vocab
                  WHERE place_vocab.osm_id = rome_polygon.osm_id 
                    AND place_vocab.solved_by IS NOT NULL
                ORDER BY item) AS vocab_solvers,
           ARRAY(SELECT item
                   FROM place_tense
                  WHERE place_tense.osm_id = rome_polygon.osm_id
                    AND place_tense.solved_by IS NOT NULL
               ORDER BY item) AS tenses_solved,
           ARRAY(SELECT solved_by
                   FROM place_tense
                  WHERE place_tense.osm_id = rome_polygon.osm_id
                    AND place_tense.solved_by IS NOT NULL
               ORDER BY item) AS tense_solvers,
           ARRAY(SELECT item
                   FROM place_vocab
                  WHERE place_vocab.osm_id = rome_polygon.osm_id
                    AND place_vocab.solved_by IS NULL
               ORDER BY item) AS vocab_unsolved,
           ARRAY(SELECT item
                   FROM place_tense
                  WHERE place_tense.osm_id = rome_polygon.osm_id
                    AND place_tense.solved_by IS NULL
               ORDER BY item) AS tenses_unsolved
      FROM rome_polygon
 LEFT JOIN owned_locations
        ON (owned_locations.osm_id = rome_polygon.osm_id)
 LEFT JOIN vc_user
        ON (owned_locations.user_id = vc_user.id)
     WHERE (admin_level = '10')
       AND rome_polygon.osm_id = ?
")
                                  [osm]] :results)
                geojson (map (fn [hood]
                               (merge
                                (if (= polygon "") {}
                                    {:geometry (json/read-str (:polygon hood))})
                                {:type "Feature"
                                 :properties {:neighborhood (:name hood)
                                              :osm_id (:osm_id hood)
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

  (GET "/world/player/:player" request
       (friend/authenticated
        (if-let [player (:player (:route-params request))]
          (let [player (Integer. player)
                logging (log/info (str "/world/player/" player))
                data (k/exec-raw ["

    SELECT rome_polygon.name,rome_polygon.osm_id,
           ST_AsGeoJSON(ST_Transform(rome_polygon.way,4326)) AS polygon,
           admin_level,
           vc_user.id AS player,vc_user.email AS email
      FROM rome_polygon
 INNER JOIN owned_locations
        ON (owned_locations.osm_id = rome_polygon.osm_id)
 INNER JOIN vc_user
        ON (owned_locations.user_id = vc_user.id)
     WHERE (admin_level = '10')
       AND vc_user.id = ?
  ORDER BY rome_polygon.name ASC;
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

  (GET "/world/players" request
       (friend/authenticated
        (let [logging (log/info "/world/players")
              data (k/exec-raw ["

    SELECT vc_user.given_name AS player_name,vc_user.id AS user_id,
           rome_polygon.name AS location_name,rome_polygon.osm_id AS neighborhood_osm,
           ST_AsGeoJSON(ST_Transform(ST_Centroid(rome_polygon.way),4326)) AS centroid,
           owned.count AS places_count
      FROM vc_user
INNER JOIN player_location ON (player_location.user_id = vc_user.id)
INNER JOIN rome_polygon 
        ON (player_location.osm_id = rome_polygon.osm_id)
INNER JOIN (SELECT user_id AS player_id,count(*) FROM owned_locations  GROUP BY player_id) AS owned
        ON (owned.player_id = vc_user.id)
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
                                            :places_count (:places_count player)
                                            :player_id (:user_id player)}})
                            data)}]
          {:headers {"Content-Type" "application/json;charset=utf-8"}
           :body (generate-string geojson)})))

  (POST "/world/move" request
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
             (log/info (str "POST /world/move with osm: " osm-id " and user_id:" player-id))
             (k/exec-raw ["UPDATE player_location 
                              SET osm_id=? 
                            WHERE user_id=? 
                              AND ? IN (SELECT adjacent.osm_id
                                               FROM rome_polygon p1
                                         INNER JOIN rome_polygon adjacent
                                                 ON (p1 != adjacent)
                                                AND p1.admin_level='10'
                                                AND adjacent.admin_level = '10'
                                                AND ST_Touches(p1.way,adjacent.way)
                                                AND p1.osm_id = (SELECT osm_id
                                                                   FROM player_location
                                                                  WHERE user_id=?));" [osm-id player-id osm-id player-id]])
             {:status 302
              :headers {"Location" "/world/players"}}))))

  ;; use GET for incremental parsing after user presses space (or if doing speech recognition, pauses).
  (GET "/world/say/:expr" request
       (let [expr (:expr (:route-params request))]
         {:status 200
          :headers {"Content-Type" "application/json;charset=utf-8"
                    "Cache-Control" "public,max-age=600"} ;; 10 minute client cache to start
          :body (generate-string (respond expr))}))

  ;; use POST for final-answer parsing (after pressing return).
  (POST "/world/say" request
        (friend/authenticated
         (let [player-id (if-let [id (:id (get-user-from-ring-session
                                           (get-in request [:cookies "ring-session" :value])))]
                           (Integer. id))
               expr (:expr (:params request))]
           {:status 200
            :headers {"Content-Type" "application/json;charset=utf-8"}
            :body (generate-string (respond expr))}))))

(defn respond [expr]
  (let [analyses (parse expr)
        parses (mapcat :parses analyses)
        response
        (reduce conj
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
  (cond (not (= :none (u/get-in word [:italiano :infinitive] :none)))
        (u/get-in word [:italiano :infinitive])

        (string? (u/get-in word [:italiano :italiano]))
        (u/get-in word [:italiano :italiano])

        true
        "??"))

(defn leaves [parse-tree]
  "return terminal nodes (leaves) for this tree."
  (let [head (u/get-in parse-tree [:head] :none)
        comp (u/get-in parse-tree [:comp] :none)]
  (cond
    (and (= :none head)
         (= :none comp))
    [parse-tree]

    (= :none head)
    (leaves comp)

    (= :none comp)
    (leaves head)
    
    true
    (concat
     (leaves head)
     (leaves comp)))))
