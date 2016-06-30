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
    
    show_player_turf(map,0,{
	"fillColor": "#0010a5",
	"weight": 1,
	"opacity": 0.95
    });
    show_player_turf(map,1,{
	"fillColor": "#ffff00",
	"weight": 1,
	"opacity": 0.95
    });
    show_player_turf(map,2,{
	"fillColor": "#888700",
	"weight": 1,
	"opacity": 0.95
    });

    var player1 = L.icon({
	iconUrl: '/js/images/marker-icon.png',
	shadowUrl: '/js/images/marker-shadow.png',
	className: 'player1'
    });

    var player2 = L.icon({
	iconUrl: '/js/images/marker-icon.png',
	shadowUrl: '/js/images/marker-shadow.png',
	className: 'player2'
    });
    
    var p1 = L.marker([41.9210211676156,12.506591169536],
		      {icon: player1,
		       opacity: '0.9'}
		     ).addTo(map);
    var p2 = L.marker([41.8210211676156,12.526001169536],
		      {icon: player2,
		     ).addTo(map);
}

