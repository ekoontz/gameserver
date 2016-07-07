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

var logging_level = INFO;

function log(level,str) {
    if (logging_level >= level) {
	console.log(logging[level] + ":" + str);
    }
}
