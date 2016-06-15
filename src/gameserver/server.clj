(ns gameserver.server
  (:require  [clojure.string :as string :refer [trim]]
             [ring.adapter.jetty :as jetty]
             [gameserver.app :as app])
  (:gen-class))

(defn start [system]
  (println "The Gameserver is starting..")
  (let [server (jetty/run-jetty (var app/site-handler)
                                {:host (:host system) 
                                 :port (:port system) 
                                 :join? false})]
    (println (str "The Gameserver has started and is "
                  "listening at " (str "http://" (trim (:host system)) ":" (trim (:port system)))))
    server))

(defn stop [instance]
  (when instance
    (.stop instance))
  (println "Server stopped"))
