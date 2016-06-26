(ns gameserver.view.world
  (:require [cemerick.friend :as friend]
            [cheshire.core :refer :all]
            [compojure.core :refer [defroutes GET POST]]
            [stencil.core :as stencil]))

(defroutes world-routes
  (GET "/world" request
       (friend/authenticated
        (generate-string
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
                     "franco" "north beach"}})))

  (GET "/world/move" request
       (friend/authenticated
        (stencil/render-file
         "gameserver/view/templates/move"
         {})))

  (POST "/world/move" request
        (friend/authenticated
         ;; 1. deterimine user id
         ;; 2. check if legal move
         ;; 3. update world state
         (generate-string
          {:user "ekoontz"
           :moved-to "tenderloin"}))))



                   
          

                                 

          
          

                     



