function userinput_initialize() {
    $("#userinput").keyup(respond_to_user_input);
    $("#userinput").val("");
    $("#userinput").focus();
    $('#response').html("<p class='input-spinner'>Please type something..<span class='fa fa-hand-o-up'> </span></p>");
}

function respond_to_user_input(event) {
    key_pressed = event.which;
    if (key_pressed != 13) {
	// send intermediate to language server:
	var user_input = $("#userinput").val().trim();
	if (user_input == "") {
            $('#response').html("<p class='input-spinner'>Please type something..<span class='fa fa-hand-o-up'> </span></p>");
	    return;
	}

        $('#response').html("<p class='input-spinner'><span class='fa fa-spinner fa-spin'> </span></p>");
	$.ajax({
	    cache: true,
	    type: "GET",
            url: "/world/say/"+user_input}).done(function(content) {
		var user_input_now = $("#userinput").val().trim();
		if (user_input_now != user_input) {
		    log(WARN,"user input has changed: ignoring this response.");
		    return;
		}
		log(INFO,"server responded; using contents to populate #response.");
		var vocab = [];
		if (content.vocab.length > 0) {
		    vocab = jQuery.map(content.vocab, function(word) {return {"word": word}});
		}
		var tenses;
		if (content.tenses.length > 0) {
		    tenses = jQuery.map(content.tenses, function(tense) {return {"tense": tense}});
		}

		var message = [];
		if ((content.tenses.length == 0) && (content.vocab.length == 0)) {
		    message = [{value: " "}];
		}
		
		$.get('/mst/response.mustache', function(template) {
		    $('#response').html(Mustache.render(template, {
			vocab:vocab,
			tenses:tenses,
			message:message
		    }));
		});
	    });
    }

    if (key_pressed == 13) {
	// user pressed return: send final results to language server:
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

