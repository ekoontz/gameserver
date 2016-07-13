function update_placebox(osm,current_player_id) {
    var info = osm2info(osm);
    info.top_message = "Capture it!";
    if (current_player_id == info.owner_id) {
	info.top_message = "Defend it!";
    }
    if (!info.owner_id) {
	info.top_message = "Claim it!";
    }

    info.remaining_vocab = 21;
    info.remaining_grammar = 42;

    info.vocab = [{name: "mangiare",
		   class: "player2"},
		  {name: "parlare"}];

    info.tenses = [{name: "imperfetto"},
		   {name: "passato prossimo",
		    class: "player0"}];
    
    $.get('/mst/placebox.mustache', function(template) {
	// TODO: replace with #consolidated with #placebox when ready.
	$('#placebox').html(Mustache.render(template, info));
    });
}
 
