(ns gameserver.view.auth.users
  (:require [cemerick.friend
             [credentials :as creds]]))

;; TODO: replace with postgres store
(def users {"admin" {:username "admin"
                    :password (creds/hash-bcrypt "password")
                    :roles #{::admin}}
            "dave" {:username "dave"
                    :password (creds/hash-bcrypt "password")
                    :roles #{::user}}})

(derive ::admin ::user)

  
