
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
var array = fs.readFileSync("data/lang.txt").toString().split("\n");
var data_length = array.length;

function load_lang() {
	var repo_langs = [];
	
	for (var i = 0; i < data_length; i++) {
		var lineHash = TrimColon(array[i]).split(":");
		var repo_entry = {};
		repo_entry.repo_id = lineHash[0];
		repo_entry.langs = [];
		var langs = lineHash[1].toString().split(',');
		for (var count = 0; count < langs.length; count++) {
			var langHash = langs[count].toString().split(';');
			repo_entry.langs.push({_id:{$oid:new mongoose.Types.ObjectId},lang:langHash[0],lines:langHash[1]});
			repo_entry.langs.sort(function(a, b) {
				return b.lines - a.lines;
			});
		}
		repo_langs.push(repo_entry);
    }
    console.log(repo_langs);
    fs.writeFile('./data/lang.json', JSON.stringify(repo_langs), function (err) {
  		if (err) return console.log(err);
	});
}

load_lang();

http.createServer(app).listen(app.get('port'), function(){
  console.log("Express server listening on port " + app.get('port'));
});
