function update_placebox(osm,current_player_id) {
    var info = osm2info(osm);
    info.top_message = "Capture it!";
    if (current_player_id == info.owner_id) {
	info.top_message = "Defend it!";
    }
    if (!info.owner_id) {
	info.top_message = "Claim it!";
    }
    $.get('/mst/placebox.mustache', function(template) {
	// TODO: replace with #consolidated with #placebox when ready.
	$('#consolidated').html(Mustache.render(template, info));
    });
}
 
