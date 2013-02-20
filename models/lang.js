var mongoose = require('mongoose')
  , Schema = mongoose.Schema;
  
	var LangSchema = new Schema({
		lang: String,
    	lines: String
	});
  
 	var LanguagesSchema = new Schema({
		repo_id : String,
		langs : [LangSchema]
	});

module.exports = mongoose.model('LangModel', LanguagesSchema);
