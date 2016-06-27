var logging_level = INFO;

var Roma = [[41.9012917,12.5012515],
	    [41.9013996,12.5011637],
	    [41.9011458,12.5008891],
	    [41.9013364,12.5010894]];

var mapbox_api_key = "pk.eyJ1IjoiZWtvb250eiIsImEiOiJpSkF1VU84In0.fYYjf551Wds8jyrYV5MFwg";

function load_world() {
    log(INFO,"loading world..");
    var current_lat = Roma[0][0];
    var current_long = Roma[0][1];
    var current_zoom = 17;
    var map = L.map('map', {
	// http://leafletjs.com/reference.html#map-options
	// dragging: false
    });
    map.setView([current_lat, current_long], current_zoom);
    var tileSet = 'mapbox.streets';
    var mapboxVersion = 'v4';

    // http://leafletjs.com/reference.html#map-options
/*    L.tileLayer('https://{s}.tiles.mapbox.com/{version}/{id}/{z}/{x}/{y}.png?access_token={k}', {
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
*/
    L.tileLayer("https://api.mapbox.com/styles/v1/mapbox/streets-v9/tiles/256/{z}/{x}/{y}?access_token=pk.eyJ1IjoiZWtvb250eiIsImEiOiJpSkF1VU84In0.fYYjf551Wds8jyrYV5MFwg").addTo(map);
    

    for (var distritto = 0; distritto < i_distritti_romani.length; distritto++) {
	var foo = i_distritti_romani[distritto];
	var bar = foo.geometry.coordinates[0];
	var flipped_pairs = bar.map(function(pair) {
	    var flipped = [
		pair[1],
		pair[0]
	    ];
	    return flipped;
	});
	
	L.polygon(flipped_pairs).addTo(map);
    }

    marker = L.marker([current_lat, current_long]).addTo(map);
//    L.polygon([Roma[3],Roma[1],Roma[0],Roma[2]]).addTo(map);

    
}
