var port = 3000;
var server = undefined;

var config = require("./server/config.js");
var express = require("express");
var app = express();
var fs = require("fs");
var database = require("./server/database.js");
var moment = require("moment");
var sanitize = require('validator').sanitize;

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
.get("/api/locations", function(req, res){
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
  console.log("client connected");
  socket.on('location', function (data) {
    var GeoData = database.newGeoData({
      name: sanitize(data.name).xss(),
      type: sanitize(data.type).toInt(),
      date: new Date(),
      location: [
        data.location.lng,
        data.location.lat
      ]
    });


    GeoData.save(function(err, GeoData){
      console.log("GeoData saved ");

      io.sockets.emit("newGeoData", GeoData);
    });
  });
});

server.listen(port);

