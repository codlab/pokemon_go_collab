var port = 3000;
var server = undefined;

var constants = require("./front/js/constants.js");
var config = require("./server/config.js");
var express = require("express");
var app = express();
var fs = require("fs");
var database = require("./server/database.js");
var moment = require("moment");
var validator = require('validator');
var uuid = require("node-uuid");
var bodyParser = require('body-parser')

if(config.key_pem && config.cert_pem && config.ca_pem && config.port){
  var https = require('https');

  server = https.createServer({
    key: fs.readFileSync(config.key_pem),
    cert: fs.readFileSync(config.cert_pem),
    ca: fs.readFileSync(config.ca_pem)
  }, app);
  port = config.port;
}else{
  server = require("http").Server(app);
}

var io = require("socket.io")(server);

app
.use(bodyParser.json())
.use(express.static("./front"))
.post("/api/user/register", function(req, res) {
  database.registerUser(function(err, user) {
    if(err) {
      res.status(404).json({error: true});
      return;
    }
    user.__v = undefined;
    user._id = undefined;
    res.json(user);
  });
})
.post("/api/user/login", function(req, res) {
  if(req.body.uuid && req.body.token){
    database.loginUser(req.body.uuid, req.body.token,
      function(err, user) {
        //if(err || !user) res.status(404).json({error: true});
        if(err || !user) res.status(404).json({error: err});
        else res.json(user);
      }
    );
  }else{
    res.status(404).json({error: true});
  }
})
.get("/api/locations/pokemon/around", function(req, res) {
  if(req.query.geo){
    database.findPokemonAround(function (err, geodatas){
      if(err) res.status(404).json({error: true});
      res.json(geodatas);
    }, req.query.geo);
  }else{
    res.status(404).json({error: true, reason:"invalid location"});
  }
})
.get("/api/locations/pokemon/:id", function(req, res) {
  var date = undefined;
  var id = parseInt(req.params.id);
  if(id < 0 || id > 151) id = 1;

  if(req.query.date){
    var date_parse = moment(req.query.date, moment.ISO_8601);
    date = date_parse.toDate();

    if(!date_parse.isValid()){
      res.status(404).json({error: true, reason:"invalid date"});
      return;
    }
  }

  database.findPokemon(function (err, geodatas){
    if(err) res.status(404).json({error: true, err:geodatas});
    res.json(geodatas);
  }, date, id);
})
.get("/api/locations", function(req, res) {
  var date = undefined;
  if(req.query.date){
    var date_parse = moment(req.query.date, moment.ISO_8601);
    date = date_parse.toDate();

    if(!date_parse.isValid()){
      res.status(404).json({error: true, reason:"invalid date"});
      return;
    }
  }

  database.findGeoData(function (err, geodatas){
    if(err) res.status(404).json({error: true, err:geodatas});
    res.json(geodatas);
  }, date);
});

function removeGeoData(socket, data, user) {
  if(user) {
    database.removeGeoData(data.uuid, function (err, res) {
      io.sockets.emit("deletedLocation",{
        "uuid" : data.uuid
      });
    });
  }
}

function saveGeoDataSent(socket, data, user_uuid) {
  var is_pokemon = false;
  var type = parseInt(validator.escape(""+data.type));
  var hour = validator.escape(""+data.hour);
  var GeoData = database.newGeoData({
    user_uuid: user_uuid,
    uuid: uuid.v4(),
    type: type,
    date: new Date(),
    specific_hour: hour,
    location: [
      data.location.lat,
      data.location.lng
    ]
  });

  GeoData.save(function(err, GeoData){
    if(type > 0 && type <= 151) {
      socket.emit("newGeoData", GeoData);
    }else{
      io.sockets.emit("newGeoData", GeoData);
    }
  });
}

function tryLoginUserInSocket(socket, user_uuid, user_token, callback) {
  database.loginUser(user_uuid, user_token,
    function(err, user) {
      if(user) {
        callback(user);
      }else{
        socket.emit("invalidUser", {
          error:true,
          message: "Wrong login?",
          err:err
        });
      }
    }
  );
}

io.on("connection", function (socket) {
  socket.on("deleteLocation", function (data) {
    var user_uuid = validator.escape(data.user_uuid);
    var user_token = data.user_token;

    if(user_uuid && user_token) {
      tryLoginUserInSocket(socket, user_uuid, user_token, function(user) {
        removeGeoData(socket, data, user_uuid);
      });
    }
  });

  socket.on("location", function (data) {
    var user_uuid = validator.escape(data.uuid);
    var user_token = data.token;

    if(user_uuid && user_token) {
      tryLoginUserInSocket(socket, user_uuid, user_token, function(user) {
        if(user) {
          saveGeoDataSent(socket, data, user.user_uuid);
        }
      });
    }else{
      saveGeoDataSent(socket, data, undefined);
    }
  });
});

server.listen(port);
