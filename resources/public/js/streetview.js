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

function initStreetView() {
    panorama = new google.maps.StreetViewPanorama(
	document.getElementById('streetview'), {
	    linksControl: false,
	    enableCloseButton:false,
	    fullscreenControl: false,
	    clickToGo: true
	});
}
