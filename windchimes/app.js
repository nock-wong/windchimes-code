var express = require('express');

var http = require('http');

var serialport = require('serialport');

var fs = require('fs');

var app = express(),
	server = http.createServer(app),
	http = require('http'),
	sio = require('socket.io');

var io = sio.listen(server);

var currentDataLog = new Object();

/* SERIALPORT */

var SERIAL_NAME = '/dev/tty.usbmodemfa131',
	SERIAL_BAUD = 9600,
	SERIAL_DELIMITER = ',',
	SERIAL_ENDLINE = '\r\n';

var LOG_FILENAME = './windchimes_log.json';


var SerialPort = serialport.SerialPort;

var serialPort = new SerialPort(SERIAL_NAME, {
	baudrate: SERIAL_BAUD,
	parser: serialport.parsers.readline(SERIAL_ENDLINE)
});

serialPort.on('open', function () {
  console.log('Serial port open');
  serialPort.on('data', function(data) {
  	processSerialData(data);
    console.log('Serial data received: ' + data);
  });
});

function processSerialData (data) {
	/* 
	Windchimes communicates data via USB serial with the following format:
	temperature,humidity,windSpeed,windDirection,rainSpeed,airQuality,noiseLevel'\r''\n'
	(The endline characters have been removed by the parser.)
	Timestamp is generated on server since Windchimes currently doesn't have a RTC.
	*/
	var dataString = data;
	var dataStringSplit = dataString.split(SERIAL_DELIMITER); 
	var date = new Date();
	
	var dataLog = new Object();
	dataLog.timeStamp = date.getTime()/1000;
	dataLog.temperature = parseFloat(dataStringSplit[0]);
	dataLog.humidity = parseFloat(dataStringSplit[1]);
	dataLog.windSpeed = parseFloat(dataStringSplit[2]);
	dataLog.windDirection = parseFloat(dataStringSplit[3]);
	dataLog.rainSpeed = parseFloat(dataStringSplit[4]);
	dataLog.airQuality = parseFloat(dataStringSplit[5]);
	dataLog.noiseLevel = parseFloat(dataStringSplit[6]);
	
	console.log(dataLog);
	fs.appendFile(LOG_FILENAME, JSON.stringify(dataLog, null, 2), function(err) {
    	if(err) {
      		console.log(err);
    	} else {
      	console.log("Log file updated.");
    	}
	}); 
	
	pushData('temp', dataLog.timeStamp, dataLog.temperature);
	pushData('wind', dataLog.timeStamp, dataLog.windSpeed);
	pushData('rain', dataLog.timeStamp, dataLog.rainSpeed);
	pushData('air', dataLog.timeStamp, dataLog.airQuality);
	pushData('noise', dataLog.timeStamp, dataLog.noiseLevel);
	
	currentDataLog = dataLog;
}

function pushData (sensor, time, value) {
	io.sockets.in(sensor).emit('update', {
		name: sensor,
		data: [{x: time, y: value}]
	});
}

/* SOCKET.IO */

io.configure('production', function() {
	io.enable('browser client minification');  // send minified client
	io.enable('browser client etag');          // apply etag caching logic based on version number
	io.enable('browser client gzip');          // gzip the file
	io.set('log level', 1);                    // reduce logging
	
	io.set('transports', ['xhr-polling']);
});

io.configure('development', function() {
	io.set('transports', ['websocket']);
});

/* SOCKET CONNECTION */

io.sockets.on('connection', function(socket) {
	socket.on('join', function(room) {
		socket.join(room);
	});
});

/* APP */
var host = 'localhost:8080';

app.configure('production', function() {
	host = 'localhost:8080'; // TODO: change
});

app.get('/', function(req, res) {
	res.sendfile(__dirname + '/index.html');
});

app.get('/js/settings.js', function(req, res) {
	res.type('application/javascript');
	res.send('var host = "http://' + host + '";');
});

app.get('/data', function(req, res) {
	res.type('application/javascript');
	res.send(generateInitial(req.query.series, means[req.query.series])); 
});

app.configure(function() {
	app.use(express.static(__dirname));
});

server.listen(process.env.VCAP_APP_PORT || 8080);

var means = {
		temp: 72,
		wind: 10,
		air: 30,
		rain: 50,
		noise: 30
}

/* RANDOM */
function generateInitial(room, mean) {
	if (mean === undefined)
		mean = 5;
	
	var data = [{
		name: room,
		data: []
	}];
	
	var interval = 2 * 60 * 1000;
	var start = new Date().getTime() - interval;
	for (var i = start; i < start + interval; i += interval / 60) {
		data[0].data.push({x: i / 1000, y: mean + 10 * Math.random() - 5});
	}
	
	return data;
}

/*
function generateData(sensor, mean) {
	io.sockets.in(sensor).emit('update', {
		name: sensor,
		data: [{x: new Date().getTime() / 1000, y: mean + 10 * Math.random() - 5}]
	});
}
*/
/*
setInterval(generateData, 2000, 'temp', 72);
setInterval(generateData, 2000, 'wind', 10);
setInterval(generateData, 2000, 'air', 30);
setInterval(generateData, 2000, 'rain', 50);
setInterval(generateData, 2000, 'noise', 30);
*/