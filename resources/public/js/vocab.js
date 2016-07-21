function load_vocab() {
//    $('#vocab-contents').html("<p class='input-spinner'><span class='fa fa-spinner fa-spin'> </span></p>");

    $.ajax({cache: true,
	    type: "GET",
            url: "/world/vocab"}).done(
		function(content) {
		    var foo = 42;
		}
	    );
}

    

	    
