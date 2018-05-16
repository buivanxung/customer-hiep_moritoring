
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

var serialport = require("serialport");
var comPortC = '/dev/ttyPHA2';
var portC = new serialport(comPortC, {
     baudRate: 9600
  });

var comPortR = '/dev/ttyPHA1';
var portR = new serialport(comPortR, {
     baudRate: 115200
  });

function delay(ms) {
   ms += new Date().getTime();
   while (new Date() < ms){}
}
// Routing
app.get('/',function(req,res){
    res.render('index', { title: 'Moritoring' });
})

io.on('connection', function (socket) {
  console.log("New connection");
  socket.on('request', function(data) {
    console.log("Recived!");
    if (data == 12) {
      socket.emit('event', 12);
      console.log("Event sending!");
    }
  });
  socket.on('message_server',function(data){
    socket.broadcast.emit('message_client', data);
    console.log(data);
  });
  socket.on('control_status', function(data) {
    socket.broadcast.emit('client_control', data);
  });
  socket.on('web_control_status', function(data) {
    socket.broadcast.emit('client_control_status', data);
  });

  socket.on('feedback', function(data) {
    console.log(data);
    var date = new Date();
    InsertToDatabase(data, date.toLocaleTimeString(),date.toLocaleDateString());
    console.log("Success");
    socket.broadcast.emit('message', data);
  });
  socket.on('status', function(data) {
    socket.broadcast.emit('status_client', data);
    console.log(data);
  });

  ///Port C
  portC.on("open", function () {
     console.log ("comm portC ready");
  });
  portC.on('data', function (data) {
    console.log('Data sent:', data);
    socket.broadcast.emit('feedback', data);
  });
  portC.on('readable', function () {
      console.log('Data:', port.read());
      socket.emit('new data2', port.read());
  });

  /// Port R
  portR.on("open", function () {
     console.log ("comm portR ready");
  });
  portR.on('data', function (data) {
    console.log('Data sent:', data);
    socket.broadcast.emit('feedback', data);
  });
  portR.on('readable', function () {
      console.log('Data:', port.read());
      socket.emit('new data2', port.read());
  });
});



http.listen(5000, function () {
  console.log("Server running");
});
