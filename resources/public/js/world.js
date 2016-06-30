var logging_level = INFO;

var mapbox_api_key = "";

var styles_per_player = {
    0: {
	"fill-color": "#0010a5",
	"fill-outline-color": "#fff",
	"fill-opacity": 0.2
    },
    1: {
	"fill-color": "#ffff00",
	"fill-outline-color": "#000",
	"fill-opacity": 0.2
    },
    2: {
	"fill-color": "#888700",
	"fill-outline-color": "#001",
	"fill-opacity": 0.2
    }
};

var Roma = [[41.9012917,12.5012515],
	    [41.9013996,12.5011637],
	    [41.9011458,12.5008891],
	    [41.9013364,12.5010894]];

function load_world() {
    log(INFO,"loading world..");
    var current_long = db.locations.ekoontz[0];
    var current_lat = db.locations.ekoontz[1];
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
	pitch:90,
	bearing:-45
    });

    map.addControl(new mapboxgl.Navigation({position: 'bottom-right'}));
    
    map.on('load',function() {
	show_player_turf(map,0);
	show_player_turf(map,1);
	show_player_turf(map,2);

	show_player_marker(map,"ekoontz");
    });
    
 }

