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
  (GET "/world" request
       (friend/authenticated
        (generate-string sample-world)))

  (GET "/world/ui" request
       (friend/authenticated
        (log/debug (str "rendering map page."))
        (wrap-layout "World"
                     (stencil/render-file
                      "gameserver/view/templates/world"
                      {})
                     ;; add specific CSS and JS for map-containing HTML.
                     {:remote-js [{:src "http://cdn.leafletjs.com/leaflet/v0.7.7/leaflet.js"}
                                  {:src "http://api.tiles.mapbox.com/mapbox.js/plugins/turf/v2.0.0/turf.min.js"}]
                      :local-js [{:src "log4.js"}
                                 {:src "roma.js"}
                                 {:src "world.js"}]
                      :onload "load_world();"
                      :local-css [{:src "world.css"}]
                      :remote-css [{:src "http://cdn.leafletjs.com/leaflet/v0.7.7/leaflet.css"}]})))

  (GET "/world/move" request
       (friend/authenticated
        (stencil/render-file
         "gameserver/view/templates/move"
         {})))

  (GET "/world/map" request
       (friend/authenticated
        (let [data
              (k/exec-raw ["
SELECT name,admin_level,ST_AsGeoJSON(ST_Transform(hood.way,4326)) AS geometry
  FROM rome_polygon AS hood
 WHERE name='Sallustiano'
    OR name='Castro Pretorio';
" []] :results)
              ;; TODO: we are reading json into edn, then writing it back to
              ;; json: inefficient to do that.
              data (map (fn [hood]
                          {:properties {:name (:name hood)
                                        :admin_level (:admin_level hood)}
                           :type "Feature"
                           :geometry (json/read-str (:geometry hood))})
                        data)]
          (generate-string
           {:type "FeatureCollection"
            :features data}))))
  
  (POST "/world/move" request
        (friend/authenticated
         ;; 1. deterimine user id
         ;; 2. check if legal move
         ;; 3. update world state
         ;; 4. respond to client about result of their action
         (generate-string
          {:user "ekoontz"
           :moved-to "tenderloin"
           :request (-> request :params)
           }))))




                   
          

                                 

          
          

                     



