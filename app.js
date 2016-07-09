var express = require("express");
var app = express();
var server = require("http").Server(app);
var io = require("socket.io")(server);
app
.use(express.static('./front'));

io.on('connection', function (socket) {
  socket.on('location', function (data) {
    console.log(data);
  });
});

io.listen(app.listen(3000));
