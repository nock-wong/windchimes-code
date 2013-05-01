var express = require('express');

var http = require('http');

var app = express(),
	server = http.createServer(app),
	http = require('http'),
	sio = require('socket.io');

var io = sio.listen(server);

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

var means = {
		temp: 72,
		wind: 10,
		air: 30,
		rain: 50,
		noise: 30
}

app.get('/data', function(req, res) {
	res.type('application/javascript');
	res.send(generateInitial(req.query.series, means[req.query.series])); 
});

app.configure(function() {
	app.use(express.static(__dirname));
});

server.listen(process.env.VCAP_APP_PORT || 8080);

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

function generateData(room, mean) {
	io.sockets.in(room).emit('update', {
		name: room,
		data: [{x: new Date().getTime() / 1000, y: mean + 10 * Math.random() - 5}]
	});
}

setInterval(generateData, 2000, 'temp', 72);
setInterval(generateData, 2000, 'wind', 10);
setInterval(generateData, 2000, 'air', 30);
setInterval(generateData, 2000, 'rain', 50);
setInterval(generateData, 2000, 'noise', 30);