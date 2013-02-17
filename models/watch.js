var mongoose = require('mongoose')
  , Schema = mongoose.Schema;
  
  var WatchSchema = new Schema({
    user_id : String,
	repo_id : String
});

module.exports = mongoose.model('WatchModel', WatchSchema);