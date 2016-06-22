(ns gameserver.view.common
  (:require [ring.util.response :as response]
            [stencil.core :as stencil]
            [gameserver.middleware.context :as context]
            [gameserver.util.session :as session]))

;;; Context utils
(defn wrap-context-root
  "Add web context to the path of URI"
  [path]
  (str (context/get-context-root) path))

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
  (not (nil? (session/current-user))))

(defn admin?
  "Sample authorization function. Test if current user it admin."
  []
  (if-let [user (session/current-user)]
    (= :admin (keyword (:type user)))))

;;; Layout
(defn- base-content
  "create a map of the title and body together with the context root"
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
   (let [content (base-content title body)
         user (session/current-user)]
     (if (authenticated?)
       (assoc content 
         :authenticated? 
         {:user (:username user)
          :nav-links (user-nav-links)})
       content))))
