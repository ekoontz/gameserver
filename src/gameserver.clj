(ns gameserver
  (:require [gameserver.server :as server]))

(defn system
  "Gives the default parameters for the system to run."
  []
  {:host "amsterdam.hiro-tan.org"
   :port 3000
   :server nil})

(defn start
  "Start the system."
  [system]
  (println "system:" system)
  (let [server (server/start system)]
    (assoc system :server server)))

(defn stop
  "Stop the system."
  [system]
  (-> system
      :server
      server/stop))

(defn- set-config
  "Set a custom system parameter."
  [system k v]
  (if v
    (assoc system k v)
    system))

(defn -main
  "Launch server with optional parameters (host, port)."
  [& {:as args}]
  (let [{:keys [host port]} (clojure.walk/keywordize-keys args)]
    (-> (system)
        (set-config :host host)
        (set-config :port (Integer/parseInt port))
        start)))

