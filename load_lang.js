
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
mongoose.connect('mongodb://test:test1234@ds039467.mongolab.com:39467/cloud_a2');

function TrimColon(text) {
  	return text.toString().replace(/^(.*?):*$/, '$1');
}

// Read the .txt file and split by line
var array = fs.readFileSync("data/lang.txt").toString().split("\n");
var data_length = array.length;

function load_lang() {
	// Array to contain all repository objects
	var repo_langs = [];
	
	for (var i = 0; i < data_length; i++) {
		var lineHash = TrimColon(array[i]).split(":");
		// The repository object
		var repo_entry = {};
		repo_entry.repo_id = lineHash[0];
		// The langs[] of the repository object
		repo_entry.langs = [];
		var langs = lineHash[1].toString().split(',');
		for (var count = 0; count < langs.length; count++) {
			var langHash = langs[count].toString().split(';');
			// Push a new lang object for each language found in a repository
			repo_entry.langs.push({_id:{$oid:new mongoose.Types.ObjectId},lang:langHash[0],lines:langHash[1]});
			// Sort the lang objects by number of lines, descending
			repo_entry.langs.sort(function(a, b) {
				return b.lines - a.lines;
			});
		}
		repo_langs.push(repo_entry);
    }
    console.log(repo_langs);
    // Write JSON string to lang.json
    fs.writeFile('./data/lang.json', JSON.stringify(repo_langs), function (err) {
  		if (err) return console.log(err);
	});
}

// Execute loading function
load_lang();
