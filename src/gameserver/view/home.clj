(ns gameserver.view.home
    (:require [compojure.core :refer [defroutes GET]]
              [stencil.core :as stencil]
              [gameserver.view.common :refer [wrap-layout authenticated?]]))

(defn- render-home [request]
  (stencil/render-file
   "gameserver/view/templates/home"
   {}))

(defn- render-index [request]
  (stencil/render-file
   "gameserver/view/templates/index"
   {}))

(defn- render-page [request]
  (wrap-layout "Gameserver"
               (if (authenticated?)
                 (render-home request)
                 (render-index request))))

(defroutes home-routes
  (GET "/" request (render-page request)))
