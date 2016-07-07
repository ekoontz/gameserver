function onclick(e,map) {
    var pos = e.lngLat;
    var features = map.queryRenderedFeatures(e.point);
    if (features.length > 0) {
	for (var i = 0; i < features.length; i++) {
	    if (features[i].properties.admin_level == '10') {
		var old_hood = $("#player" + player_id + "-position").html();
		var new_hood = features[i].properties.neighborhood;
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
	    cache:false, // we use our own cache (osm2hood), so don't waste more client memory here.
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

function highlight_polygon(map,polygon) {
    if (typeof(map.getSource('highlighted')) == "undefined") {
	map.addSource('highlighted',
		      new mapboxgl.GeoJSONSource({
			  type: "geojson",
			  data: polygon}));
    } else {
	var source = map.getSource('highlighted');
	source.setData(polygon);
    }
    if (typeof(map.getLayer('highlighted')) == "undefined") {
	map.addLayer({
	    type: "fill",
	    paint: highlighted_layer_style,
	    id: "highlighted",
	    source: 'highlighted',
	    "source-layer": "highlighted"
	});
    }
}
