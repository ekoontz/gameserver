var logging_level = INFO;

var mapbox_api_key = "";

var Roma = [[41.9012917,12.5012515],
	    [41.9013996,12.5011637],
	    [41.9011458,12.5008891],
	    [41.9013364,12.5010894]];

function load_world() {
    log(INFO,"loading world..");
    var current_long = Roma[0][1];
    var current_lat = Roma[0][0];
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
		}
	    }
	} else {
	    log(DEBUG,"you didn't click on anything of importance at pos:" + pos);
	}
    }, false);
    
    map.addControl(new mapboxgl.Navigation({position: 'bottom-right'}));
    
    map.on('load',function() {
	show_player_turf(map,0);
	show_player_turf(map,1);
	show_player_turf(map,2);

	show_player_marker(map,"ekoontz");
    });
}
    

