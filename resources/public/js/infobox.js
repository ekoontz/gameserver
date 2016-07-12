function update_infobox(osm) {
    var info = osm2info(osm);
    $.get('/mst/infobox.mustache', function(template) {
	$('#infobox').html(Mustache.render(template, info));
    });
}


