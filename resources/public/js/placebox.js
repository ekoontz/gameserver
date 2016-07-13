function update_placebox(osm,current_player_id) {
    var info = osm2info(osm);
    info.top_message = "Capture it!";
    if (current_player_id == info.owner_id) {
	info.top_message = "Defend it!";
    }
    if (!info.owner_id) {
	info.top_message = "Claim it!";
    }

    var random_style = ["","player0","player1","player2","player3"];
    
    info.vocab = jQuery.map(info.vocab_solved,function(item) {
	return {name: item,
		class: random_style[Math.floor(Math.random() * random_style.length)]}
    });

    info.tenses = jQuery.map(info.tenses_solved,function(item) {
	return {name: item,
		class: random_style[Math.floor(Math.random() * random_style.length)]};
    });

    if (!(typeof(info.vocab_unsolved) == "undefined")) {
	info.remaining_vocab = info.vocab_unsolved.length;
    } else {
	info.remaining_vocab = 0;
    }
    if (!(typeof(info.tenses_unsolved) == "undefined")) {
	info.remaining_tenses = info.tenses_unsolved.length;
    } else {
	info.remaining_tenses = 0;
    }
    
    $.get('/mst/placebox.mustache', function(template) {
	// TODO: replace with #consolidated with #placebox when ready.
	$('#placebox').html(Mustache.render(template, info));
    });
}
 
