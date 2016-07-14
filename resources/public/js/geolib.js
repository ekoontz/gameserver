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

function replace_layer(map,content,layer_spec) {
    var source_name = layer_spec.source;
    var source = map.getSource(source_name);
    if (!(typeof(source) == "undefined")) {
	map.removeSource(source_name);
    }
    var geojson = new mapboxgl.GeoJSONSource({
	type: "geojson",
	data: content
    });
    map.addSource(source_name,geojson);
    source = map.getSource(source_name);

    // use same name for both source and layer.
    var layer = map.getLayer(source_name);
    if (!(typeof(layer) == "undefined")) {
	map.removeLayer(source_name);
    }
    map.addLayer(layer_spec);
    layer = map.getLayer(source_name);
    log(DEBUG,"finished replacing:" + source_name);
}

function highlight_polygon(map,polygon,layer_style) {
    replace_layer(map,polygon,{
        type: "fill",
        paint: layer_style,
        id: "highlighted",
        source: 'highlighted',
        "source-layer": "highlighted"
    });
}

function adjacent_osms(osm) {
    var adjacent_osm_set = adjacencies[osm];
    var adjacent_hoods = [];
    for (var i = 0; i < adjacent_osm_set.length; i++) {
	adjacent_hoods.push({
	    osm: adjacent_osm_set[i],
	    name: osm2hood[adjacent_osm_set[i]].name});
    }
    return adjacent_hoods;
}

function osm2info(osm) {
    var owner_name;
    var owner_id;
    if (osm2owner[osm]) {
	owner_name = players[osm2owner[osm]].name;
	owner_id = osm2owner[osm];
    }

    var css_class;
    if (owner_id && players[owner_id].css_class) {
	css_class = players[owner_id].css_class;
    } else {
	css_class = "open";
    }
    var place_name = osm2hood[osm].name;
    var info = {
	css_class: css_class,
	owner: owner_name,
	owner_id: owner_id,
	place_name: place_name,
	vocab_solved: osm2hood[osm].vocab_solved,
	vocab_unsolved: osm2hood[osm].vocab_unsolved,
	vocab_solvers: osm2hood[osm].vocab_solvers,
	tenses_solved: osm2hood[osm].tenses_solved,
	tenses_unsolved: osm2hood[osm].tenses_unsolved,
	tense_solvers: osm2hood[osm].tense_solvers
    };
    return info;
}

function update_placeinfo(osm_id, do_after_get) {
    // retrieve GeoJSON data for place whose osm id is _osm_id; after loading, call do_after_get().
    // TODO: we don't need to constantly refresh the place's polygon: this should be done only once
    var do_polygon = true;
    if ((!(typeof(osm2hood[osm_id]) == "undefined"))
	&&
	(!(typeof(osm2hood[osm_id].polygon) == "undefined"))) {
	do_polygon = false;
    }
    $.ajax({
	cache:true,
	dataType: "json",
	url: "/world/hoods/" + osm_id + "?polygon=" + do_polygon,
	success: function(content) {
	    // .. and save it so we don't need to do this server call again.
	    osm2hood[osm_id].polygon = content;
	    osm2hood[osm_id].vocab_solved = content.properties.vocab_solved;
	    osm2hood[osm_id].vocab_unsolved = content.properties.vocab_unsolved;
	    osm2hood[osm_id].vocab_solvers = content.properties.vocab_solvers;
	    osm2hood[osm_id].tenses_solved = content.properties.tenses_solved;
	    osm2hood[osm_id].tense_solvers = content.properties.tense_solvers;
	    osm2hood[osm_id].tenses_unsolved = content.properties.tenses_unsolved;
	    do_after_get(content);
	}
    });
}
