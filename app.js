var express = require("express");
var app = express();
var server = require("http").Server(app);
var io = require("socket.io")(server);
var database = require("./server/database.js");
var moment = require("moment");
var sanitize = require('validator').sanitize;

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

io.listen(app.listen(3000));
