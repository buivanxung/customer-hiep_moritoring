
// Setup basic express server
var express = require('express');
var app = express();
var http = require('http').Server(app);
var io = require('socket.io')(http);
app.engine('html', require('ejs').renderFile);
app.use(require('stylus').middleware({ src: __dirname + '/' }));
app.use(express.static(__dirname + '/'));
app.set('view engine', 'ejs');
app.set('views', __dirname + '/');

// Routing
app.get('/',function(req,res){
    res.render('index', { title: 'Moritoring' });
})

var status_control = false;
var status_cerrent = false;
io.on('connection', function (socket) {
  console.log("New connection");
  // Status  == true then automation else manual
  socket.on('server_web_control', function(data) {
      if (data == "R" && status_control == false) {
        socket.broadcast.emit('webtoserver_control', "R");
        status_cerrent = true;
      } else if (data == "S" && status_control == false){
        socket.broadcast.emit('webtoserver_control', "S");
        status_cerrent = false;
      }
      console.log(data);
    });
  socket.on('server_web_status', function(data) {
        if (data == "A") {
          status_control = true;
        } else if (data == "M"){
          status_control = false;
        }
	       console.log(" "+ data);
      });
  socket.on('server_control_status', function(data) {
        if (data == "T") {
          status_control = true;
        } else if (data == "F"){
          status_control = false;
        }
         console.log(" "+ data);
      });
  socket.on('server_status', function(data) {
        if (data == "R") {
          status_cerrent = true;
        } else if (data == "S"){
          status_cerrent = false;
        }
         console.log(" "+ data);
      });
  socket.on('feedback', function(data) {
      socket.broadcast.emit('server_feedback', data);
      console.log("R"+ data);
      });
  setInterval(function () {
    if (status_control == false) {
      socket.broadcast.emit('server_control_status', "F");
    }else {
      socket.broadcast.emit('server_control_status', "T");
    }
    if (status_cerrent == false) {
      socket.broadcast.emit('server_status', "S");
    } else {
      socket.broadcast.emit('server_status', "R");
    }
	console.log("request " +status_control);
  }, 5000);
});
http.listen(5000, function () {
  console.log("Server running");
});
