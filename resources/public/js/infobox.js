function update_infobox(new_hood_osm) {
    log(INFO,"update_infobox: " + new_hood_osm);
    var name = "Testaccio";
    var owner = "Eugene Koontz";
    var adjacencies = [{name:"Regola"},
		       {name:"Sant'Angelo"},
		       {name:"Pigna"}];

    var tokens = [{name:"cane",level:0},
		  {name:"ragazzo",level:1},
		  {name:"trapassato",meta:"meta",level:2}];
			
    $.get('/mst/infobox.mustache', function(template) {
	$('#infobox').html(Mustache.render(template,{
	    name:name,
	    owner:owner,
	    adjacencies:adjacencies,
	    tokens:tokens,
	}));
    });
}
