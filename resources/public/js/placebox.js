function get_expressions(osm) {
    $.ajax({
	cache:false,
	url: "/world/expr/" + osm,
	success: function(content) {
	    $.get('/mst/expressions.mustache', function(template) {
		$('#expressions').html(Mustache.render(template, content));
	    });
	}
    });
}

function update_placebox(osm,current_player_id) {
    var info = osm2info(osm);
    info.top_message = "Capture " + info.place_name + "!";
    if (current_player_id == info.owner_id) {
	info.top_message = "Defend " + info.place_name + "!";
	info.cue = "Add more sentences to make it harder for other players to capture this place.";
    } else {
	if (!info.owner_id) {
	    info.top_message = "Claim " + info.place_name + "!";
	    if (!(typeof(info.vocab_solved) == "undefined") &&
		(info.vocab_solved.length > 0)) {
		info.cue = "Create sentences using these words and grammar.";
	    } else {
		info.cue = "Create sentences for this place.";
	    }
	} else {
	    info.cue = "Create sentences using these words and grammar.";
	}
    }

    info.vocab = [];
    var counts_per_item_and_player = {};

    // TODO: maybe just move this to server-side SQL statements; would be simpler and easier to understand.
    // first solved, then unsolved, since vocab is on the left of the layout
    if (!(typeof(info.vocab_solved) == "undefined")) {
	// compute counts of vocab items per item+player.
	for (var i = 0; i < info.vocab_solved.length; i++) {
	    var item = info.vocab_solved[i];
	    var player = info.vocab_solvers[i];
	    if (typeof(counts_per_item_and_player[item]) == "undefined") {
		counts_per_item_and_player[item] = {};
		counts_per_item_and_player[item][player] = 1;
	    } else {
		if (typeof(counts_per_item_and_player[item][player]) == "undefined") {
		    counts_per_item_and_player[item][player] = 1;
		} else {
		    counts_per_item_and_player[item][player]++;
		}
	    }
	}
	
	for (var i = 0; i < info.vocab_solved.length; i++) {
	    var item = info.vocab_solved[i];
	    var player = info.vocab_solvers[i];
	    if (counts_per_item_and_player[item][player] != 0) {
		var instances = counts_per_item_and_player[item][player];
		if (instances == 1) {
		    instances = ""; // hide the badge if there's only 1: same as no badge at all.
		}
		var css_class = players[info.vocab_solvers[i]].css_class;
		// don't show item if it's already solved by this player.
		if (player_id == info.vocab_solvers[i]) {
		    css_class = "display-none";
		    instances = "";
		}
		info.vocab.push({name: info.vocab_solved[i],
				 instances: instances,
				 class: css_class});
		counts_per_item_and_player[item][player] = 0; // flag that we are done with this item/player pair.
	    }
	}
    }
    if (!(typeof(info.vocab_unsolved) == "undefined")) {
	for (var i = 0; i < info.vocab_unsolved.length; i++) {
	    info.vocab.push({name: info.vocab_unsolved[i],
			     class: "unsolved"});
	};
    }

    info.tenses = [];
    var counts_per_item_and_player = {};

    // first unsolved, then solved, since tenses are on the right of the layout.
    if (!(typeof(info.tenses_unsolved) == "undefined")) {
	for (var i = 0; i < info.tenses_unsolved.length; i++) {
	    info.tenses.push({name: info.tenses_unsolved[i],
			      class: "unsolved"});
	};
    }
    
    if (!(typeof(info.tenses_solved) == "undefined")) {
	// compute counts of vocab items per item+player.
	for (var i = 0; i < info.tenses_solved.length; i++) {
	    var item = info.tenses_solved[i];
	    var player = info.tense_solvers[i];
	    if (typeof(counts_per_item_and_player[item]) == "undefined") {
		counts_per_item_and_player[item] = {};
		counts_per_item_and_player[item][player] = 1;
	    } else {
		if (typeof(counts_per_item_and_player[item][player]) == "undefined") {
		    counts_per_item_and_player[item][player] = 1;
		} else {
		    counts_per_item_and_player[item][player]++;
		}
	    }
	}

	for (var i = 0; i < info.tenses_solved.length; i++) {
	    var item = info.tenses_solved[i];
	    var player = info.tense_solvers[i];
	    var instances = counts_per_item_and_player[item][player];
	    if (instances == 1) {
		instances = ""; // hide the badge if there's only 1: same as no badge at all.
	    }
	    var css_class = players[info.tense_solvers[i]].css_class;
	    // don't show item if it's already solved by this player.
	    if (player_id == info.tense_solvers[i]) {
		css_class = "display-none";
		instances = "";
	    }
	    if (counts_per_item_and_player[item][player] != 0) {
		info.tenses.push({name: info.tenses_solved[i],
				  instances: instances,
				  class: css_class});
		counts_per_item_and_player[item][player] = 0; // flag that we are done with this item/player pair.
	    }
	};
    }

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
	$('#placebox').html(Mustache.render(template, info));
	$('#placebox').addClass('animated fadeIn');
	if (current_player_id == info.owner_id) {
	    get_expressions(osm);
	}
    });
}
 
