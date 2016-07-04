(ns gameserver.view.world
  (:require [cemerick.friend :as friend]
            [clojure.data.json :as json]
            [korma.core :as k]
            [cheshire.core :refer [generate-string]]
            [clojure.tools.logging :as log]
            [compojure.core :refer [defroutes GET POST]]
            [gameserver.view.common :refer [wrap-layout]]
            [stencil.core :as stencil]))

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
                                  {:src "https://code.jquery.com/jquery-1.12.4.min.js"}]
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










                   
          

                                 

          
          

                     



