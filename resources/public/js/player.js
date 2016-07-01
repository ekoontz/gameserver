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

function show_player_marker(map,player) {
    $.ajax({
	cache:false,
	dataType: "json",
	url: "/world/player?player="+player,
	success: function(content) {
	    // 1. show current location in status window:
	    $("#player"+player+"-position").html(content.properties.name);

	    // 2. show marker:
	    var markers = new mapboxgl.GeoJSONSource({
		type: "geojson",
		data: content // "/world/player?player="+player
	    });
	    map.addSource('player_marker'+player, markers);
	    map.addLayer({
		id: "player_marker"+player,
		type: "symbol",
		layout: {
		    visibility: 'visible',
		    "icon-image": "marker-11",
		    "text-field":"player"+player,
		    "text-offset":[0,1.5],
		    "icon-size": 2
		},
		source: 'player_marker'+player,
	    });
	}});
}

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
