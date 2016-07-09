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
		      "icon-offset":[0,-15],
		      "text-field":players[player].name,
		      "text-offset":[0,-1.5],
		      "text-size":12,
		      "icon-size": 3
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
