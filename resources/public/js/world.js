var logging_level = INFO;

var mapbox_api_key = "pk.eyJ1IjoiZWtvb250eiIsImEiOiJpSkF1VU84In0.fYYjf551Wds8jyrYV5MFwg";

var Roma = [12.5012515,41.9012917];

function toDegrees(radians) {
    return radians * (180 / Math.PI);
}

function getNewBearing(center,new_position) {
    // do some trigonometry
    // thanks to http://www.movable-type.co.uk/scripts/latlong.html
    var lat1 = center.lat;
    var lat2 = new_position.lat;
    var lon1 = center.lng;
    var lon2 = new_position.lng;
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
		    var hood = features[i].properties.name;
		    log(INFO,"selected hood:" + hood + " with pos:" + pos);
		    $("#player0-selected").html(hood);
		    var newBearing = getNewBearing(map.getCenter(),pos);
		    map.flyTo({center: pos,
			       bearing: newBearing});
		    
		    // break out of for() loop for efficiency, since
		    // we don't need to look at other features in the array - we
		    // only care about the neighborhood (admin_level == 10).
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
    

