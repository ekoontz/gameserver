function update_player_marker(map,player,current_player_id) {
    // 1. show neighborhood of player:
    $("#player"+player+"-position").html(players[player].location.properties.neighborhood);
    // 2. show name of player:
    $("#player"+player+"-name").html(players[player].name);

    // TODO: let players choose their icon.
    // cf. playerbox.mustache
    icon = icons[player % icons.length];

    var icon_size = default_icon_size;
    if (player == current_player_id) {
	icon_size++;
    }

    upsert_layer(map,players[player].location,
 		 {id: "player_marker"+player,
		  type: "symbol",
		  layout: {
		      "icon-image": icon,
		      "icon-offset": [0,-10],
		      "icon-size": icon_size
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

function update_players(map,current_player_id,post_load_function) {
    $.ajax({
	async:true,
	cache:true,
	dataType: "json",
	url: "/world/players",
	success: function(content) {
	    update_players_from(map,content,current_player_id);
	    if (post_load_function) {
		post_load_function();
	    }
	}
    });
}

function update_players_from(map,content,current_player_id) {
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
	update_player_marker(map,player_id,current_player_id);
	update_player_turf(map,player_id,css_class);
    }
    $.get('/mst/playerbox.mustache', function(template) {
	$.each(players, function(key,player_record) {
	    var box_id = "player"+player_record.id+"_box";
	    $("#"+box_id).remove();
	    if (player_record.id == current_player_id) {
		// let current player's icon be a bit larger:
		player_record.icon_width = 30;
	    } else {
		player_record.icon_width = 20;
	    }
	    var playerbox = Mustache.render(template,player_record);
	    if (player_record.id == current_player_id) {
		$('#me').append(playerbox);
		$("#me").click(
		    function() {
			map.setZoom(zoom_level);
			map.flyTo({center: player_record.location.geometry.coordinates});
		    });
	    } else {		
		$('#playerbox').append(playerbox);
		$("#"+box_id).click(
		    function() {
			map.setZoom(zoom_level);
			map.flyTo({center: player_record.location.geometry.coordinates});
		    });
	    }
	});
    });
}


