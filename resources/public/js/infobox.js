function update_infobox(info) {
    $.get('/mst/infobox.mustache', function(template) {
	$('#infobox').html(Mustache.render(template, info));
    });
}

