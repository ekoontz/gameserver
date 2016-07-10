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
