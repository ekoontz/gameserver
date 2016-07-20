var panorama;
function setGoogleStreetViewPosition(map,current_lat,current_long) {
    // use the same heading as the background map.
    var heading = Math.floor(Math.random() * 360);
    var pitch = 0;

    panorama.setPosition({
	lat: current_lat,
	lng: current_long});
    panorama.setPov({
	heading: map.getBearing(),
	pitch: pitch
    });
}

function initPano() {
    panorama = new google.maps.StreetViewPanorama(
	document.getElementById('streetview'), {
	    linksControl: false,
	    enableCloseButton:false,
	    fullscreenControl: false,
	    clickToGo: true
	});
}

function initStreetView() {
    if (googleStreetViewPosition == true) {
	var s = document.createElement("script");
	s.type = "text/javascript";
	s.src = "https://maps.googleapis.com/maps/api/js?key=" + google_api_key + "&callback=initPano";
	$("head").append(s);
    }
}
