(defproject gameserver "0.2.0-SNAPSHOT"
  :description "Gameserver: a webservice for gaming"
  :url "http://github.com/ekoontz/gameserver"
  :license {:name "Eclipse Public License"
            :url "http://www.eclipse.org/legal/epl-v10.html"}
  :dependencies [[babel "1.8.2"]
                 [cheshire "5.6.3"]
                 [clj-http "3.4.1"]
                 [clojusc/friend-oauth2 "0.2.0"] 
                 [friend-oauth2 "0.1.3"]
                 [http-kit "2.4.0-alpha1"]
                 [org.clojure/clojure "1.11.3"]
                 [org.clojure/core.cache "0.6.5"]
                 [org.clojure/tools.logging "0.2.6"]
                 [stencil "0.5.0"]]

  :plugins [[lein-environ "1.0.0"]
            [lein-ring "0.12.5"]
            [s3-wagon-private "1.2.0"]]

  :repositories {"s3" {:url "s3p://ekoontz-repo/releases/"
                       :username :env/aws_access_key ;; gets environment variable AWS_ACCESS_KEY
                       :passphrase :env/aws_secret_key ;; gets environment variable AWS_SECRET_KEY
                       }}
  :resource-paths ["resources"]
  :ring {:handler gameserver.app/site-handler})

