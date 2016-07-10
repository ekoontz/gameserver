function onclick(e,map,current_player_id) {
    var pos = e.lngLat;
    var features = map.queryRenderedFeatures(e.point);
    if (features.length > 0) {
	for (var i = 0; i < features.length; i++) {
	    if (features[i].properties.admin_level == '10') {
		var new_hood = features[i].properties.neighborhood;
		var selected_osm = features[i].properties.osm_id;
		// This asks the server via POST to update the player's location to _selected_osm_.
		// The might not be allowed to move to that location, however.
		// The content returned by the server from the POST will show the client
		// whether the request was allowed or not.
		$.ajax({cache:false,
			type: "POST",
			data: {osm: selected_osm},
			dataType: "json",
			success: function(content) {
			    log(INFO,"succeeded with the POST.")
			    // The server should be configured to handle this POST with a redirect to /world/players, so that
			    // the content will have the result of GET /world/players.
			    // c.f. player.js:update_players().
			    update_players_from(map,content,current_player_id);
			},
			url: "/world/move"
		       }
		      );

		var old_hood = $("#player" + player_id + "-position").html();
		log(DEBUG,"user clicked on place:" + new_hood + " with osm_id=" +
		    features[i].properties.osm_id);
		update_infobox(features[i].properties.osm_id);
		
		if (old_hood != new_hood) {
		    log(INFO,"selected hood:" + new_hood + " with pos:" + pos);
		    
		    var oldCentroid = centroids[old_hood];
		    var newCentroid = centroids[new_hood];
		    
		    $("#player" + player_id + "-position").html(new_hood);
		    $("#player" + player_id + "-selected").html("");
		    
		    var newBearing;
		    if (updateBearing == true) {
			newBearing = getNewBearing(oldCentroid,newCentroid);
		    } else {
			newBearing = map.getBearing();
		    }
		    
		    map.flyTo({center: newCentroid,
			       bearing: newBearing});

		    setGoogleStreetViewPosition(map,newCentroid[1],newCentroid[0]);
		    
		    // break out of for() loop for efficiency, since
		    // we don't need to look at other features in the array - we
		    // only care about the neighborhood (admin_level == 10).
		}
		break;
	    }
	}
    } else {
	log(DEBUG,"you didn't click on anything of importance at pos:" + pos);
    }
}

function onmousemove(e,map) {
    // display the selected hood in the player-selected box.
    var features = map.queryRenderedFeatures(e.point);
    if (features.length > 0) {
	for (var i = 0; i < features.length; i++) {
	    if (features[i].properties.admin_level == '10') {
		if ($("#player"+player_id+"-position").html() != features[i].properties.neighborhood) {
		    $("#player"+player_id+"-selected").html(features[i].properties.neighborhood);
		} else {
		    $("#player"+player_id+"-selected").html("");
		}
		var osm_id = features[i].properties.osm_id;
		highlight_place(map,osm_id);
		break;
	    }
	}
    }
}

function highlight_place(map,osm_id) {
    log(DEBUG,"highlighting_place: " + osm_id);
    if (typeof(osm2hood[osm_id].polygon) == "undefined") {
	$.ajax({
	    cache:true,
	    dataType: "json",
	    url: "/world/hoods/" + osm_id,
	    success: function(content) {
		osm2hood[osm_id].polygon = content;
		highlight_polygon(map,osm2hood[osm_id].polygon);
	    }
	});
    } else {
	highlight_polygon(map,osm2hood[osm_id].polygon);
    }
}
