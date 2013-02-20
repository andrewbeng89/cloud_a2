
/**
 * Module dependencies.
 */

var express = require('express')
  , routes = require('./routes')
  , user = require('./routes/user')
  , http = require('http')
  , path = require('path')
  , AWS = require('aws-sdk')
  , fs = require('fs')
  , async = require('async');

var app = express();

app.configure(function(){
  app.set('port', process.env.PORT || 3000);
  app.set('views', __dirname + '/views');
  app.set('view engine', 'jade');
  app.use(express.favicon());
  app.use(express.logger('dev'));
  app.use(express.bodyParser());
  app.use(express.methodOverride());
  app.use(app.router);
  app.use(express.static(path.join(__dirname, 'public')));
});

app.configure('development', function(){
  app.use(express.errorHandler());
});

AWS.config.loadFromPath('./configuration.json');

app.get('/', routes.index);
app.get('/users', user.list);

var mongoose = require('mongoose'), watch = require('./models/watch'), repo = require('./models/repo');
mongoose.connect('mongodb://test:test1234@ds051067.mongolab.com:51067/is429_a2');

function TrimColon(text) {
	return text.toString().replace(/^(.*?):*$/, '$1');
}
var array = fs.readFileSync("data/data.txt").toString().split("\n");

var data_length = array.length;
var chunk_length = 100000;
var modulo = data_length % chunk_length;
var num_cycles;
if (modulo !== 0) {
	num_cycles = ((data_length - modulo) / chunk_length) + 1;
} else {
	num_cycles = (data_length - modulo) / chunk_length;
}

function save_data(start_index, end_index) {
	var functions = [];
	
	for (var i = start_index; i < end_index; i++) {
		var lineHash = TrimColon(array[i]).split(":");
		var watch_entry = new watch();
		watch_entry.user_id = lineHash[0];
		watch_entry.repo_id = lineHash[1];
		functions.push((function(doc) {
			return function() {
            	doc.save(function() {
            		console.log(doc.user_id + ' saved');
            	});
       		}
		})(watch_entry));
    }
	
	async.parallel(functions, function(err, results) {
    	console.log(err);
    	console.log(results);
	});
	functions = null;
}

app.get('/watches_per_repo', function(req, res) {
	var options = {
		map : function() {
			emit(this.repo_id, this.user_id);
		},
		reduce : function(k, user_id) {
			var reducedValue = {repo_id:k, num_watchers : Array.sum(user_id).length};
            return reducedValue;
		}
	}
	watch.mapReduce(options, function (err, results) {
		var filtered_results = [];
		for (var i = 0; i < results.length; i++) {
			if (typeof results[i].value !== 'string') {
				filtered_results.push(results[i]);
			}
		}
		filtered_results.sort(function(a, b) {
			return b.value.num_watchers - a.value.num_watchers;
		});
		console.log('done, number of results: ' + filtered_results.length);
	});
	res.json('map reduced');
});

http.createServer(app).listen(app.get('port'), function(){
  console.log("Express server listening on port " + app.get('port'));
});

var chunk_cycle_functions = [];
var start = 0;
var end = chunk_length;
for (var i = 0; i < 2; i++) {
	if (i != (num_cycles -1)) {
		chunk_cycle_functions.push((function(callback) {
			return function() {
            	callback(start, end);
       		}
		})(save_data));
		console.log('start: ' + start + ', end: ' + end);
	} else {
		chunk_cycle_functions.push((function(callback) {
			return function() {
            	callback(start, data_length);
       		}
		})(save_data));
		console.log('start: ' + start + ', end: ' + data_length);
	}
	start += chunk_length;
	end += chunk_length;
}
console.log(chunk_cycle_functions.length);

async.series(chunk_cycle_functions, function(err, results) {
   	if ( err) {   
        console.log('oh no errors!')
    } else {
        console.log('YAAAAAAY')
    }
});
