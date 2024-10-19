(ns gameserver.service.db
  (:require [clojure.tools.logging :as log]
            [korma.db :refer [defdb postgres]]
            [environ.core :refer [env]]
            [clojure.string :as string]))

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

(defdb korma-db
  (let [default "postgres://amsterdam@localhost:5432/amsterdam"
        database-url (cond
                      (env :database-url)
                      (env :database-url)

                      true default
                      true
                      (do
                        (log/error
                         (str "DATABASE_URL not set in your environment: you must define it; e.g.: " default)
                         (throw (Exception. (str "could not find database name in your database-url."))))))]
    ;; this constructs the actual database connection which is used throughout the code base.
    (postgres
     ;; thanks to Jeroen van Dijk via http://stackoverflow.com/a/14625874
     (let [[_ user password host port db]
           (re-matches #"postgres://(?:([^:]+):?(.*)@)?([^:]+)(?::(\d+))?/(.+)"
                       database-url)

           redacted-database-url
           (if (and password (not (empty? password)))
             (string/replace database-url
                             (str ":" password)
                             ":******")
             database-url)
           ]
       (if (nil? db)
         (throw (Exception. (str "could not find database name in your database-url: '"
                                 database-url "'"))))

       (log/info (str "scanned DATABASE_URL:" redacted-database-url "; found:"
                      "(user,host,db)=(" user "," host "," db ")"))
             {:db db
              :user user
              :password password
              :host host
              :port (or port "5432")}))))
