(ns gameserver.view.auth
    (:require [clojure.tools.logging :as log]
              [ring.util.response :as response]
              [compojure.core :refer [defroutes GET POST]]
              [stencil.core :as stencil]
              [gameserver.util.session :as session]
              [gameserver.util.flash :as flash]
              [gameserver.service.db :as db]
              [gameserver.view.common :refer [wrap-context-root wrap-layout authenticated?]]))

(defn- signup-page
  "Render the signup page."
  [request]
  (wrap-layout
   "Sign up"
   (stencil/render-file
    "gameserver/view/templates/signup"
    {})))

(defn- signup
  "Process account creation.
   if success : returns 'ok'
   if error : returns a message to be displayed to the user"
  [request]
  ;; TODO : process sign up and return "ok" if success
  (let [params (:params request)
        username (:username params)
        user {:username username
              :email (:email params)
              :type :user}]
    (if (clojure.string/blank? username)
      "The username can't be blank."
      (if (db/add-user user)
        "ok"
        (str "The username " username " is already used.")))))

(defn- login-page
  "Render the login page."
  [request]
  (wrap-layout
   "Log in"
   (stencil/render-file
    "gameserver/view/templates/login"
    {})))

(defn- auth
  "Initialise session with dummy data."
  [request]
  ;; TODO : replace with the authentication process
  (let [user (db/get-user (-> request
                              :params
                              :username))]
    (when user
      (log/info (str "logging in user: " (-> request :params :username)
                     " (TODO: no password-checking yet)"))
      (session/set-user! (select-keys user [:username :type]))
      user)))

(defn- login
  "Process user login with username/password.
   if success : returns 'ok'
   if error : returns a message to be displayed to the user"
  [request]
  (let [username (-> request :params :username)
        password (-> request :params :password)]
    (do
      (log/info (str "processing login attempt with username: " username))
      (if-let [auth (auth request)]
        (do
          (log/info (str "user with username: " username " sucessfully authenticated."))
          "ok"
          )
        (do
          (log/warn (str "user with username: " username " failed to authenticate."))
          "Sorry: failed to authenticate you.")))))

(defn- reset-pass-page
  "Render the reset password page."
  [request]
  (wrap-layout
   "Reset password"
   (stencil/render-file
    "gameserver/view/templates/reset-pass"
    {})))

(defn- reset-pass
  "Reset the user password.
   if success : returns 'ok'
   if error : returns a message to be displayed to the user"
  [request]
  "ok")

(defn- check-session
  "Check session and returns 'valid' if it is."
  [request]
  (when (authenticated?)
    "valid"))

(defn- logout
  "Process user logout."
  []
  (session/logout)
  (response/redirect (wrap-context-root "/")))

(defroutes auth-routes
  (GET "/signup" request (signup-page request))
  (POST "/signup" request (signup request))
  (GET "/login" request (login-page request))
  (POST "/login" request (login request))
  (GET "/reset-pass" request (reset-pass-page request))
  (POST "/reset-pass" request (reset-pass request))
  (GET "/check-session" request (check-session request))
  (GET "/logout" request (logout)))
