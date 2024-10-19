function load_world(current_player_id) {
    player_id = current_player_id;
    log(INFO,"loading world..");
    var current_long = Roma[0];
    var current_lat = Roma[1];
    var current_zoom = 13;

    mapboxgl.accessToken = mapbox_api_key;
    var map = new mapboxgl.Map({
	// container id
	container: 'map',

	//stylesheet location
	style: 'mapbox://styles/ekoontz/ciq5kc64u0080bknqqv0f0dtx',

	// starting position
	center: [current_long, current_lat],
	zoom: current_zoom,
	pitch:80
    });

    if (fitBounds == true) {
	map.fitBounds([[12.4012515,41.9012917], [12.5012515,42.0012917]]);
    }
    
    map.addControl(new mapboxgl.Navigation({position: 'bottom-right'}));
    
    map.on('load',function() {
	// server-supplied info that doesn't change during gameplay:
	// TODO: map's onclick and onmouse are defined in here: pull out
	// and add to last client action before starting game.
	load_centroids(map);
	load_adjacencies(map);

	// things that need to be loaded once, but can be done
	// post-game startup (in the background while user is playing).
	// load_place_geometries(map);
	
	// server-supplied info that *does* change during gameplay:
	update_players(map);
        update_open_turf(map);
//	load_owners(map);

	// TODO wrap in a timer and refresh every X seconds:
	window.setInterval(function() {
	    update_players(map);
	    update_open_turf(map);
	},5000);
    });
}

function load_adjacencies(map) {
    $.ajax({
	cache:true,
	dataType: "json",
	url: "/world/adjacency",
	success: function(content) {
	    // populate client-side 'adjacencies' db
	    adjacencies = {};
	    var count = 0;
	    for (var i = 0; i < content.length; i++) {
		var osm_id = content[i].osm_id;
		var adj = content[i].adj;
		adjacencies[osm_id] = adj;
		count++;
	    }
	    log(INFO,"loaded " + count + " adjacencies.");
	}});
}

function load_owners(map) {
    $.ajax({
	dataType: "json",
	url: "/world/owners",
	success: function(content) {
	    // populate client-side 'osm2owner' db
	    osm2owner = {};
	    var count = 0;
	    for (var i = 0; i < content.length; i++) {
		var osm_id = content[i].osm_id;
		var owner_id = content[i].owner_id;
		osm2owner[osm_id] = owner_id;
		count++;
	    }
	    log(INFO,"loaded " + count + " owning relationships.");
	}});
}

// TODO: map's onclick and onmouse are set up in here:
// should be somewhere later - more precisely, not until last client
// data-loading has happened.
function load_centroids(map) {
    $.ajax({
	cache:true,
	dataType: "json",
	url: "/world/hoods",
	success: function(content) {
	    var markers = new mapboxgl.GeoJSONSource({
		type: "geojson",
		data: content
	    });
	    map.addSource('hood_markers', markers);
	    map.addLayer({
		id: "hood_markers",
		type: "symbol",
		layout: {
		    visibility: 'visible',
		    "text-field":"{neighborhood}",
		    "text-offset":[0,0]
		},
		source: 'hood_markers'
	    });
	    // populate client-side 'centroids' and 'osm2hood' maps.
	    centroids = {};
	    content = content.features;
	    hoods = {};
	    for (var i = 0; i < content.length; i++) {
		var hood_name = content[i].properties.neighborhood;
		var centroid = content[i].geometry.coordinates;
		centroids[hood_name] = centroid;
		hoods[name] = content[i];
		osm2hood[content[i].properties.osm_id] = {
		    name: hood_name,
		    centroid: centroid
		};
	    }
	    map.on('click',function(e) {
		onclick(e,map);
	    }, false);

	    map.on('mousemove',function(e) {
		onmousemove(e,map);
	    }, false);
	}
    });
}

function toDegrees(radians) {
    return radians * (180 / Math.PI);
}

function getNewBearing(from_centroid,to_centroid) {
    // find bearing if you want to move from from_centroid to to_centroid
    // thanks to http://www.movable-type.co.uk/scripts/latlong.html
    var lat1 = from_centroid[0];
    var lon1 = from_centroid[1];
    var lat2 = to_centroid[0];
    var lon2 = to_centroid[1];
    var y = Math.sin(lon2-lon1) * Math.cos(lat2);
    var x = Math.cos(lat1)*Math.sin(lat2) -
        Math.sin(lat1)*Math.cos(lat2)*Math.cos(lon2-lon1);
    var bearing = toDegrees(Math.atan2(y, x));
    return bearing;
}

function add_or_update_layer(map,content,layer_spec) {
    var source_name = layer_spec.source;
    var source = map.getSource(source_name);
    if (typeof(source) == "undefined") {
	var geojson = new mapboxgl.GeoJSONSource({
	    type: "geojson",
	    data: content
	});
	map.addSource(source_name,geojson);
	source = map.getSource(source_name);
    }
    // use same name for both source and layer.
    var layer = map.getLayer(source_name);
    if (typeof(layer) == "undefined") {
	map.addLayer(layer_spec);
	layer = map.getLayer(source_name);
    } else {
	source.setData(content);
    }
    log(INFO,"finished updating:" + source_name);
}

function update_open_turf(map) {
    $.ajax({
	cache:false,
	dataType: "json",
	url: "/world/hoods/open",
	success: function(content) {
	    add_or_update_layer(map,content,
				{type: "fill",
				 paint: open_hood_style,
				 id: "open_hoods",
				 source: 'open_hoods',
				 "source-layer": "open_hoods"});
	}
    });
}
