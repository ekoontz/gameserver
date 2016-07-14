function update_placebox(osm,current_player_id) {
    var info = osm2info(osm);
    info.top_message = "Capture it!";
    if (current_player_id == info.owner_id) {
	info.top_message = "Defend it!";
    }
    if (!info.owner_id) {
	info.top_message = "Claim it!";
    }

    info.vocab = [];
    // first solved, then unsolved, since vocab is on the left of the layout
    for (var i = 0; i < info.vocab_solved.length; i++) {
	info.vocab.push({name: info.vocab_solved[i],
			 class: players[info.vocab_solvers[i]].css_class});
    };
    for (var i = 0; i < info.vocab_unsolved.length; i++) {
	info.vocab.push({name: info.vocab_unsolved[i],
			 class: "unsolved"});
    };

    info.tenses = [];
    // first unsolved, then solved, since tenses are on the right of the layout
    for (var i = 0; i < info.tenses_unsolved.length; i++) {
	info.tenses.push({name: info.tenses_unsolved[i],
			  class: "unsolved"});
    };
    for (var i = 0; i < info.tenses_solved.length; i++) {
	info.tenses.push({name: info.tenses_solved[i],
			  class: players[info.tense_solvers[i]].css_class});
    };

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
 
