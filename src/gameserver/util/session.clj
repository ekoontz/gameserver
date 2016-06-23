(ns gameserver.util.session
    (:refer-clojure :exclude [get])
    (:require [gameserver.middleware.session :as session-manager]))

(defn put!
  [key value]
  (session-manager/session-put! key value))

(defn get
  [key]
  (session-manager/session-get key))

(defn set-user! 
  [user]
  (put! :user user))

(defn current-user
  "Retrieve current user"
  []
  (session-manager/session-get :current))

(defn logout
  "Reset session"
  []
  (session-manager/session-clear))
