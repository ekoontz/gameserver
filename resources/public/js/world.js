var logging_level = INFO;

var mapbox_api_key = "";

var Roma = [12.5012515,41.9012917];

var centroids = {};
var hoods = {};
var players = {};
var adjacencies = {};
var updateBearing = false;
var player_id;

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
        
    map.addControl(new mapboxgl.Navigation({position: 'bottom-right'}));
    
    map.on('load',function() {
	load_centroids(map);
	load_adjacencies(map);
	
	// TODO wrap in a timer and refresh every X seconds:
	load_players(map);

    });
}

function load_adjacencies(map) {
    $.ajax({
	cache:true,
	dataType: "json",
	url: "/world/adjacency",
	success: function(content) {
	    // populate client-side 'player' db
	    adjacencies = {};
	    count = 0;
	    for (var i = 0; i < content.length; i++) {
		var osm_id = content[i].osm_id;
		var adj = content[i].adj;
		adjacencies[osm_id] = adj;
		count++;
	    }
	    log(INFO,"loaded " + count + " adjacencies.");
 	    $.get('/mst/infobox.moustache', function(template) {
		$('#world').append(Mustache.render(template,{}));
	    });
	}});
}

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
	    // populate client-side 'centroids' db
	    centroids = {};
	    content = content.features;
	    hoods = {};
	    for (var i = 0; i < content.length; i++) {
		var hood_name = content[i].properties.neighborhood;
		var centroid = content[i].geometry.coordinates;
		centroids[hood_name] = centroid;
		hoods[name] = content[i];
	    }
	    map.on('click',function(e) {
		var pos = e.lngLat;
		var features =
		    map.queryRenderedFeatures(e.point);
		if (features.length > 0) {
		    for (var i = 0; i < features.length; i++) {
			if (features[i].properties.admin_level == '10') {
			    var old_hood = $("#player" + player_id + "-position").html();
			    var new_hood = features[i].properties.neighborhood;
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
	    }, false);

	    map.on('mousemove',function(e) {
		// display the selected hood in the player-selected box.
		var features =
		    map.queryRenderedFeatures(e.point);
		if (features.length > 0) {
		    for (var i = 0; i < features.length; i++) {
			if (features[i].properties.admin_level == '10') {
			    if ($("#player"+player_id+"-position").html() != features[i].properties.neighborhood) {
				$("#player"+player_id+"-selected").html(features[i].properties.neighborhood);
			    } else {
				$("#player"+player_id+"-selected").html("");
			    }
			    break;
			}
		    }
		}
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
