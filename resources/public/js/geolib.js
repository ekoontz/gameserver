function highlight_polygon(map,polygon) {
    if (typeof(map.getSource('highlighted')) == "undefined") {
	map.addSource('highlighted',
		      new mapboxgl.GeoJSONSource({
			  type: "geojson",
			  data: polygon}));
    } else {
	var source = map.getSource('highlighted');
	source.setData(polygon);
    }
    if (typeof(map.getLayer('highlighted')) == "undefined") {
	map.addLayer({
	    type: "fill",
	    paint: highlighted_layer_style,
	    id: "highlighted",
	    source: 'highlighted',
	    "source-layer": "highlighted"
	});
    }
}

function add_or_update_layer(map,content,layer_spec) {
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
    log(INFO,"finished updating:" + source_name);
}
