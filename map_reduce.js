
/**
 * Module dependencies.
 */

var express = require('express')
  , routes = require('./routes')
  , user = require('./routes/user')
  , http = require('http')
  , path = require('path')
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

app.get('/', routes.index);
app.get('/users', user.list);

var mongoose = require('mongoose'), watch = require('./models/watch'), repo = require('./models/repo'), languages = require('./models/lang');
mongoose.connect('mongodb://test:test1234@ds051067.mongolab.com:51067/is429_a2');

var options = {
	map : function() {
		emit(this.repo_id, this.user_id);
	},
	reduce : function(k, user_id) {
		var reducedValue = {repo_id:k, num_watchers : Array.sum(user_id).length};
           return reducedValue;
	},
	out : { 
		replace : 'watchers_per_repo'
	},
	verbose : true
}
watch.mapReduce(options, function (err, model, stats) {
	console.log('map reduce took %d ms', stats.processtime);
	var max_watchers;
	model.aggregate({
		$group: { _id: 'null', maxWatchers: { $max: '$value.num_watchers' }}
	},
	{
		$project: { _id: 0, maxWatchers: 1 }
	}, 
	function (err, res) {
  		if (err) return handleError(err);
  		max_watchers = res[0].maxWatchers;
  		console.log(max_watchers);
  		model.$where('this.value.num_watchers == '+max_watchers).exec(function (err, docs) {
  			console.log(docs);
  			repo.findOne({repo_id:docs[0].value.repo_id}, function (err, doc) {
  				console.log(doc.repo_name);
  				languages.findOne({repo_id:doc.repo_id.toString()}, function(err, doc) {
  					console.log(err);
  					console.log(doc);
  				});
  				console.log(err);
  			});
  			console.log(err);
  		});
	});
});

http.createServer(app).listen(app.get('port'), function(){
  console.log("Express server listening on port " + app.get('port'));
});
