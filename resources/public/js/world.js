var logging_level = INFO;

var Roma = [[41.9012917,12.5012515],
	    [41.9013996,12.5011637],
	    [41.9011458,12.5008891],
	    [41.9013364,12.5010894]];

var mapbox_api_key = "";

function load_world() {
    log(INFO,"loading world..");
    var current_lat = Roma[0][0];
    var current_long = Roma[0][1];
    var current_zoom = 11;
    var map = L.map('map', {
	// http://leafletjs.com/reference.html#map-options
	// dragging: false
    });
    map.setView([current_lat, current_long], current_zoom);
    var tileSet = 'mapbox.streets';
    var mapboxVersion = 'v4';

    L.tileLayer("https://api.mapbox.com/styles/v1/mapbox/streets-v9/tiles/256/{z}/{x}/{y}?access_token=pk.eyJ1IjoiZWtvb250eiIsImEiOiJpSkF1VU84In0.fYYjf551Wds8jyrYV5MFwg", {
	attribution: 'Map data &copy; <a href="http://openstreetmap.org">OpenStreetMap</a> contributors, ' +
	    '<a href="http://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, ' +
	    'Imagery © <a href="http://mapbox.com">Mapbox</a>',
	version: mapboxVersion,
	id: tileSet,
	k: mapbox_api_key
    }).addTo(map);
    
    var player1 = {
	"color": "#ff7800",
	"weight": 5,
	"opacity": 0.65
    };

    var player2 = {
	"color": "#557800",
	"weight": 5,
	"opacity": 0.65
    };
    
    $.ajax({
	type: "GET",
	url: "/world/map?player=0"}).done(function(content) {
	    L.geoJson(content, {
		style: player1,
		coordsToLatLng: function(coords) {
		    lon = coords[0];
		    lat = coords[1];
		    return [lat,lon];
		},
	    }).addTo(map);
	});

    $.ajax({
	type: "GET",
	url: "/world/map?player=1"}).done(function(content) {
	    L.geoJson(content, {
		style: player2,
		coordsToLatLng: function(coords) {
		    lon = coords[0];
		    lat = coords[1];
		    return [lat,lon];
		},
	    }).addTo(map);
	});
}

