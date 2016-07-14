// TODO: move ready_for_you to config.js and localize per-language.
var ready_for_you = "<p class='input-spinner'>Che ne dice? <span class='fa fa-hand-o-up'> </span></p>";

function userinput_initialize() {
    $("#userinput").keyup(respond_to_user_input);
    $("#userinput").val("");
    $("#userinput").focus();
    $('#response').html(ready_for_you);
}

function respond_to_user_input(event) {
    key_pressed = event.which;
    if (key_pressed != 13) {
	// send intermediate user input (i.e. input that the user hasn't necessarily finished)
	// to language server:
	var user_input = $("#userinput").val().trim();
	if (user_input == "") {
            $('#response').html(ready_for_you);
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

		var response = {};

		log(INFO,"server responded; using contents to populate #response.");
		if ((typeof(content.tenses) == "undefined") &&
		    (typeof(content.vocab) == "undefined")) {
		    log(DEBUG,"server didn't understand what you said.");
		    response.message = [{value: " "}];
		} else {
		    log(DEBUG,"server understood something of what you said.");
		    if (typeof(content.vocab) != "undefined") {
			response.vocab = jQuery.map(content.vocab, function(word) {return {"word": word}});
		    }
		    if (typeof(content.tenses) != "undefined") {
			response.tenses = jQuery.map(content.tenses, function(tense) {return {"tense": tense}});
		    }
		}
		
		$.get('/mst/response.mustache', function(template) {
		    $('#response').html(Mustache.render(template, response));
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

		var osm = players[current_player_id].location.properties.osm;	    
		update_placeinfo(osm,function() {
		    update_placebox(osm,current_player_id);
		});
	    });
    }
}

