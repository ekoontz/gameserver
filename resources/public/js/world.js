var logging_level = INFO;

var mapbox_api_key = "pk.eyJ1IjoiZWtvb250eiIsImEiOiJpSkF1VU84In0.fYYjf551Wds8jyrYV5MFwg";

var styles_per_player = {
    0: {
	"fill-color": "#0010a5",
	"fill-outline-color": "#ffef59",
	"fill-opacity": 0.3
    },
    1: {
	"fill-color": "#ffff00",
	"fill-outline-color": "#0000ff",
	"fill-opacity": 0.5
    },
    2: {
	"fill-color": "#888700",
	"fill-outline-color": "#3338ff",
	"fill-opacity": 0.5
    }
    
};
    

function show_player_turf(map,player) {
    var hoods = new mapboxgl.GeoJSONSource({
	type: "geojson",
	data: "/world/map?player="+player
    });
    map.addSource('player'+player,hoods);
    map.addLayer({
	type: "fill",
	paint: styles_per_player[player],
	id: "player"+player,
	source: 'player'+player,
	"source-layer": "player"+player
    });
};

function load_world() {
    log(INFO,"loading world..");
    var Roma = [[41.9012917,12.5012515],
		[41.9013996,12.5011637],
		[41.9011458,12.5008891],
		[41.9013364,12.5010894]];
    var current_lat = Roma[0][0];
    var current_long = Roma[0][1];
    var current_zoom = 12;

    mapboxgl.accessToken = 'pk.eyJ1IjoiZWtvb250eiIsImEiOiJpSkF1VU84In0.fYYjf551Wds8jyrYV5MFwg';
    var map = new mapboxgl.Map({
	// container id
	container: 'map',
	//stylesheet location
	style: 'mapbox://styles/mapbox/light-v8',
	// starting position
	center: [current_long, current_lat],
	zoom: current_zoom
    });

    var markers = new mapboxgl.GeoJSONSource({
	data: {
	    "type": "FeatureCollection",
	    "features": [
		{
		"type": "Feature",
		"geometry": {
		    "type": "Point",
		    "coordinates": [
			current_long,current_lat
		    ]
		}},
		{
		"type": "Feature",
		"geometry": {
		    "type": "Point",
		    "coordinates": [
			current_long+0.01,current_lat+0.01
		    ]
		}}]
	}});

    map.on('load',function() {

		map.addSource('mypoints', markers); 
	map.addLayer({
            id: "non-cluster-markers",
            type: "symbol",
	    layout: {
		visibility: 'visible'
            },
            source: "mypoints",
            layout: {
		"icon-image": "marker-15"
            }
	});

	show_player_turf(map,0);
	show_player_turf(map,1);
	show_player_turf(map,2);
	
	
    });
    
 }

