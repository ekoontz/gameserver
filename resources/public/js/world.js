var logging_level = INFO;

var mapbox_api_key = "";

var Roma = [12.5012515,41.9012917];

function load_centroids() {
    geojson = $.ajax({
	async:false,
	cache:true,
	dataType: "json",
	url: "/world/centroids",
	success: function(content) {
	    return content;
	}
    }).responseJSON;
    var retval = {};
    geojson = geojson.features;
    for (var i = 0; i < geojson.length; i++) {
	var hood_name = geojson[i].properties.neighborhood;
	var centroid = geojson[i].geometry.coordinates;
	retval[hood_name] = centroid;
    }
    return retval;
}

var centroids = load_centroids();

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

function load_world() {
    log(INFO,"loading world..");
    var current_long = Roma[0];
    var current_lat = Roma[1];
    var current_zoom = 13;

    mapboxgl.accessToken = 'pk.eyJ1IjoiZWtvb250eiIsImEiOiJpSkF1VU84In0.fYYjf551Wds8jyrYV5MFwg';
    var map = new mapboxgl.Map({
	// container id
	container: 'map',
	//stylesheet location
	style: 'mapbox://styles/mapbox/light-v9',

	// starting position
	center: [current_long, current_lat],
	zoom: current_zoom,
	pitch:80,
	bearing:-45
    });

    map.on('click',function(e) {
	var pos = e.lngLat;
	var features =
	    map.queryRenderedFeatures(e.point);
	if (features.length > 0) {
	    for (var i = 0; i < features.length; i++) {
		if (features[i].properties.admin_level == '10') {
		    var old_hood = $("#player0-position").html();
		    var new_hood = features[i].properties.name;
		    if (old_hood != new_hood) {
			log(INFO,"selected hood:" + new_hood + " with pos:" + pos);

			var oldCentroid = centroids[old_hood];
			var newCentroid = centroids[new_hood];

			$("#player0-position").html(new_hood);
			$("#player0-selected").html("");
		    
			var newBearing = getNewBearing(newCentroid,oldCentroid);
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
    
    map.addControl(new mapboxgl.Navigation({position: 'bottom-right'}));
    
    map.on('load',function() {
	show_player_turf(map,0);
	show_player_marker(map,0);
	show_player_turf(map,1);
	show_player_marker(map,1);
	show_player_turf(map,2);
	show_player_marker(map,2);
    });
}
    

