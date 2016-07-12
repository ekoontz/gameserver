function update_ccd(osm,current_player_id) {
    var info = osm2info(osm);
    info.top_message = "Capture it!";
    if (current_player_id == info.owner_id) {
	info.top_message = "Welcome home!";
    }
    if (!info.owner_id) {
	info.top_message = "Claim it!";
    }
    $.get('/mst/ccd.mustache', function(template) {
	$('#ccd').html(Mustache.render(template, info));
    });
}
 
