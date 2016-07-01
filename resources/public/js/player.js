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
    $.ajax({cache:false,
	    url: "/world/players",
	    dataType: "json",
	    success: function(content) {
		var current_long = content.players[player].position[0];
		var current_lat = content.players[player].position[1];

		var markers =
		    new mapboxgl.GeoJSONSource({
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
				    }}]}});

		map.addSource('player_marker'+player, markers); 
		map.addLayer({
		    id: "player_marker"+player,
		    type: "symbol",
		    layout: {
			visibility: 'visible'
		    },
		    source: 'player_marker'+player,
		    layout: {
			"icon-image": "marker-15"
		    }
		});
	    }
	   });
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
