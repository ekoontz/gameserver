var google_api_key = "";
var mapbox_api_key = "";

var adjacencies = {};
var centroids = {};
var fitBounds = false;
var hoods = {};
var logging_level = INFO;
var map_refresh_interval = 10000;
var osm2hood = {};
var osm2owner = {};
var players = {};
var player_id;
var Roma = [12.5012515,41.9012917];
var updateBearing = false;

var icons = [
    "airport-15",
    "aquarium-15",
    "bicycle-15",
    "castle-15",
    "cinema-15",
    "college-15",
    "embassy-15",
    "music-15",
    "rocket-15",
    "zoo-15"
];

// c.f. player.css
var styles_per_player = {
    "player0": {
	"fill-color": "#0010a5", /* blue */
	"fill-outline-color": "#fff",
	"fill-opacity": 0.2 
    },
    "player1": {
	"fill-color": "#ff0000", /* red */
	"fill-outline-color": "#000",
	"fill-opacity": 0.5
    },
    "player2": {
	"fill-color": "#88ff00", /* yellow */
	"fill-outline-color": "#001",
	"fill-opacity": 0.4
    },
    "player3": {
	"fill-color": "#778800", /* green */
	"fill-outline-color": "#001",
	"fill-opacity": 0.4
    }
};

var open_hood_style = {
	"fill-color": "#cccccc",
	"fill-outline-color": "#111",
	"fill-opacity": 0.1
};
