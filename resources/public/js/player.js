function update_player_marker(map,player) {
    // 1. show neighborhood of player:
    $("#player"+player+"-position").html(players[player].location.properties.neighborhood);
    // 2. show name of player:
    $("#player"+player+"-name").html(players[player].name);

    // TODO: let players choose their icon.
    // cf. playerbox.mustache
    icon = icons[player % icons.length];

    upsert_layer(map,players[player].location,
 		 {id: "player_marker"+player,
		  type: "symbol",
		  layout: {
		      "icon-image": icon,
		      "icon-offset":[0,-10],
		      "icon-size": 2
		  },
		  source: 'player_marker'+player});
}

function update_player_turf(map,player,css_class) {
    // TODO: should also update infobox, since infobox might contain information
    // about a place that's changed hands while the infobox about it is open.
    $.ajax({
	cache:false,
	dataType: "json",
	url: "/world/player/"+player,
	success: function(content) {
	    upsert_layer(map,content,{
		type: "fill",
		paint: styles_per_player[css_class],
		id: "player"+player,
		source: 'player'+player,
		"source-layer": "player"+player
	    });
	}});
}

function update_players(map) {
    $.ajax({
	async:true,
	cache:true,
	dataType: "json",
	url: "/world/players",
	success: function(content) {
	    update_players_from(map,content);
	}
    });
}

function update_players_from(map,content) {
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
	    icon: icons[player_id % icons.length],
	    points: 1, // TODO
	    // how many places each player controls.
	    places_count: content.features[i].properties.places_count
	}; 
	players[player_id] = player_record;
	update_player_marker(map,player_id);
	update_player_turf(map,player_id,css_class);
    }
    $.get('/mst/playerbox.mustache', function(template) {
	$.each(players, function(key,player_record) {
	    $("#player"+player_record.id+"_box").remove();
	    $('#playerbox').append(Mustache.render(template,player_record));
	    // add "onclick" for each playerbox:
	    $("#player"+player_record.id+"_box").click(
		function() {
		    map.flyTo({center: player_record.location.geometry.coordinates});
		});
	});
    });
}
