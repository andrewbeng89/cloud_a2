var mongoose = require('mongoose')
  , Schema = mongoose.Schema;
  
  var WatchSchema = new Schema({
    user_id : Number,
	repo_id : Number
});

module.exports = mongoose.model('WatchModel', WatchSchema);
