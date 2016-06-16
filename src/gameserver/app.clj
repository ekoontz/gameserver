(ns gameserver.app
  (:require [cemerick.friend.workflows :as workflows]
            [clojure.core.cache :as cache]
            [clojure.tools.logging :as log]
            [compojure.core :refer [defroutes routes]]
            [compojure.handler :as handler]
            [compojure.route :as route]
            [friend-oauth2.workflow :as oauth2]
            [gameserver.middleware.session :as session-manager]
            [gameserver.middleware.context :as context-manager]
            [gameserver.util.session :as session]
            [ring.util.response :as resp]
            [stencil.loader :as stencil]))

;;; Initialization
;; Add required code here (database, etc.)
(stencil/set-cache (cache/ttl-cache-factory {}))
;;(stencil/set-cache (cache/lru-cache-factory {}))


;;; Load public routes
(require '[gameserver.view.home :refer [home-routes]]
         '[gameserver.view.about :refer [about-routes]])

;;; Load registration and authentication routes
(require '[gameserver.view.auth :refer [auth-routes]])

;;; Load generic routes
(require '[gameserver.view.profile :refer [profile-routes]]
         '[gameserver.view.settings :refer [settings-routes]]
         '[gameserver.view.admin :refer [admin-routes]]
         '[friend-oauth2.workflow :as oauth2]
         '[cemerick.friend :as friend])

(defn fun-credential-fn [word]
  (log/info (str "fun-credential-fn: input: " (dissoc word :password))) ;; remove sensitive password before logging.
  (let [username (:username word)]
    (session/set-user! {:username username})
    {:identity word :roles #{::user}}))

;;; Load website routes
;;; Load generic routes
;; Ring handler definition
(defroutes site-handler
  (-> (routes home-routes
              about-routes
              auth-routes
              profile-routes
              settings-routes
              admin-routes
              (route/resources "/")
              (route/not-found "<h1>404 Page not found.</h1>"))

      (friend/authenticate

       {:allow-anon? true
        :unauthorized-handler #(->
                                "unauthorized"
                                resp/response
                                (resp/status 401))

        :workflows [(workflows/interactive-form)]

        :credential-fn fun-credential-fn})

      (session-manager/wrap-session)
      (context-manager/wrap-context-root)
      (handler/site)))
