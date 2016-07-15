var mongoose = require("mongoose");
var constants = require("../front/js/constants.js");
var DEFAULT_CONSTANTS = 1000000;
mongoose.connect('mongodb://localhost/pokemon_go');

var db = mongoose.connection;
var GeoData;

db.on('error', console.error.bind(console, 'connection error:'));
db.once('open', function() {
  console.log("connection ok");

  var GeoDataScheme = mongoose.Schema({
    name: String,
    type: Number,
    uuid: String,
    date: { type: Date, required: true, index:true},
    location: {
      type: [Number],  // [<longitude>, <latitude>]
      index: '2dsphere'      // geospatial index
    }
  });

  GeoData = mongoose.model('GeoData', GeoDataScheme);
});

module.exports.findGeoData = function(callback, date){
  var lnk = undefined;
  if (date) {
    lnk = {
      "date": {"$gt": date},
      "$or": [
        { "type": constants.types.POKESTOP },
        { "type": constants.types.POKEGYM }
      ]
    };
  }else{
    lnk = {
      "$or": [
        { "type": constants.types.POKESTOP },
        { "type": constants.types.POKEGYM }
      ]
    };
  }

  GeoData
  .find(lnk)
  .select('-_id -__v')
  .limit(500)
  .exec(callback);
}


module.exports.findPokemonAround = function(callback, geo) {
  geo = geo.split(",");
  if(geo.length < 2 || geo.length > 2) {
    geo.push(null);
    geo.push(null);
  }
  var lonLat = { $geometry :  { type : "Point" , coordinates : geo }, $maxDistance: DEFAULT_CONSTANTS };

  GeoData
  .find({
    location: {
      $near: lonLat
    }
  })
  .select('-_id -__v')
  .limit(500)
  .exec(callback);
}

module.exports.findPokemon = function(callback, date, type){
  var lnk = undefined;
  if (date) {
    lnk = {
      "date": {
        "$gt": date
      },
      "type": type
    };
  }else{
    lnk = {
      "type": type
    };
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
