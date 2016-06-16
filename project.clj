(defproject gameserver "0.1.0-SNAPSHOT"
  :description "FIXME: write description"
  :url "http://example.com/FIXME"
  :license {:name "Eclipse Public License"
            :url "http://www.eclipse.org/legal/epl-v10.html"}
  :dependencies [[org.clojure/clojure "1.8.0"]
                 [friend-oauth2 "0.1.3"]
                 [ring "1.2.0"]
                 [compojure "1.1.3"]
                 [stencil "0.3.2"] ;; A fast, compliant implementation of Mustache in Clojure.
                 [clj-http "0.7.3"]
                 [org.clojure/tools.logging "0.2.6"]
                 [cheshire "5.2.0"] ;; Clojure JSON and JSON SMILE (binary json format) encoding/decoding
                 [log4j/log4j "1.2.17"]]
  :profiles {:dev {:dependencies [[org.clojure/tools.namespace "0.2.4"]]
                   :source-paths ["dev"]}}
  :plugins [[cider/cider-nrepl "0.11.0"]
            [lein-ring "0.9.3"]]
  :ring {:handler gameserver.app/site-handler}
  :main gameserver)
