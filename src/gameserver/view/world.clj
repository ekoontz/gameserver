(ns gameserver.view.world
  (:require [cemerick.friend :as friend]
            [clojure.data.json :as json]
            [korma.core :as k]
            [cheshire.core :refer [generate-string]]
            [clojure.tools.logging :as log]
            [compojure.core :refer [defroutes GET POST]]
            [gameserver.util.session :refer [current-user]]
            [gameserver.view.auth.users :refer [get-user-from-ring-session]]
            [gameserver.view.common :refer [wrap-layout]]
            [stencil.core :as stencil]))

(defroutes world-routes
  (GET "/world" request
         (friend/authenticated
          (let [player-id (:id (get-user-from-ring-session
                                (get-in request [:cookies "ring-session" :value])))]
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
                          :remote-css [{:src "https://api.mapbox.com/mapbox-gl-js/v0.20.1/mapbox-gl.css"}]
                          :local-js [{:src "log4.js"}
                                     {:src "mustache.min.js"}
                                     {:src "player.js"}
                                     {:src "world.js"}]
                          :local-css [{:src "world.css"}]
                          :onload (str "load_world('" player-id "');")}))))

  (GET "/world/adjacency" request
       (friend/authenticated
        (let [logging (log/info (str "getting adjacency data."))
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
                          {:name (:n1 row)
                           :adj (map str (.getArray (:adj row)))})
                        rows)]
          {:headers {"Content-Type" "application/json;charset=utf-8"}
           :body (generate-string body)})))

  (GET "/world/hoods" request
       (friend/authenticated
          (let [logging (log/info (str "getting hood data."))
                data (k/exec-raw ["
SELECT rome_polygon.name,
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
          (let [logging (log/info (str "getting hood data."))
                data (k/exec-raw ["
    SELECT rome_polygon.name,
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
                                             :admin_level (:admin_level hood)}})
                             data)]
            (log/debug (str "geojson:" (clojure.string/join ";" geojson)))
            {:headers {"Content-Type" "application/json;charset=utf-8"}
             :body (generate-string {:type "FeatureCollection"
                                     :features geojson})})))

  (GET "/world/move" request
       (friend/authenticated
        (stencil/render-file
         "gameserver/view/templates/move"
         {})))

  (GET "/world/player/:player" request
       (friend/authenticated
        (if-let [player (:player (:route-params request))]
          (let [player (Integer. player)
                logging (log/info (str "/world/player/" player))
                data (k/exec-raw ["

    SELECT rome_polygon.name,
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
                                             :admin_level (:admin_level hood)}})
                             data)]
            (log/debug (str "geojson:" (clojure.string/join ";" geojson)))
            {:headers {"Content-Type" "application/json;charset=utf-8"}
             :body (generate-string {:type "FeatureCollection"
                                     :features geojson})}))))

  (GET "/world/players" request
       (friend/authenticated
        (let [data (k/exec-raw ["

    SELECT vc_user.given_name AS player_name,vc_user.id AS user_id,
           rome_polygon.name AS location_name,rome_polygon.osm_id AS location_osm,
           ST_AsGeoJSON(ST_Transform(ST_Centroid(rome_polygon.way),4326)) AS centroid
      FROM vc_user
INNER JOIN player_location ON (player_location.user_id = vc_user.id)
INNER JOIN rome_polygon 
        ON (player_location.osm_id = rome_polygon.osm_id) 
  ORDER BY rome_polygon.name
"
                                []] :results)
              geojson {:type "FeatureCollection"
                       :features
                       (map (fn [player]
                              {:type "Feature" ;; intention of this feature: show a player marker.
                               :geometry (json/read-str (:centroid player))
                               :properties {:player (:player_name player)
                                            :neighborhood (:location_name player)
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
         (generate-string
          {:user "ekoontz"
           :moved-to "Campo Marzio"
           :request (-> request :params)
           })))
  

  )
