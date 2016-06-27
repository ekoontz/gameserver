var logging_level = INFO;

var Firenze = [43.775535,11.248898];

var mapbox_api_key = "";

function load_world() {
    log(INFO,"loading world..");
    var current_lat = Firenze[0];
    var current_long = Firenze[1];
    var current_zoom = 17;
    var map = L.map('map', {
	// http://leafletjs.com/reference.html#map-options
	// dragging: false
    });
    map.setView([current_lat, current_long], current_zoom);
    var tileSet = 'mapbox.streets';
    var mapboxVersion = 'v4';

    // http://leafletjs.com/reference.html#map-options
    L.tileLayer('https://{s}.tiles.mapbox.com/{version}/{id}/{z}/{x}/{y}.png?access_token={k}', {
	maxZoom: 21,
	minZoom: 16,
	// maxBounds..
	attribution: 'Map data &copy; <a href="http://openstreetmap.org">OpenStreetMap</a> contributors, ' +
	    '<a href="http://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, ' +
	    'Imagery © <a href="http://mapbox.com">Mapbox</a>',
	version: mapboxVersion,
	id: tileSet,
	k: mapbox_api_key
    }).addTo(map);
}
