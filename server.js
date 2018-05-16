
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
  portC.on("open", function (err) {
     if (err) {
       return console.log('Error opening port: ', err.message);
     } else {
       console.log ("comm portC ready");
     }
  });
  portR.on("open", function (err) {
    if (err) {
      return console.log('Error opening port: ', err.message);
    }else {
      console.log ("comm portR ready");
    }
  });

  portC.on('data', function (data) {
    console.log('Data sent C:', " "+ data);
  });
  portC.on('readable', function () {
      console.log('Data:', port.read());
  });

  /// Port R

  portR.on('data', function (data) {
    console.log('R:', "" +data);
    var check = " " + data;
    console.log(check.length);
    if (check.length > 22) {
      var status = check.split(",")
      var oxy = status[2].split("=");
      var oxy_v = oxy[1];
      if (oxy_v < 7) {
        portC.write ("A\n");
        console.log("write ss A");
        socket.broadcast.emit('status', "R");
      }else if(oxy_v > 15 ) {
        portC.write ("I\n");
        console.log("write ss I");
        socket.broadcast.emit('status', "S");
      }
      socket.broadcast.emit('feedback', data + " ");
    }
  });
  portR.on('readable', function () {
      console.log('Data:', port.read());
  });

  portC.on('error', function(err) {
  console.log('Error: ', err.message);
  })
  portR.on('error', function(err) {
  console.log('Error: ', err.message);
})

});

http.listen(5000, function () {
  console.log("Server running");
});
