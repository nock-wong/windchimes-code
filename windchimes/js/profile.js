var socket = io.connect(host);

function createGraph(series, div) {
	var palette = new Rickshaw.Color.Palette();
	
	for (var i in series) {
		series[i].color = '#444444';
	}
	
	// instantiate our graph!
	var graph = new Rickshaw.Graph({
		element : div,
		width : 500,
		height : 120,
		renderer : 'line',
		interpolation : 'cardinal',
		series : series
	});

	graph.render();

	var x_axes = new Rickshaw.Graph.Axis.Time({
		graph : graph
	});
	x_axes.render();

	var y_axes = $('<div>').addClass('y-axis');
	$(div).before(y_axes);
	
	var y_axis = new Rickshaw.Graph.Axis.Y({
		graph : graph,
		orientation : 'left',
		tickFormat : Rickshaw.Fixtures.Number.formatKMBT,
		element : y_axes[0]
	});
	
	y_axis.render();
	
	return graph;
}

$(function() {
	var graphs = {};
	
	$.get('/data', {series: 'temp'}, function(data) {
		graphs['temp'] = createGraph(data, $('#history .history-block.temp .historical-chart').first()[0]);
		socket.emit('join', 'temp');
	}, 'json');
	
	$.get('/data', {series: 'wind'}, function(data) {
		graphs['wind'] = createGraph(data, $('#history .history-block.wind .historical-chart').first()[0]);
		socket.emit('join', 'wind');
	}, 'json');
	
	$.get('/data', {series: 'air'}, function(data) {
		graphs['air'] = createGraph(data, $('#history .history-block.air .historical-chart').first()[0]);
		socket.emit('join', 'air');
	}, 'json');
	
	$.get('/data', {series: 'rain'}, function(data) {
		graphs['rain'] = createGraph(data, $('#history .history-block.rain .historical-chart').first()[0]);
		socket.emit('join', 'rain');
	}, 'json');

	$.get('/data', {series: 'noise'}, function(data) {
		graphs['noise'] = createGraph(data, $('#history .history-block.noise .historical-chart').first()[0]);
		socket.emit('join', 'noise');
	}, 'json');
	
	var elapsed = 2 * 60;
	
	socket.on('update', function(dataset) {
		var series = graphs[dataset.name].series[0].data;
		
		series = series.concat(dataset.data);
		
		// remove data if we have more data than the amount of time elapsed
		if (series[series.length-1].x - series[0].x > elapsed)
			series.splice(0, dataset.data.length);
		
		graphs[dataset.name].series[0].data = series;
		
		graphs[dataset.name].update();
		$('.' + dataset.name + ' .sync').text(Math.round(series[0].y));
	});
});