(ns gameserver.view.auth.google
  (:require [cemerick.friend [workflows :as workflows]]
            [cemerick.friend :as friend]
            [clojure.data.json :as json]
            [clojure.tools.logging :as log]
            [environ.core :refer [env]]
            [friend-oauth2.util :refer [format-config-uri]]
            [friend-oauth2.workflow :as oauth2]
            [gameserver.util.session :as session]
            [gameserver.middleware.session :refer [get-ring-session]]
            [gameserver.view.auth.users :as users]
            [korma.core :as k]
            [org.httpkit.client :as http]))

(declare insert-session)
(declare is-authenticated)
(declare token2username)

(if-let [google-client-id (env :google-client-id)]
  (log/info (str "google authentication configured client-id:" google-client-id)))

(if-let [google-callback-domain (env :google-callback-domain)]
  (log/info (str "google callback-domain: " google-callback-domain)))

;; potential bug scenario:
;; you have a google token
;; you can't find the username for that token:
;; how do you handle this inconsistency?
(defn credential-fn [token]
  ;;lookup token in DB or whatever to fetch appropriate :roles
  (log/info (str "google/credential-fn token: " token))
  (let [username (token2username (-> token :access-token))]
    (log/info (str "token2username returned: " username))
    (session/set-user! username)
    ;; TODO: for now, google-authenticated users cannot be admins: instead, need to use postgres to define per-user roles.
    {:identity token :roles #{:auth/user}}))

(def client-config
  {:client-id (env :google-client-id)
   :client-secret (env :google-client-secret)
   :callback {:domain (env :google-callback-domain)
              :path "/oauth2callback"}})

(def uri-config
  {:authentication-uri {:url "https://accounts.google.com/o/oauth2/auth"
                        :query {:client_id (:client-id client-config)
                                :response_type "code"
                                :redirect_uri (format-config-uri client-config)
                                :scope "email"}}

   :access-token-uri {:url "https://accounts.google.com/o/oauth2/token"
                      :query {:client_id (:client-id client-config)
                              :client_secret (:client-secret client-config)
                              :grant_type "authorization_code"
                              :redirect_uri (format-config-uri client-config)}}})

(def auth-config {:client-config client-config
                  :uri-config uri-config
                  :credential-fn credential-fn})

(defn token2info [access-token]
  (first (k/exec-raw [(str "SELECT vc_user.* 
                              FROM vc_user
                        INNER JOIN session
                                ON (vc_user.id = session.user_id)
                             WHERE session.access_token=?")
                      [access-token]]
                     :results)))

(defn request2cookie [request]
  "get the cookie (if any) embedded at a certain path within the request params."
  (if (and request
           (:cookies request)
           (get (:cookies request) "ring-session"))
    (:value (get (:cookies request) "ring-session"))))

(defn insert-session-if-none
  ([session]
     (if (nil? session)
       (log/warn (str "session was unexpectedly null."))

       (let [session-row (first (k/exec-raw ["SELECT session.*
                                                FROM session 
                                               WHERE ring_session = ?::uuid" [session]] :results))
             debug (log/trace (str "insert-session-if-none: ring-session:" session))
             ]
         (if (not session-row)
           (insert-session session)))))
  
  ([session access-token user-id]
     (let [sql-only (log/debug (str "SQL ONLY: "
                                   (k/sql-only ["SELECT session.*
                                                   FROM session 
                                                  WHERE ring_session = ?::uuid
                                                    AND access_token = ?
                                                    AND user_id = ?" [session access-token user-id]])))
           session-row (first (k/exec-raw ["SELECT session.*
                                              FROM session 
                                             WHERE ring_session = ?::uuid
                                               AND access_token = ?
                                               AND user_id = ?" [session access-token user-id]] :results))
           debug (log/trace (str "insert-session-if-none: session:" session))
           ]
       (if (not session-row)
         (insert-session user-id access-token)))))

;; TODO: factor out update/insert into separate function with more representative names
(defn token2username [access-token]
  "Get user's email address from the vc_user table, given their access token. 
   If access-token is not registered in database,
   then ask Google for the user's email address and add as new row to the vc_user table.
"
  (cond
   (nil? access-token)
   (do
     (log/error "token2user: supplied access-token was null.")
     (throw (Exception. (str "token2user: supplied access-token was null."))))

   true
   (let [debug (log/info (str "token2username: access-token: " access-token))
         user-by-access-token
         (first (k/exec-raw [(str "SELECT email,session.user_id AS userid
                                    FROM vc_user 
                              INNER JOIN session
                                      ON (vc_user.id = session.user_id) 
                                     AND session.access_token=?")
                             [access-token]] :results))]
     (if user-by-access-token
       (let [email (:email user-by-access-token)
             user-id (:userid user-by-access-token)
             ring-session (get-ring-session)]
         (log/debug (str "found user by access-token in Postgres vc_user database: email: " email))
         (log/info (str "found user by access-token, and currently the ring-session is: " ring-session))
         (insert-session-if-none ring-session access-token user-id)
         email)

       ;; else, user could not be found locally by searching the 'session' table access token, so get user's info from google by using the access-token.
       (do
         (log/info (str "User's access-token is not yet in database: querying: https://www.googleapis.com/oauth2/v1/userinfo?access_token=<input access token> to obtain user info."))
         (let [{:keys [status headers body error] :as resp}
               ;; :keys destructures into HTTP-specific parts the Google response to the following URL:
               @(http/get 
                 (str "https://www.googleapis.com/oauth2/v1/userinfo?access_token=" access-token))]
           (cond error
                 (log/warn (str "Failed to GET "
                                "https://www.googleapis.com/oauth2/v1/userinfo?access_token=" access-token
                                " : " error))
                 
                 (not (= status 200))
                 (do
                   (log/error (str "Received a non-200 status from Google: status=" status))
                   (log/error (str "Received a non-200 status from Google: body=" body))
                   nil)
                 
                 true
                 (do
                   (log/debug (str "response from Google: " body))
                   (let [body (json/read-str body
                                             :key-fn keyword
                                             :value-fn (fn [k v]
                                                         v))
                         email (get body :email)
                         given-name (get body :given_name)
                         family-name (get body :family_name)
                         picture (get body :picture)]
                     (log/debug (str "Google says user's email is: " email))
                     (log/debug (str "Google says user's given_name is: " given-name))
                     (log/debug (str "Google says user's family_name is: " family-name))
                     (log/debug (str "Google says user's picture is: " picture))

                     ;; insert a new user record if necessary.
                     (let [user-id (:id (first (k/exec-raw [(str "SELECT id 
                                                                   FROM vc_user 
                                                                  WHERE email=?")
                                                            [email]] :results)))
                           user-id (if user-id
                                     (do
                                       (log/info (str "found existing user record with email="
                                                      email ";user-id=" user-id))
                                       user-id)
                                    
                                     (do
                                       (log/info (str "inserting new user record."))
                                       (:id
                                        (first
                                         (k/exec-raw [(str "INSERT INTO vc_user (given_name,family_name,picture,updated,email)
                                                        VALUES (?,?,?,now(),?) RETURNING id")
                                                      [given-name family-name picture email]] :results)))))]
              
                       ;; insert or update session based on this user_id.
                       (let [session-row (first (k/exec-raw ["SELECT session.*
                                                               FROM vc_user
                                                         INNER JOIN session
                                                                 ON (session.user_id = vc_user.id)
                                                              WHERE vc_user.id=?" [user-id]] :results))

                             ring-session (get-ring-session)]
                         (log/debug (str "calling: insert-session-if-none with userid:" user-id))
                         (insert-session-if-none ring-session
                                                 access-token user-id))
                                                  
                       {:username email
                        :roles #{:gameserver.view.auth.users/user}}))))))))))

;; TODO: move insert-session and token2info, and above insertion code to auth.users, since local authentication needs db-related functionality as well.
(defn insert-session
  ([user-id access-token]
   (let [ring-session (get-ring-session)]
     (if (nil? ring-session)
       (log/warn (str "not inserting session since ring session is nil."))

       ;; else
       (do
         (log/debug (str "inserting new session record (session=" ring-session))
         (log/debug (str "                             (access-token=" access-token))
         (log/debug (str "                             (user-id=" user-id))
         (k/exec-raw [(str "INSERT INTO session (access_token,user_id,ring_session)
                             VALUES (?,?,?::uuid)")
                      [access-token user-id ring-session]]))))))

(defn token2info [access-token]
  (first (k/exec-raw [(str "SELECT vc_user.* 
                              FROM vc_user
                        INNER JOIN session
                                ON (vc_user.id = session.user_id)
                             WHERE session.access_token=?")
                      [access-token]]
                     :results)))

(defn token2picture [access-token]
  (let [token2info (token2info access-token)]
    (if token2info
      (:picture token2info))))
