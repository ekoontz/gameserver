function update_player_marker(map,player) {
    // 1. show neighborhood of player:
    $("#player"+player+"-position").html(players[player].location.properties.neighborhood);
    // 2. show name of player:
    $("#player"+player+"-name").html(players[player].name);

    // 3. show marker of player in neighborhood:
    var source = map.getSource('player_marker'+player);
    if (typeof(source) == "undefined") {
	// if source is undefined, this is the
	// first call of update_player_marker().
	map.addSource('player_marker'+player,
		      new mapboxgl.GeoJSONSource({
			  type: "geojson",
			  data: players[player].location
		      }));
	source = map.getSource('player_marker'+player);
    }

    var layer = map.getLayer('player_marker'+player);
    if (typeof(layer) == "undefined") {
	// if layer is undefined, this is the
	// first call of update_player_marker().

	// TODO: let players choose their icon.
	icon = icons[player % icons.length];
	map.addLayer({
            id: "player_marker"+player,
            type: "symbol",
            layout: {
		"icon-image": icon,
		"icon-offset":[0,-15],
		"text-field":players[player].name,
		"text-offset":[0,-1.5],
		"text-size":12,
		"icon-size": 3
            },
            source: 'player_marker'+player
	});
	layer = map.getLayer('player_marker'+player);
    } else {
	// not the first call.
	source.setData(players[player].location);
    }
}

function show_player_turf(map,player,css_class) {
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
		paint: styles_per_player[css_class],
		id: "player"+player,
		source: 'player'+player,
		"source-layer": "player"+player
	    });
	}});
};

function update_player_turf(map,player,css_class) {
    $.ajax({
	cache:false,
	dataType: "json",
	url: "/world/player/"+player,
	success: function(content) {
	    map.getSource('player'+player).setData(content);
	}
    });
}

function update_players(map) {
    $.ajax({
	async:true,
	cache:true,
	dataType: "json",
	url: "/world/players",
	success: function(content) {
	    // populate client-side 'players' db
	    players = {};
	    for (var i = 0; i < content.features.length; i++) {
		var css_class = "player"+i;
		var player_id = content.features[i].properties.player_id;
		var player_record = {
		    name: content.features[i].properties.player,
		    id: player_id,
		    location: content.features[i],
		    css_class: css_class,
		}; 
		players[player_id] = player_record;
		update_player_marker(map,player_id);
//		update_player_turf(map,player_id,css_class);
	    }
 	    $.get('/mst/playerbox.mustache', function(template) {
		$.each(players, function(key,value) {
		    $("#player"+value.id+"_box").remove();
		    $('#playerbox').append(Mustache.render(template,value));
		});
	    });
	}
    });
}
