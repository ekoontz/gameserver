function update_infobox(hood_osm) {
    log(INFO,"update_infobox: " + hood_osm);
    var name = osm2hood[hood_osm].name;
    var owner = "";
    var css_class = "open";
    if (players && osm2owner[hood_osm] &&
	players[osm2owner[hood_osm]] &&
	players[osm2owner[hood_osm]].name) {
	owner = players[osm2owner[hood_osm]].name;
	if (players[osm2owner[hood_osm]].css_class) {
	    css_class = players[osm2owner[hood_osm]].css_class;
	}
    }
    log(INFO,"update_infobox: owner:" + owner);
    var tokens = [{name:"cane",level:0},
		  {name:"ragazzo",level:1},
		  {name:"trapassato",meta:"meta",level:2}];
			
    $.get('/mst/infobox.mustache', function(template) {
	$('#infobox').html(Mustache.render(template,{
	    name:name,
	    css_class:css_class,
	    owner:owner,
	    tokens:tokens,
	}));
    });
}
