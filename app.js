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
.use(express.static("./front"))
.get("/api/locations/pokemon/around", function(req, res) {
  if(req.query.geo){
    database.findPokemonAround(function (err, geodatas){
      if(err) res.status(404).json({error: true, err:err});
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

io.on('connection', function (socket) {
  socket.on('location', function (data) {
    var is_pokemon = false;
    var type = parseInt(validator.escape(""+data.type));
    var GeoData = database.newGeoData({
      name: validator.escape(data.name),
      uuid: uuid.v4(),
      type: type,
      date: new Date(),
      location: [
        data.location.lat,
        data.location.lng
      ]
    });


    GeoData.save(function(err, GeoData){
      console.log("GeoData saved ");
      if(type > 0 && type <= 151) {
        socket.emit('newGeoData', GeoData);
      }else{
        io.sockets.emit("newGeoData", GeoData);
      }
    });
  });
});

server.listen(port);
