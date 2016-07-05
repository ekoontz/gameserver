var open_hood_style = {
	"fill-color": "#ffffff",
	"fill-outline-color": "#eee",
	"fill-opacity": 0.3
};

var styles_per_player = [
    {
	"fill-color": "#0010a5",
	"fill-outline-color": "#fff",
	"fill-opacity": 0.2
    },
    {
	"fill-color": "#ff0000",
	"fill-outline-color": "#000",
	"fill-opacity": 0.2
    },
    {
	"fill-color": "#88ff00",
	"fill-outline-color": "#001",
	"fill-opacity": 0.4
    }
];

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
            "icon-offset":[0,-15],
            "text-field":players[player].name,
            "text-offset":[0,-2.5],
	    "text-size":12,
            "icon-size": 1
        },
        source: 'player_marker'+player
    });
}

function show_player_turf(map,player,style_index) {
    log(INFO,"player:" + player + " has style:" + style_index);
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
		paint: styles_per_player[style_index],
		id: "player"+player,
		source: 'player'+player,
		"source-layer": "player"+player
	    });
	}});
};

function show_open_turf(map) {
    $.ajax({
	cache:true,
	dataType: "json",
	url: "/world/hoods/open",
	success: function(content) {
	    map.addSource('open_hoods',
			  new mapboxgl.GeoJSONSource({
			      type: "geojson",
			      data: content}));
	    map.addLayer({
		type: "fill",
		paint: open_hood_style,
		id: "open_hoods",
		source: 'open_hoods',
		"source-layer": "open_hoods"
	    });
	}});
}

var foo = { player: "Eugene",
	    neighborhood: "Esquilino",
	    player_id: 196 };

function load_players(map) {
    $.ajax({
	async:true,
	cache:true,
	dataType: "json",
	url: "/world/players",
	success: function(content) {
	    // populate client-side 'player' db
	    players = {};
	    for (var i = 0; i < content.features.length; i++) {
		var id = content.features[i].properties.player_id;
		var player_record = { name: content.features[i].properties.player,
				      id: id,
				      style: i,
				      location: content.features[i]
				    }; 
		players[id] = player_record;
		show_player_marker(map,id);
		show_player_turf(map,id,i);
	    }
 	    $.get('/mst/playerbox.moustache', function(template) {
		$.each(players, function(key,value) {
		    $('#playerbox').append(Mustache.render(template,value));
		});
	    });
	}
    });
    show_open_turf(map);
}
