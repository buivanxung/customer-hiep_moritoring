
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
  ///Port C
  portC.on("open", function () {
     console.log ("comm portC ready");
  });
  portC.on('data', function (data) {
    console.log('Data sent C:', " "+ data);
  });
  portC.on('readable', function () {
      console.log('Data:', port.read());
  });

  /// Port R
  portR.on("open", function () {
     console.log ("comm portR ready");
  });
  portR.on('data', function (data) {
    console.log('R:', "" +data);
    socket.broadcast.emit('feedback', data + ",R");
  });
  portR.on('readable', function () {
      console.log('Data:', port.read());
  });
});



http.listen(5000, function () {
  console.log("Server running");
});
