var DEFAULT_CONSTANTS = 1000000;

var mongoose = require("mongoose");
var constants = require("../front/js/constants.js");
var randomstring = require("randomstring");
var uuid = require("node-uuid");

mongoose.connect('mongodb://localhost/pokemon_go');

var db = mongoose.connection;
var GeoData;
var UserData;
var UserSession;

db.on('error', console.error.bind(console, 'connection error:'));
db.once('open', function() {
  console.log("connection ok");

  var GeoDataScheme = mongoose.Schema({
    user_uuid: String,
    type: Number,
    uuid: String,
    date: { type: Date, required: true, index:true},
    location: {
      type: [Number],  // [<longitude>, <latitude>]
      index: '2dsphere'      // geospatial index
    }
  });

  var UserDataScheme = mongoose.Schema({
    user_uuid: String,
    user_priv: String
  });

  GeoData = mongoose.model('GeoData', GeoDataScheme);
  UserData = mongoose.model('UserData', UserDataScheme);
});

function findUser(callback, uuid) {
  UserData
  .find({ "user_uuid": uuid })
  .select('-_id -__v')
  .limit(1)
  .exec(callback);
}

function _registerUser(callback) {
  var user_priv = randomstring.generate(40);
  var user_uuid = uuid.v4();
  var persistent_token = randomstring.generate(40);

  findUser(function (err, user){
    if(!user || user.length == 0) {
      user = new UserData({
        user_priv: user_priv,
        user_uuid: user_uuid,
        persistent_token: persistent_token
      });

      user.save(callback);
    }else{
      _registerUser(callback);
    }
  }, user_uuid);
}

function _findSessionForToken(token, callback) {
  UserData
  .find({persistent_token: token})
  .select('-_id -__v')
  .limit(1)
  .exec(callback);
}

module.exports.registerUser = function(callback) {
  _registerUser(callback);
}

module.exports.loginUser = function(uuid, token, callback) {
  findUser(function(err, user) {
    if(user && user.length == 1) user = user[0];

    if(user && user.user_priv == token) {
      callback(undefined, user);
    }else{
      callback("invalid user", undefined);
    }
  }, uuid);
}

module.exports.createSession = function(user_uuid, user_priv, callback) {
  findUser(function (err, user){
    if(user && user.user_priv == user_priv) {
      _findSessionForUserUUID(user_uuid, function(err, session) {
        if(session) {
          callback(undefined, session);
        }
      });
    }else{
      callback("unknown user", undefined);
    }
  }, user_uuid);
}

module.exports.removeGeoData = function(uuid, callback) {
  GeoData.remove({uuid: uuid}, callback);
}

module.exports.findGeoDataWhere = function(callback, where, with_id) {
  _findGeoDataWhere(callback, where, with_id);
}

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

  _findGeoDataWhere(lnk, callback);
}


module.exports.findPokemonAround = function(callback, geo) {
  geo = geo.split(",");
  if(geo.length < 2 || geo.length > 2) {
    geo.push(null);
    geo.push(null);
  }
  var lonLat = { $geometry :  { type : "Point" , coordinates : geo }, $maxDistance: DEFAULT_CONSTANTS };

  findGeoData({
    location: {
      $near: lonLat
    }
  }, 500, callback);
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

  findGeoData(lnk, 500, callback);
}

function _findGeoDataWhere(callback, where, with_id) {
  findGeoData(where, 500, callback, with_id);
}

function findGeoData(filter, card, callback, with_id){
  var find = GeoData.find(filter);

  if(!with_id) find = find.select('-_id -__v');

  find.limit(card)
  .exec(callback);
}

module.exports.newGeoData = function(params){
  return new GeoData(params);
}
