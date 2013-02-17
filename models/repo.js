var mongoose = require('mongoose')
  , Schema = mongoose.Schema;
  
  var RepoSchema = new Schema({
	repo_id : String,
	repo_name : String,
	date_created : Date,
	forked_from_repo : String
});

module.exports = mongoose.model('RepoModel', RepoSchema);