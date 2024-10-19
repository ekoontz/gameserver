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
    var tenses = osm2hood[osm].tenses;
    if (!(typeof(tenses) == "undefined")) {
	remaining_tenses = tenses.length;
    } else {
	remaining_tenses = 0;
    }
    var vocab = osm2hood[osm].vocab;
    if (!(typeof(vocab) == "undefined")) {
	remaining_vocab = vocab.length;
    } else {
	remaining_vocab = 0;
    }
    var info = {
	css_class: css_class,
	owner: owner_name,
	owner_id: owner_id,
	place_name: place_name,
	vocab: osm2hood[osm].vocab,
	tenses: tenses,
	remaining_tenses: remaining_tenses,
	remaining_vocab: remaining_vocab
    };
    return info;
}
