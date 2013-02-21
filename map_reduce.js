
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

// Import mongoose and mongoose model shcemas required for the exercise
var mongoose = require('mongoose'), watch = require('./models/watch'), repo = require('./models/repo'), languages = require('./models/lang');
// Connect mongoose to MongoLab database
mongoose.connect('mongodb://test:test1234@ds039467.mongolab.com:39467/cloud_a2');

// Declare the MapReduce options for operation on the langmodels collection in MongoLab
var lang_map_options = {
	// Emit language:count pair for each language in the langs[] property of the model
	map : function() {
		for (var i = 0; i < this.langs.length; i++) {
			emit(this.langs[i].lang, 1);
		}
	},
	// Reduce the map output by summing the repo counts for each language
	reduce : function(k, count) {
		var reducedValue = {lang:k, num_repos: Array.sum(count).length};
		return reducedValue;
	},
	// Declare the output collection in MongoLab
	out : {
		replace : 'repos_per_language'
	},
	verbose : true
}
languages.mapReduce(lang_map_options, function(err, model, stats) {
	console.log('\nFind the programming language that is found \nacross the most number of repositories:');
	console.log('map reduce took %d ms', stats.processtime);
	// Aggregate the output collection model to find the language found in the most number of repos
	model.aggregate({
		$group: { _id: 'null', maxRepos: { $max: '$value.num_repos' }}
	},
	{
		$project: { _id: 0, maxRepos: 1 }
	}, 
	function (err, res) {
  		if (err) return handleError(err);
  		max_repos = res[0].maxRepos;
  		// Query output models to display the result of the aggregation
  		model.$where('this.value.num_repos == '+max_repos).exec(function (err, docs) {
  			console.log('language: ' + docs[0]._id + ', num_repos: ' + docs[0].value.num_repos);
  			if (err) return handleError(err);
  		});
	});
});

// Declare the MapReduce options for operation on the watchmodels collection in MongoLab
var options = {
	// Map repo_id to a user_id watching the repo
	map : function() {
		emit(this.repo_id, this.user_id);
	},
	// Reduce the map output by summing the user_ids
	reduce : function(k, user_id) {
		var reducedValue = {repo_id:k, num_watchers : Array.sum(user_id).length};
           return reducedValue;
	},
	// Declare the output collection in MongoLab
	out : { 
		replace : 'watchers_per_repo'
	},
	verbose : true
}

watch.mapReduce(options, function (err, model, stats) {
	console.log('\nFind the repo with the most number of wathcers:');	
	console.log('map reduce took %d ms', stats.processtime);
	var max_watchers;
	// Aggreate the output collection model to find the repository with the most watchers
	model.aggregate({
		$group: { _id: 'null', maxWatchers: { $max: '$value.num_watchers' }}
	},
	{
		$project: { _id: 0, maxWatchers: 1 }
	}, 
	function (err, res) {
  		if (err) return handleError(err);
  		max_watchers = res[0].maxWatchers;
  		console.log('most number of watchers per repo: ' + max_watchers);
  		model.$where('this.value.num_watchers == '+max_watchers).exec(function (err, docs) {
  			repo.findOne({repo_id:docs[0].value.repo_id}, function (err, doc) {
  				console.log('repo_id: ' + doc.repo_id + ', repo_name: ' + doc.repo_name);
  				// Find the primary language present in the repository
  				languages.findOne({repo_id:doc.repo_id.toString()}, function(err, doc) {
  					if (err) return handleError(err);
  					console.log('primary programming language of repo: ' + doc.langs[0].lang);
  				});
  				if (err) return handleError(err);
  			});
  			if (err) return handleError(err);
  		});
	});
});
