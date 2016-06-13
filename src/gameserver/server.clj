(ns gameserver.server
  (:require [ring.adapter.jetty :as jetty]
            [gameserver.app :as app])
  (:gen-class))

(defn start [system]
  (println "GS server start..")
  (let [server (jetty/run-jetty (var app/site-handler)
                                {:host (:host system) 
                                 :port (:port system) 
                                 :join? false})]
    (println "GS started.")
    (println (str "GS listening at http://" (:host system) ":" (:port system)))
    server))

(defn stop [instance]
  (when instance
    (.stop instance))
  (println "Server stopped"))
