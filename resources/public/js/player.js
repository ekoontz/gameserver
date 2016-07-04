var styles_per_player = {
    196: {
	"fill-color": "#0010a5",
	"fill-outline-color": "#fff",
	"fill-opacity": 0.2
    },
    195: {
	"fill-color": "#ff0000",
	"fill-outline-color": "#000",
	"fill-opacity": 0.2
    },
    199: {
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
	    $("#player"+player+"-position").html(content.properties.neighborhood);
	    $("#player"+player+"-name").html(content.properties.player);

	    // 2. show marker:
	    var marker = new mapboxgl.GeoJSONSource({
		type: "geojson",
		data: content // "/world/player?player="+player
	    });
	    map.addSource('player_marker'+player, marker);
	    map.addLayer({
		id: "player_marker"+player,
		type: "symbol",
		layout: {
		    "icon-image": "marker-11",
		    "icon-offset":[0,-25],
		    "text-field":content.properties.player,
		    "text-offset":[0,-2],
		    "icon-size": 2
		},
		source: 'player_marker'+player,
	    });
	}});
}

function show_player_turf(map,player) {
    $.ajax({
	cache:false,
	dataType: "json",
	url: "/world/player/"+player,
	success: function(content) {
	    content = content.owns;
	    var hoods = new mapboxgl.GeoJSONSource({
		type: "geojson",
		data: content
	    });
	    map.addSource('player'+player,hoods);
	    map.addLayer({
		type: "fill",
		paint: styles_per_player[player],
		id: "player"+player,
		source: 'player'+player,
		"source-layer": "player"+player
	    });
	}});
};
