(ns gameserver.middleware.session
  (:require [clojure.tools.logging :as log]))

(declare ^:dynamic *session*)
(declare ^:dynamic *flash*)

(defn log-session-info [request]
  (when (= (-> request :uri) "/")
    (log/info (str "wrap-session: request uri: " (-> request :uri)))
    (log/info (str "wrap-session: request friend: " (-> request :session :cemerick.friend/identity)))))

(defn wrap-session
  "Store session into a Clojure map"
  [handler]
  (fn [request]
    (log-session-info request)
    (binding [*session* (atom {})
              *flash* (atom {})]
      (log/debug (str "response session(1): " (-> request :session)))
      (log/debug (str "response session(1.5): " (-> request :session :cemerick.friend/identity)))
      (when-let [session (get-in request [:session :cemerick.friend/identity])]
        (when (not (empty? session))
          (log/debug (str "session: resetting *session* to: " session))
          (reset! *session* session)))
      (when-let [flash (get-in request [:session :app-flash])]
        (if (not (nil? flash))
          (log/debug (str "wrap-session: resetting *flash* to: " flash)))
        (reset! *flash* flash))
      (let [response (handler request)]
        (log/debug (str "*session* is now: " @*session*))
        (let [retval
              (if (not (empty? @*session*))
                (assoc-in response
                          [:session :cemerick.friend/identity] @*session*)
                (do
                  (log/debug (str "it is odd: @*session* is empty, so not messing with the :session."))
                  response))
              retval
              (assoc-in retval
                        [:session :app-flash] @*flash*)]
          (log/debug (str "retval session(3): " (-> retval :session)))
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
  (let [current (get @*session* k)]
    (if current
      (get-in @*session* [:authentications current]))))

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
