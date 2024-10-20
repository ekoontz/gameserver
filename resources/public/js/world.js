const Roma =      [12.5012515,41.9012917];
const Amsterdam = [ 4.884352, 52.3675];

//var useCity = Amsterdam;
var useCity = Roma;
function load_world(current_player_id) {
    log(INFO,"loading world for player: " + current_player_id);
    player_id = current_player_id;
    // TODO: get user's position before map.on() to avoid
    // going to the center of rome first.

    var current_long = useCity[0];
    var current_lat = useCity[1];
    var current_zoom = zoom_level;

    if (googleStreetView == true) {
        var s = document.createElement("script");
	s.type = "text/javascript";
	s.src = "https://maps.googleapis.com/maps/api/js?key=" + google_api_key + "&callback=initStreetView";
	$("head").append(s);
    }
        
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
    
    map.addControl(new mapboxgl.Navigation({position: 'bottom-right'}));
    
    map.on('load',function() {
	// find player's initial location: do this first so geo assets can be fetched in the
	// background.
	update_players(map,current_player_id,function() {
	    log(INFO,"update_players passed function with current_player_id: " + current_player_id);
	    if (players[current_player_id]) {
		map.setCenter(players[current_player_id].location.geometry.coordinates);
		if (fitBounds == true) {
		    // TODO: should be relative to the player's current position.
		    map.fitBounds([[12.4012515,41.9012917], [12.5012515,42.0012917]]);
		}

		if (googleStreetView == true) {
		    setGoogleStreetViewPosition(
			map,
			players[current_player_id].location.geometry.coordinates[1],
			players[current_player_id].location.geometry.coordinates[0])
		} else {
		    $('#streetviewcontainer').hide();
		}
	    }
	});

	// server-supplied info that doesn't change during gameplay:
	load_centroids(map,current_player_id);
	load_adjacencies(map);
	load_vocab();
	
	// things that need to be loaded once, but can be done
	// post-game startup (in the background while user is playing).
	// TODO: load_place_geometries() not loaded yet.
	// load_place_geometries(map);
	
	// server-supplied info that *does* change during gameplay: owners and open turf (players
	// also change during gameplay, but we took care of that above already).
	update_owners();
        update_open_turf(map,function() {
	    var osm;
	    if (typeof(players[player_id]) != "undefined") {
		osm = players[player_id].location.properties.osm;
		update_placeinfo(osm,function() {
		    update_placebox(osm,player_id);
		    // it's showtime!
		    userinput_initialize(map);
		    $("#placebox").show();
		});
	    }
	});
	
	// The same things as above are updated regularly in this block.
	// TODO: server should compute changes from client state
	// to server state and return only the necessary diff between them.
	window.setInterval(function() {
	    update_players(map,current_player_id);
	},map_refresh_interval);

	window.setInterval(function() {
	    update_owners();
	},map_refresh_interval);

	window.setInterval(function() {
	    update_open_turf(map,function() {
		if (players[current_player_id]) {
		    var osm = players[current_player_id].location.properties.osm;	    
		    update_placeinfo(osm,function() {
			update_placebox(osm,current_player_id);
		    });
		}
	    });
	},map_refresh_interval);

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
	    var relations = 0;
	    jQuery.map(content,function(place) {
		var osm_id = place.osm_id;
		var next_to = place.adj;
		adjacencies[osm_id] = next_to;
		count = count + 1;
		relations = relations + next_to.length;
	    });
	    log(INFO,"loaded " + count  + " places with a total of " + relations + " adjacency relationships.");
	}});
}

function update_owners() {
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
function load_centroids(map,current_player_id) {
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
	    // TODO: reconcile this with actions.js; both are updating osm2hood, but in different ways.
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

	    // onclick() is defined in actions.js
	    map.on('click',function(e) {
		onclick(e,map,current_player_id);
	    }, false);

	    // onmousemove() is defined in actions.js
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

function update_open_turf(map,callback_fn) {  
    // callback_fn: what to do at the end of this - e.g. update other parts of the UI that depend
    // on update_open_turf() or other earlier actions that happened before update_open_turf().
    $.ajax({
	cache:false,
	dataType: "json",
	url: "/world/hoods/open",
	success: function(content) {
	    upsert_layer(map,content,
			 {type: "fill",
			  paint: open_hood_style,
			  id: "open_hoods",
			  source: 'open_hoods',
			  "source-layer": "open_hoods"});
	    if (callback_fn) {
		callback_fn();
	    }
	}
    });
}
