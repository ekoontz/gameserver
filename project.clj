(defproject gameserver "0.1.0-SNAPSHOT"
  :description "Verbcoach Gameserver"
  :url "http://game.verbcoach.com/"
  :license {:name "Eclipse Public License"
            :url "http://www.eclipse.org/legal/epl-v10.html"}
  :dependencies [[org.clojure/clojure "1.8.0"]
                 [cheshire "5.2.0"] ;; Clojure JSON and JSON SMILE (binary json format) encoding/decoding
                 [clj-http "2.2.0"]
                 [com.cemerick/friend "0.2.3"]
                 [compojure "1.1.3"]
                 [environ "1.0.0"]
                 [friend-oauth2 "0.1.3"]
                 [http-kit "2.1.16"]
                 [korma "0.4.1"]
                 [log4j/log4j "1.2.17"]

                 ;; TODO: org.clojure/data.json is only used by
                 ;; gameserver.view.auth.google: consider using one or the other
                 ;; (i.e. org.clojure/data.json or cheshire) if possible, to avoid dependency bloat.
                 [org.clojure/data.json "0.2.5"] 

                 [org.clojure/tools.logging "0.2.6"]
                 [org.postgresql/postgresql "9.4.1208.jre7"]
                 [ring "1.2.0"]
                 [slingshot "0.12.2"]
                 [stencil "0.3.2"]] ;; A fast, compliant implementation of Mustache in Clojure.
  :profiles {:dev {:dependencies [[org.clojure/tools.namespace "0.2.4"]]
                   :source-paths ["dev"]}}
  :plugins [[cider/cider-nrepl "0.11.0"]
            [lein-ring "0.9.7"]]
  :ring {:handler gameserver.app/site-handler}
  :main gameserver)
