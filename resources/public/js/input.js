function respond_to_user_input(event) {
    key_pressed = event.which;
    if (key_pressed != 13) {
	// send to language server:
	$.ajax({
	    cache: false,
	    type: "GET",
	    data: {expr: $("#userinput").val()},
            dataType: "json",
            url: "/world/say"}).done(function(content) {
		log(INFO,"server responded with content: " + content);
		var vocab = [];
		if (content.vocab.length > 0) {
		    vocab = jQuery.map(content.vocab, function(word) {return {"word": word}});
		}
		var tenses = [];
		if (content.tenses.length > 0) {
		    tenses = jQuery.map(content.tenses, function(tense) {return {"tense": tense}});
		}
		
		$.get('/mst/response.mustache', function(template) {
		    $('#response').html(Mustache.render(template, {
			vocab:vocab,
			tenses:tenses
		    }));
		});
	    });
    }

    if (key_pressed == 13) {
	// send to language server:
	$.ajax({
	    cache: false,
	    type: "POST",
	    data: {expr: $("#userinput").val()},
            dataType: "json",
            url: "/world/say"}).done(function(content) {
		log(INFO,"server responded with content: " + content);
		$("#userinput").val("");
		$("#userinput").focus();
		$("#response").html("");
	    });
    }
}

