(ns gameserver.app
  (:require [clojure.core.cache :as cache]
            [compojure.core :refer [context defroutes routes]]
            [compojure.handler :as handler]
            [compojure.route :as route]
            [stencil.loader :as stencil]
            [gameserver.middleware.session :as session-manager]
            [gameserver.middleware.context :as context-manager]

            [gameserver.view.home :refer [home-routes]]
            [gameserver.view.about :refer [about-routes]]
            [gameserver.view.world :refer [world-routes]]

            [gameserver.view.auth :refer [auth-routes authenticate]]

            [gameserver.view.profile :refer [profile-routes]]
            [gameserver.view.settings :refer [settings-routes]]
            [gameserver.view.admin :refer [admin-routes]]
            [friend-oauth2.workflow :as oauth2]
            [cemerick.friend :as friend]))

;;; Initialization
;; Add required code here (database, etc.)
(stencil/set-cache (cache/ttl-cache-factory {}))
;;(stencil/set-cache (cache/lru-cache-factory {}))

;;; Load website routes
;; Add your routes here

;; Ring handler definition
(defroutes site-handler
  (-> (routes about-routes
              admin-routes
              auth-routes
              home-routes
              profile-routes
              settings-routes
              (context "/world" []
                       world-routes)
              (route/resources "/")
              (route/not-found "<h1>Page not found.</h1>"))
      (authenticate)
      (session-manager/put-ring-session)
      (session-manager/wrap-session)
      (context-manager/wrap-context-root-with-handler)
      (handler/site)))

