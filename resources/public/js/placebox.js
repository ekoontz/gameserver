function update_placebox(osm,current_player_id) {
    var info = osm2info(osm);
    info.top_message = "PLACEBOX!";
    $.get('/mst/placebox.mustache', function(template) {
	// TODO: replace with #consolidated with #placebox when ready.
	$('#consolidated').html(Mustache.render(template, info));
    });
}
 
