// Rough attempt to imitate http://logging.apache.org/log4j
// Eugene Koontz (ekoontz@hiro-tan.org)
// Licensed under Apache Software License version 2.
// 
// TODO: maybe add FATAL or CRITICAL or something even worse than ERROR.
var TRACE = 4;
var DEBUG = 3;
var INFO  = 2;
var WARN  = 1;
var ERROR  = 0;
var logging = {
    4 : "TRACE",
    3 : "DEBUG",
    2 : "INFO",
    1 : "WARN",
    0 : "ERROR"
};

var default_logging_level = INFO;

function log(level,str) {
    var use_logging_level;
    if (typeof(logging_level) == "undefined") {
	use_logging_level = default_logging_level;
    } else {
	use_logging_level = logging_level;
    }
    if (use_logging_level >= level) {
	console.log(logging[level] + ":" + str);
    }
}
