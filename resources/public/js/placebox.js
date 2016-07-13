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

    var random_style = ["","player0","player1","player2","player3"];
    
    info.vocab = jQuery.map(info.vocab,function(item) {
	return {name: item,
		class: random_style[Math.floor(Math.random() * random_style.length)]}
    });

    info.tenses = jQuery.map(info.tenses,function(item) {
	return {name: item,
		class: random_style[Math.floor(Math.random() * random_style.length)]};
    });
    
    $.get('/mst/placebox.mustache', function(template) {
	// TODO: replace with #consolidated with #placebox when ready.
	$('#placebox').html(Mustache.render(template, info));
    });
}
 
