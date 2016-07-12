function update_ccd(info) {
    $.get('/mst/ccd.mustache', function(template) {
	$('#ccd').html(Mustache.render(template, info));
    });
}
 
