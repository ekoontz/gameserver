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
    // 1. show neighborhood of player:
    $("#player"+player+"-position").html(players[player].location.properties.neighborhood);
    // 2. show name of player:
    $("#player"+player+"-name").html(players[player].name);

    // 3. show marker of player in neighborhood:
    map.addSource('player_marker'+player,
		  new mapboxgl.GeoJSONSource({
		      type: "geojson",
		      data: players[player].location
		  }));
		  
    map.addLayer({
        id: "player_marker"+player,
        type: "symbol",
        layout: {
            "icon-image": "marker-11",
            "icon-offset":[0,-35],
            "text-field":players[player].name,
            "text-offset":[0,-2],
	    "text-size":12,
            "icon-size": 1
        },
        source: 'player_marker'+player
    });
}

function show_player_turf(map,player) {
    $.ajax({
	cache:false,
	dataType: "json",
	url: "/world/player/"+player,
	success: function(content) {
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

function load_players(map) {
    $.ajax({
	async:false,
	cache:true,
	dataType: "json",
	url: "/world/players",
	success: function(content) {
	    // populate client-side 'player' db
	    players = {};
	    for (var i = 0; i < content.features.length; i++) {
		var id = content.features[i].properties.player_id;
		var player_record = { name: content.features[i].properties.player,
				      location: content.features[i]}; 
		players[id] = player_record;
		show_player_marker(map,id);
		show_player_turf(map,id);
	    }
	}
    });
}
