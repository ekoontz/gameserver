function onclick(e,map,current_player_id) {
    var pos = e.lngLat;
    var features = map.queryRenderedFeatures(e.point);
    if (features.length > 0) {
	for (var i = 0; i < features.length; i++) {
	    if (features[i].properties.admin_level == '10') {
		// clear inputbox
		userinput_initialize();

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
		var osm_of_clicked_on_place = features[i].properties.osm_id;
		if (old_hood != new_hood) {
		    update_placeinfo(osm_of_clicked_on_place,function() {
			update_placebox(osm_of_clicked_on_place,current_player_id);
		    });
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
		var owner = osm2owner[osm_id];

		// create a new style, like the old one but with more opacity.
		// TODO: should store more-opaque versions of each of styles_per_player
		// and open_hood_style rather than copying every time we highlight.
		var layer_style = {};
		if (typeof(owner) == "undefined") {
		    layer_style["fill-color"] = open_hood_style["fill-color"];
		    layer_style["fill-opacity"] =
			open_hood_style["fill-opacity"] + 0.3;
		} else {
		    layer_style["fill-color"] =
			styles_per_player[players[owner].css_class]["fill-color"];
		    layer_style["fill-opacity"] =
			styles_per_player[players[owner].css_class]["fill-opacity"] + 0.1;
		}
		if (layer_style["fill-opacity"] > 1.0) {
		    layer_style["fill-opacity"] = 1.0;
		}
		highlight_place(map,osm_id,layer_style);
		break;
	    }
	}
    }
}

function update_placeinfo(osm_id, post_get) {
    // retrieve GeoJSON data for place whose osm id is _osm_id.
    // TODO: we don't need to constantly refresh the place's polygon: this should be done only once.
    $.ajax({
	cache:true,
	dataType: "json",
	url: "/world/hoods/" + osm_id,
	success: function(content) {
	    // .. and save it so we don't need to do this server call again.
	    osm2hood[osm_id].polygon = content;
	    osm2hood[osm_id].vocab_solved = content.properties.vocab_solved;
	    osm2hood[osm_id].vocab_unsolved = content.properties.vocab_unsolved;
	    osm2hood[osm_id].vocab_solvers = content.properties.vocab_solvers;
	    osm2hood[osm_id].tenses_solved = content.properties.tenses_solved;
	    osm2hood[osm_id].tense_solvers = content.properties.tense_solvers;
	    osm2hood[osm_id].tenses_unsolved = content.properties.tenses_unsolved;
	    post_get(content);
	}
    });
}

function highlight_place(map,osm_id,layer_style) {
    log(DEBUG,"highlighting_place: " + osm_id);
    if (typeof(osm2hood[osm_id].polygon) == "undefined") {
	// We haven't gotten this polygon from the server yet, so get it now.
	update_placeinfo(osm_id,function(content) {
	    highlight_polygon(map,osm2hood[osm_id].polygon,layer_style);
	});
    } else {
	highlight_polygon(map,osm2hood[osm_id].polygon,layer_style);
    }
}

