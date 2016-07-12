var mongoose = require('mongoose');

mongoose.connect('mongodb://localhost/pokemon_go');

var db = mongoose.connection;
var GeoData;

db.on('error', console.error.bind(console, 'connection error:'));
db.once('open', function() {
  console.log("connection ok");

  var GeoDataScheme = mongoose.Schema({
    name: String,
    type: Number,
    date: { type: Date, required: true, index:true},
    location: {
      type: [Number],  // [<longitude>, <latitude>]
      index: '2d'      // geospatial index
    }
  });

  GeoData = mongoose.model('GeoData', GeoDataScheme);
});

module.exports.findGeoData = function(callback, date){
  var lnk = undefined;
  if (date) {
    lnk = { "date": {"$gt": date}};
  }

  GeoData
  .find(lnk)
  .select('-_id -__v')
  .limit(500)
  .exec(callback);
}
module.exports.newGeoData = function(params){
  return new GeoData(params);
}
