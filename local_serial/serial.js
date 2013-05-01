/*
Reads data from Windchimes via USB serial. 
Appends log to local JSON file.

Data model
dataLog:
{
	timeStamp,
	temperature,
	humidity,
	windSpeed,
	windDirection,
	rainSpeed,
	airQuality,
	noiseLevel,
}

Created by: Nick Wong, Windchimes
Data: 4/29/2013
*/

//Configurables
var outputFilename = "./windchimes.json";
var serialName = "/dev/tty.usbmodemfa131";
var serialBaud = 9600;
var delimiter = ',';
var endLine = "\r\n"
// end Configurables

var fs = require("fs");
var serialport = require("serialport");
var SerialPort = serialport.SerialPort;

var serialPort = new SerialPort(serialName, {
	baudrate: serialBaud,
	parser: serialport.parsers.readline(endLine),
});

serialPort.on("open", function () {
  console.log('open');
  serialPort.on('data', function(data) {
  	processData(data);
    console.log('data received: ' + data);
  });  
  serialPort.write("ls\n", function(err, results) {
    console.log('err ' + err);
    console.log('results ' + results);
  });  
});

function processData (data) {
	/* 
	Windchimes communicates data via USB serial with the following format:
	temperature,humidity,windSpeed,windDirection,rainSpeed,airQuality,noiseLevel'\r''\n'
	(The endline characters have been removed by the parser.)
	Timestamp is generated on server since Windchimes currently doesn't have a RTC.
	*/
	var dataString = data;
	var dataStringSplit = dataString.split(delimiter); 
	var date = new Date();
	
	var dataLog = new Object();
	dataLog.timeStamp = date.getTime();
	dataLog.temperature = parseFloat(dataStringSplit[0]);
	dataLog.humidity = parseFloat(dataStringSplit[1]);
	dataLog.windSpeed = parseFloat(dataStringSplit[2]);
	dataLog.windDirection = parseFloat(dataStringSplit[3]);
	dataLog.rainSpeed = parseFloat(dataStringSplit[4]);
	dataLog.airQuality = parseFloat(dataStringSplit[5]);
	dataLog.noiseLevel = parseFloat(dataStringSplit[6]);
	
	console.log(dataLog);
	fs.appendFile(outputFilename, JSON.stringify(dataLog, null, 2), function(err) {
    	if(err) {
      		console.log(err);
    	} else {
      	console.log("Log file updated.");
    	}
	}); 
}