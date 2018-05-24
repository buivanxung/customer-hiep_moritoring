
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

var arm = require('socket.io-client')('http://103.15.51.143:5000/');
arm.on('connect', function(){});
arm.on('event', function(data){});
arm.on('disconnect', function(){});

var serialport = require("serialport");
var comPortC = '/dev/ttyPHA2';
var portC = new serialport(comPortC, {
     baudRate: 9600
  });

var comPortR = '/dev/ttyPHA1';
var portR = new serialport(comPortR, {
     baudRate: 115200
  });

// Routing
app.get('/',function(req,res){
    res.render('index', { title: 'Moritoring' });
})

var status_control = false; // True automatic, false using hand
var status_cerrent = false; // Status cerrent control
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
  // Status  == true then automation else manual
  socket.on('web_control', function(data) {
      if (data == "R" && status_control == false) {
        portC.write ("A\n");
        console.log("write ss A");
        socket.emit('status', "R");
        status_cerrent = true;
      } else if (data == "S" && status_control == false){
        portC.write ("I\n");
        console.log("write ss I");
        socket.emit('status', "S");
        status_cerrent = false;
      }
    });
    socket.on('web_status', function(data) {
        if (data == "A") {
          status_control = true;
        } else if (data == "M"){
          status_control = false;
        }
	 console.log(" "+ data);
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
    if (check.length > 30) {
      var raw = check.split(",")
      var oxy = raw[2].split("=");
      var oxy_v = oxy[1];
      if (oxy_v < 9 && status_control == true) {
        portC.write ("A\n");
        console.log("write ss A");
        socket.emit('status', "R");
        status_cerrent = true;
      }else if(oxy_v > 12 && status_control == true) {
        portC.write ("I\n");
        console.log("write ss I");
        socket.emit('status', "S");
        status_cerrent = false;
      }
      socket.emit('feedback', data + " ");
      arm.emit('feedback', data + " ");
    }
  });
  portR.on('readable', function () {
      console.log('Data:', port.read());
  });
  setInterval(function () {
    if (status_control == false) {
      socket.emit('control_status', "F");
      arm.emit('server_control_status', "F");
    }else {
      socket.emit('control_status', "T");
      arm.emit('server_control_status', "T");
    }
    if (status_cerrent == false) {
      socket.emit('status', "S");
      arm.emit('server_status', "S");
    } else {
      socket.emit('status', "R");
      arm.emit('server_status', "R");
    }
	console.log(status_control);
  }, 5000);
  portC.on('error', function(err) {
  console.log('Error: ', err.message);
  })
  portR.on('error', function(err) {
  console.log('Error: ', err.message);
  })

  arm.on('connect', function(){
    console.log("Connect to Server!");
  });
  arm.on('server_web_control', function(data) {
      if (data == "R" && status_control == false) {
        portC.write ("A\n");
        console.log("write ss A");
        arm.emit('server_status', "R");
        status_cerrent = true;
      } else if (data == "S" && status_control == false){
        portC.write ("I\n");
        console.log("write ss I");
        arm.emit('server_status', "S");
        status_cerrent = false;
      }
      console.log(data);
    });
    arm.on('server_web_status', function(data) {
        if (data == "A") {
          status_control = true;
        } else if (data == "M"){
          status_control = false;
        }
       console.log(" "+ data);
      });
  arm.on('disconnect', function(){});
});


// server_status chi trang thai dang running hay stopping


http.listen(5000, function () {
  console.log("Server running");
});
