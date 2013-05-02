var express = require('express');
var http = require('http');

var serialport = require('serialport');
var fs = require('fs');

var app = express(),
	server = http.createServer(app),
	http = require('http'),
	sio = require('socket.io');

var io = sio.listen(server);

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

var dataLog = new Array();

serialPort.on('open', function () {
	if (fs.existsSync(LOG_FILENAME)) {
		dataLog = require(LOG_FILENAME);	
	}
	console.log(dataLog);
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
	
	var dataLine = new Object();
	dataLine.time = date.getTime()/1000;
	dataLine.temp = parseFloat(dataStringSplit[0]);
	//dataLine.humidity = parseFloat(dataStringSplit[1]);
	dataLine.wind = parseFloat(dataStringSplit[2]);
	//dataLine.windDirection = parseFloat(dataStringSplit[3]);
	dataLine.rain = parseFloat(dataStringSplit[4]);
	dataLine.air = parseFloat(dataStringSplit[5]);
	dataLine.noise = parseFloat(dataStringSplit[6]);
	
	console.log(dataLine);
	dataLog.push(dataLine);
	
	fs.writeFile(LOG_FILENAME, JSON.stringify(dataLog, null, 2), function(err) {
    	if(err) {
      		console.log(err);
    	} else {
      	console.log('Log file updated.');
      	updateData('temp');
				updateData('wind');
				updateData('rain');
				updateData('air');
				updateData('noise');
    	}
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
	//res.send(generateInitial(req.query.series, means[req.query.series])); 
	res.send(populateInitial(req.query.series));
});

app.configure(function() {
	app.use(express.static(__dirname));
});

server.listen(process.env.VCAP_APP_PORT || 8080);


// Initializes starting data-set to be displayed.
// TO-DO: Load data from datalog file
function populateInitial(sensor) {

	var interval = 2*60*1000;

	var data = [{
		name: sensor,
		data: []
	}];
	
	var currentDate = new Date()/1000;
	var startDate = currentDate - interval;
	
	
	for (var i = 0; i < dataLog.length; i++) {
		var time = dataLog[i].time;
		if (time > startDate) {
			var value = dataLog[i][sensor];
			
			console.log(time);
			console.log(value);
			
			data[0].data.push({x: time, y: value});
		}
	}
	return data;
}

function updateData (sensor) {
	var latest = dataLog[dataLog.length-1],
		time = latest.time,
		value = latest[sensor];
	io.sockets.in(sensor).emit('update', {
		name: sensor,
		data: [{x: time, y: value}]
	});
}
