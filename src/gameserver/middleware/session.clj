(ns gameserver.middleware.session
    (:require [clojure.tools.logging :as log]))

(declare ^:dynamic *session*)
(declare ^:dynamic *flash*)

(defn wrap-session
  "Store session into a Clojure map"
  [handler]
  (fn [request]
    (log/info (str "wrap-session: request uri: " (-> request :uri)))
    (log/info (str "wrap-session: request cookies: " (-> request :cookies)))
    (log/info (str "wrap-session: request app session: " (-> request :session :app-session)))
    (binding [*session* (atom {})
              *flash* (atom {})]
      (when-let [session (get-in request [:session :app-session])]
        (reset! *session* session))
      (when-let [flash (get-in request [:session :app-flash])]
        (reset! *flash* flash))
      (let [response (handler request)]
        (log/info (str "wrap-session: handler response: " response))
        (log/info (str "wrap-session: *session*:" @*session*))
        (let [retval
              (-> response
                  (assoc-in [:session :app-session] @*session*)
                  (assoc-in [:session :app-flash] @*flash*))]
          (log/info (str "wrap-session: retval session: " (-> retval :session :app-session)))
          retval)))))

(defn- put!
  "Put key/value into target"
  [target k v]
  (swap! target (fn [old-target]
                  (assoc old-target k v))))

(defn session-put!
  "Add or update key/value for the current session"
  [k v]
  (put! *session* k v))

(defn session-get
  "Get the value associated to a key for the current session"
  [k]
  (@*session* k))

(defn session-clear
  "Clear the current session"
  []
  (reset! *session* {}))

(defn flash-put!
  "Add or update key/value flash"
  [k v]
  (put! *flash* k v))

(defn flash-get
  "Get the value associated to a key in the flash and remove this key/value"
  [k]
  (let [v (@*flash* k)]
    (swap! *flash* (fn [old-flash]
                     (dissoc old-flash k)))
    v))
