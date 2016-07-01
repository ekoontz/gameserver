(defproject gameserver "0.1.0-SNAPSHOT"
  :description "FIXME: write description"
  :url "http://example.com/FIXME"
  :license {:name "Eclipse Public License"
            :url "http://www.eclipse.org/legal/epl-v10.html"}
  :dependencies [[clj-http "0.7.3"]
                 [cheshire "5.2.0"] ;; Clojure JSON and JSON SMILE (binary json format) encoding/decoding
                 [ring "1.5.0"]
                 [ring/ring-jetty-adapter "1.5.0"]
                 [org.eclipse.jetty/jetty-server "8.1.19.v20160209"]
                 [compojure "1.5.1"]
                 [http-kit "2.1.16"]
                 [friend-oauth2 "0.1.3"]
                 [korma "0.4.2"]
                 [log4j/log4j "1.2.17"]
                 [org.clojure/clojure "1.8.0"]
                 [org.clojure/tools.logging "0.2.6"]
                 [org.postgresql/postgresql "9.4.1208.jre7"]
                 [stencil "0.3.2"]] ;; A fast, compliant implementation of Mustache in Clojure.
  :profiles {:dev {:dependencies [[org.clojure/tools.namespace "0.2.4"]]
                   :source-paths ["dev"]}}
  :plugins [[cider/cider-nrepl "0.11.0"]
            [lein-ring "0.9.7"]
            ]
  :ring {:handler gameserver.app/site-handler}
  :main gameserver)
