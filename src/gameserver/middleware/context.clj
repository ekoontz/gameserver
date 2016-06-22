(ns gameserver.middleware.context
  (:require [clojure.tools.logging :as log]))

(def ^{:dynamic true :private true} *context-root*)

(defn wrap-context-root-with-handler
  "Wrap application root context"
  [handler]
  (fn [request]
    (log/info (str "wrap-context-root-with-handler: request:" request))
    (binding [*context-root*
              (or (:context-root request) "")]
      (handler request))))

(defn get-context-root []
  *context-root*)
