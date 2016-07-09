function upsert_layer(map,content,layer_spec) {
    var source_name = layer_spec.source;
    var source = map.getSource(source_name);
    if (typeof(source) == "undefined") {
	var geojson = new mapboxgl.GeoJSONSource({
	    type: "geojson",
	    data: content
	});
	map.addSource(source_name,geojson);
	source = map.getSource(source_name);
    }
    // use same name for both source and layer.
    var layer = map.getLayer(source_name);
    if (typeof(layer) == "undefined") {
	map.addLayer(layer_spec);
	layer = map.getLayer(source_name);
    } else {
	source.setData(content);
    }
    log(DEBUG,"finished updating:" + source_name);
}

function highlight_polygon(map,polygon) {
    upsert_layer(map,polygon,{
        type: "fill",
        paint: highlighted_layer_style,
        id: "highlighted",
        source: 'highlighted',
        "source-layer": "highlighted"
    });
}

// TODO: this is too domain-specific than 'geo'
// since it mentions 'players'. it is here because
// we use it both in players.js and in actions.js, and
// geolib is the only common place to put stuff for now.
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
	    // get the player's count of how many places they control.
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

