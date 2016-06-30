var logging_level = INFO;

var mapbox_api_key = "";

function show_player_turf(map,player,style) {
    $.ajax({
	type: "GET",
	url: "/world/map?player="+player}).done(function(content) {
	    L.geoJson(content, {
		onEachFeature: function onEachFeature(feature,layer) {
		    layer.bindPopup(feature.properties.name);
		},
		style: style,
		coordsToLatLng: function(coords) {
		    lon = coords[0];
		    lat = coords[1];
		    return [lat,lon];
		},
	    }).addTo(map);
	});
}

function load_world() {
    log(INFO,"loading world..");
    var Roma = [[41.9012917,12.5012515],
		[41.9013996,12.5011637],
		[41.9011458,12.5008891],
		[41.9013364,12.5010894]];
    var current_lat = Roma[0][0];
    var current_long = Roma[0][1];
    var current_zoom = 11;

    mapboxgl.accessToken = 'pk.eyJ1IjoiZWtvb250eiIsImEiOiJpSkF1VU84In0.fYYjf551Wds8jyrYV5MFwg';
    var map = new mapboxgl.Map({
	// container id
	container: 'map',
	//stylesheet location
	style: 'mapbox://styles/mapbox/streets-v8',
	// starting position
	center: [current_long, current_lat],
	zoom: 12
    });

}

