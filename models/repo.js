var mongoose = require('mongoose')
  , Schema = mongoose.Schema;
  
  var RepoSchema = new Schema({
	repo_id : Number,
	repo_name : String,
	date_created : String,
	forked_from : String
});

module.exports = mongoose.model('RepoModel', RepoSchema);
