
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

var s_status = false;
var c_status = false;
io.on('connection', function (socket) {
  console.log("New connection");
  // Status  == true then automation else manual
  socket.on('server_web_control', function(data) {
      if (data == "R" && s_status == false) {
        socket.emit('server_status', "R");
        c_status = true;
      } else if (data == "S" && s_status == false){
        socket.emit('server_status', "S");
        c_status = false;
      }
    });
    socket.on('server_web_status', function(data) {
        if (data == "A") {
          s_status = true;
        } else if (data == "M"){
          s_status = false;
        }
	 console.log(" "+ data);
      });
  setInterval(function () {
    if (s_status == false) {
      socket.emit('server_control_status', "F");
    }else {
      socket.emit('server_control_status', "T");
    }
    if (c_status == false) {
      socket.emit('server_status', "S");
    } else {
      socket.emit('server_status', "R");
    }
	console.log(s_status);
  }, 5000);
});
http.listen(5000, function () {
  console.log("Server running");
});
