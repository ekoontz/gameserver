(defproject gameserver "0.1.0-SNAPSHOT"
  :description "FIXME: write description"
  :url "http://example.com/FIXME"
  :license {:name "Eclipse Public License"
            :url "http://www.eclipse.org/legal/epl-v10.html"}
  :dependencies [[babel "1.6.6"]
                 [clj-http "2.2.0"]
                 [friend-oauth2 "0.1.3"]
                 [http-kit "2.1.16"]
                 [org.clojure/clojure "1.8.0"]
                 [org.clojure/core.cache "0.6.5"]
                 [org.clojure/tools.logging "0.2.6"]
                 [stencil "0.5.0"]]

  :plugins [[cider/cider-nrepl "0.11.0"]
            [lein-environ "1.0.0"]
            [lein-ring "0.9.7"]
            [s3-wagon-private "1.2.0"]]

  :repositories {"s3" {:url "s3p://ekoontz-repo/releases/"
                       :username :env/aws_access_key ;; gets environment variable AWS_ACCESS_KEY
                       :passphrase :env/aws_secret_key ;; gets environment variable AWS_SECRET_KEY
                       }}
  :resource-paths ["resources"]
  :ring {:handler gameserver.app/site-handler})

