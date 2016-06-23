(ns gameserver.app
  (:require [clojure.core.cache :as cache]
            [compojure.core :refer [defroutes routes]]
            [compojure.handler :as handler]
            [compojure.route :as route]
            [stencil.loader :as stencil]
            [cemerick.friend
             [workflows :as workflows]
             [credentials :as creds]]
            [friend-oauth2.workflow :as oauth2]
            [gameserver.middleware.session :as session-manager]
            [gameserver.middleware.context :as context-manager]
            [ring.util.response :as resp]))

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

;;; Load website routes
;; Add your routes here

(def users {"admin" {:username "admin"
                    :password (creds/hash-bcrypt "password")
                    :roles #{::admin}}
            "dave" {:username "dave"
                    :password (creds/hash-bcrypt "password")
                    :roles #{::user}}})

(derive ::admin ::user)

;; Ring handler definition
(defroutes site-handler
  (-> (routes home-routes
              about-routes
              auth-routes
              profile-routes
              settings-routes
              admin-routes
              (route/resources "/")
              (route/not-found "<h1>Page not found.</h1>"))

      (friend/authenticate
       {:allow-anon? true
        :login-uri "/login"
        :default-landing-uri "/"
        :unauthorized-handler #(->
                                "unauthorized"
                                resp/response
                                (resp/status 401))
        :workflows [
                    (workflows/interactive-form)
                    ]
        :credential-fn (partial creds/bcrypt-credential-fn users)
        })
      (session-manager/wrap-session)
      (context-manager/wrap-context-root-with-handler)
      (handler/site)))
