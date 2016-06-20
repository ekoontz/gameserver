(ns gameserver.view.common
  (:require [ring.util.response :as response]
            [stencil.core :as stencil]
            [gameserver.middleware.context :as context]
            [gameserver.util.session :as session]))

;;; Context utils
(defn get-context-root
  []
  (context/get-context-root))

(defn wrap-context-root
  "Add web context to the path of URI"
  [path]
  (str (get-context-root) path))

;;; User utils
(defn restricted
  "Function for restricted part of the Web site. 
   Takes a predicate function and the handler to execute if predicate is true."
  [predicate handler & args]
  (if (predicate)
    (apply handler args)
    (response/redirect (wrap-context-root "/"))))

(defn authenticated?
  "Sample authentication function. Test if current user is not null."
  []
  false)

(defn admin?
  "Sample authorization function. Test if current user it admin."
  []
  (if-let [user (session/current-user)]
    (= :admin (keyword (:type user)))))

;;; Layout
(defn- base-content
  [title body]
  {:context-root (context/get-context-root)
   :title title
   :body body})

(defn- user-nav-links 
  []
  (when (admin?) 
    [{:link (wrap-context-root "/admin") :label "Administration"}]))

(defn wrap-layout
  "Define pages layout"
  [title body]
  (stencil/render-file
   "gameserver/view/templates/layout"
   (let [content (base-content title body)]
     content)))
