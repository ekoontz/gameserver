(ns gameserver.service.db
  (:require [clojure.tools.logging :as log]))

;; A simple in-memory database for testing purpose.
(def database (atom {"ekoontz" {:username "ekoontz"
                                :email "ekoontz@hiro-tan.org"
                                :type "admin"
                                :password "password"}}))
(defn get-user
  "Returns the user corresponding to the given username."
  [username]
  (if-let [user-record
           (get @database username)]
    (do
      (log/info (str "found username:" username  " in database."))
      user-record)
    (log/warn (str "did not find username:" username  " in database."))))

(defn add-user
  "Add a new user to database."
  [{:keys [username] :as user}]
  (when (and username
           (not (get-user username)))
    (swap! database assoc (:username user) user)))
