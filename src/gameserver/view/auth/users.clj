(ns gameserver.view.auth.users
  (:require [cemerick.friend
             [credentials :as creds]]
            [korma.core :as k]))

;; TODO: replace with postgres store
(def users {"admin" {:username "admin"
                    :password (creds/hash-bcrypt "password")
                    :roles #{::admin}}
            "dave" {:username "dave"
                    :password (creds/hash-bcrypt "password")
                    :roles #{::user}}})

(derive ::admin ::user)

(defn get-user-from-ring-session [ring-session]
  (first (k/exec-raw [(str "SELECT vc_user.* 
                              FROM vc_user
                        INNER JOIN session
                                ON (vc_user.id = session.user_id)
                             WHERE ring_session=?::uuid")
                     [ring-session]] :results)))
  
