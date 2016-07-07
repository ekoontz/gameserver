var mapbox_api_key = "pk.eyJ1IjoiZWtvb250eiIsImEiOiJpSkF1VU84In0.fYYjf551Wds8jyrYV5MFwg";

var Roma = [12.5012515,41.9012917];

var adjacencies = {};
var centroids = {};
var fitBounds = false;
var hoods = {};
var osm2hood = {};
var osm2owner = {};
var players = {};
var player_id;
var updateBearing = false;

// c.f. player.css
var open_hood_style = {
	"fill-color": "#ffffff",
	"fill-outline-color": "#333",
	"fill-opacity": 0.3
};

var styles_per_player = {
    "player0": {
	"fill-color": "#0010a5",
	"fill-outline-color": "#fff",
	"fill-opacity": 0.2
    },
    "player1": {
	"fill-color": "#ff0000",
	"fill-outline-color": "#000",
	"fill-opacity": 0.2
    },
    "player2": {
	"fill-color": "#88ff00",
	"fill-outline-color": "#001",
	"fill-opacity": 0.4
    }
};

var highlighted_layer_style = {
    "fill-color": "#cccccc",
    "fill-outline-color": "#111",
    "fill-opacity": 0.6
};
