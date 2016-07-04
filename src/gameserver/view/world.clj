(ns gameserver.view.world
  (:require [cemerick.friend :as friend]
            [clojure.data.json :as json]
            [korma.core :as k]
            [cheshire.core :refer [generate-string]]
            [clojure.tools.logging :as log]
            [compojure.core :refer [defroutes GET POST]]
            [gameserver.view.common :refer [wrap-layout]]
            [stencil.core :as stencil]))

(def sample-world
  {:map
   {:bounding-box [1 2 3 4]
    :regions #{{:name "mission"
                :polygon #{[1 2] [3 4] [5 6] [7 8]}}
               {:name "north beach"
                :polygon #{[9 10] [11 12] [13 14] [15 16]}}
               {:name "chinatown"
                :polygon #{[17 18] [19 20] [21 22]}}
               {:name "financial district"
                :polygon #{[23 24] [25 26] [27 28]}}
               {:name "tenderloin"
                :polygon #{[29 30] [31 32] [33 34]}}}
    :adjacency #{["mission" "tenderloin"]
                 ["tenderloin" "financial district"]
                 ["tenderloin" "chinatown"]
                 ["chinatown" "north beach"]
                 ["financial district" "chinatown"]}}
   :tokens {"mission" #{"questo"}
            "chinatown" #{"cane" "la"}
            "financial district" #{"rosso" "il"}
            "tenderloin" #{"parlare"}}
   :owners {"ekoontz" #{"mission"}
            "franco" #{"north beach" "chinatown"}}
   :location {"ekoontz" "mission"
              "franco" "north beach"}})

(defroutes world-routes
(GET "/world/ui" request
       (friend/authenticated
        (log/debug (str "rendering map page."))
        (wrap-layout "World"
                     (stencil/render-file
                      "gameserver/view/templates/world"
                      {})

                     {:remote-js [{:src "https://api.mapbox.com/mapbox-gl-js/v0.20.1/mapbox-gl.js"}
                                  ;; TODO: use integrity= and crossorigin=
                                  ;; per https://code.jquery.com
                                  {:src "https://code.jquery.com/jquery-1.12.4.min.js"}

                                  ]

                      :remote-css [{:src "https://api.mapbox.com/mapbox-gl-js/v0.20.1/mapbox-gl.css"}]
                      :local-js [{:src "log4.js"}
                                 {:src "player.js"}
                                 {:src "world.js"}]
                      :local-css [{:src "world.css"}]
                      :onload "load_world();"})))
  (GET "/world/hoods" request
       (friend/authenticated
          (let [logging (log/info (str "getting hood data."))
                data (k/exec-raw ["
    SELECT rome_polygon.name,ST_AsGeoJSON(ST_Transform(ST_Centroid(way),4326)) AS centroid,
           vc_user.id AS player,vc_user.email AS email
      FROM rome_polygon
 LEFT JOIN owned_locations
        ON (owned_locations.osm_id = rome_polygon.osm_id)
 LEFT JOIN vc_user
        ON (owned_locations.user_id = vc_user.id)
     WHERE (admin_level = '10') ORDER BY rome_polygon.name ASC;
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

  (GET "/world/move" request
       (friend/authenticated
        (stencil/render-file
         "gameserver/view/templates/move"
         {})))

  ;; TODO: clarify /world/player?player= vs /world/map?player=
  (GET "/world/player" request
       (friend/authenticated
        (if-let [player (:player (:params request))]
          (let [player (Integer. player)
                logging (log/info (str "getting player:" player))
                data (k/exec-raw ["

   SELECT rome_polygon.name,ST_AsGeoJSON(ST_Transform(ST_Centroid(way),4326)) AS centroid,
          vc_user.given_name AS player 
     FROM player_location 
INNER JOIN vc_user ON (player_location.user_id = vc_user.id)
INNER JOIN rome_polygon 
       ON (player_location.osm_id = rome_polygon.osm_id) WHERE user_id=?
"
                                  [player]] :results)
                geojson (map (fn [hood]
                               {:type "Feature"
                                :geometry (json/read-str (:centroid hood))
                                :properties {:player (:player hood)
                                             :neighborhood (:name hood)}
                                }
                               )
                             data)]
            (log/debug (str "geojson:" (clojure.string/join ";" geojson)))
            {:headers {"Content-Type" "application/json;charset=utf-8"}
             :body (generate-string (first geojson))}))))
  
  ;; given a player, return the set of neighborhoods that are owned by that player.
  (GET "/world/map" request
       (friend/authenticated
        (let [player (if-let [player (:player (:params request))]
                       (Integer. player)
                       0)
              logging (log/info (str "getting turf for player: " player))
              owns-data
              (k/exec-raw ["

     SELECT name,admin_level,
            ST_AsGeoJSON(ST_Transform(hood.way,4326)) AS geometry

       FROM rome_polygon AS hood
 INNER JOIN owned_locations 
         ON (hood.osm_id = owned_locations.osm_id)
        AND (owned_locations.user_id = ?)
"
                           [player]]
                          :results)

              owns-geo {:type "FeatureCollection"
                        :features (map (fn [hood]
                                         {:type "Feature"
                                          :geometry (json/read-str (:geometry hood))
                                          :properties {:name (:name hood)
                                                       :admin_level (:admin_level hood)}})
                                       owns-data)}

              at-data
              (k/exec-raw ["

     SELECT name,admin_level,
            ST_AsGeoJSON(ST_Transform(hood.way,4326)) AS geometry

       FROM rome_polygon AS hood
 INNER JOIN player_location ON (hood.osm_id = player_location.osm_id)
                           AND (player_location.user_id = ?)
"
                           [player]]
                           :results)

              at-geo {:type "Feature"
                      :geometry (json/read-str (:geometry (first at-data)))
                      :properties {:name (:name (first at-data))}}]
          {:headers {"Content-Type" "application/json;charset=utf-8"}
           :body (generate-string
                  {:owns owns-geo
                   :at at-geo})})))
  
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










                   
          

                                 

          
          

                     



