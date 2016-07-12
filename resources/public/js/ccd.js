function update_ccd(name,css_class,owner) {    
    $.get('/mst/ccd.mustache', function(template) {
	$('#ccd').html(Mustache.render(template, {
    	    css_class:css_class
	}));
    });
}
    
