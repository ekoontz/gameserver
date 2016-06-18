(ns gameserver.app
  (:require [clojure.core.cache :as cache]
            [cemerick.friend
             [credentials :as creds]
             [workflows :as workflows]]
            [clojure.tools.logging :as log]
            [friend-oauth2.util :refer [format-config-uri]]
            [org.httpkit.client :as http]
            [clojure.data.json :as json]
            [compojure.core :refer [defroutes routes]]
            [compojure.handler :as handler]
            [compojure.route :as route]
            [environ.core :refer [env]]
            [gameserver.middleware.session :as session-manager]
            [gameserver.middleware.context :as context-manager]
            [gameserver.util.session :as session]
            [stencil.loader :as stencil]))

;;; Initialization
;; Add required code here (database, etc.)
(stencil/set-cache (cache/ttl-cache-factory {}))
;;(stencil/set-cache (cache/lru-cache-factory {}))

;;; Load public routes
(require '[gameserver.view.home :refer [home-routes]]
         '[gameserver.view.about :refer [about-routes]])

;;; Load registration and authentication routes
(require '[gameserver.view.auth :as auth :refer [auth-routes]])

;;; Load generic routes
(require '[gameserver.view.profile :refer [profile-routes]]
         '[gameserver.view.settings :refer [settings-routes]]
         '[gameserver.view.admin :refer [admin-routes]]
         '[friend-oauth2.workflow :as oauth2]
         '[cemerick.friend :as friend])

(def users {"admin" {:username "admin"
                    :password (creds/hash-bcrypt "password")
                    :roles #{::admin}}
            "dave" {:username "dave"
                    :password (creds/hash-bcrypt "password")
                    :roles #{::user}}})

(derive ::admin ::user)

(def client-config
  {:client-id (env :google-client-id)
   :client-secret (env :google-client-secret)
   :callback {:domain (env :google-callback-domain)
              :path "/oauth2callback"}})

(defn token2username [access-token]
  "Get user's email address given their access token."
  (cond
   (nil? access-token)
   (throw (Exception. (str "token2user: supplied access-token was null.")))

   true
   (do
     (log/info (str "looking up username for google access-token: " access-token))
     (let [{:keys [status headers body error] :as resp} 
           @(http/get 
             (str "https://www.googleapis.com/oauth2/v1/userinfo?access_token=" access-token))]
       (cond 
       
         (not (= status 200))
         (do
           nil)
       
         true
         (do
           (let [body (json/read-str body
                                     :key-fn keyword
                                     :value-fn (fn [k v]
                                                 v))
                 email (get body :email)
                 given-name (get body :given_name)
                 family-name (get body :family_name)
                 picture (get body :picture)]
             email)))))))

(def google-auth-config {:client-config client-config
                         :uri-config {:authentication-uri {:url "https://accounts.google.com/o/oauth2/auth"
                                                           :query {:client_id (:client-id client-config)
                                                                   :response_type "code"
                                                                   :redirect_uri (format-config-uri client-config)
                                                                   :scope "email"}}
                                      :access-token-uri {:url "https://accounts.google.com/o/oauth2/token"
                                                         :query {:client_id (:client-id client-config)
                                                                 :client_secret (:client-secret client-config)
                                                                 :grant_type "authorization_code"
                                                                 :redirect_uri (format-config-uri client-config)}}}
                         :credential-fn (fn [token]
                                          (let [username (token2username (:access-token token))]
                                            {:identity username :roles #{::user}}))})
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
       {:credential-fn (partial creds/bcrypt-credential-fn users)
        :workflows [(workflows/interactive-form)
                    (oauth2/workflow google-auth-config)]})
      (session-manager/wrap-session)
      (context-manager/wrap-context-root)
      (handler/site)))


