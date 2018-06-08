
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

var http_server = require('request');

var maxTemp = 30;
var minTemp = 26;
var maxOxy = 10;
var minOxy = 3;
var maxCond = 35;
var minCond = 28;
var maxPh = 8;
var minPh = 6.5;
var ledOxy = true;
var ledCond = true;
var ledPh = true;
var ledTemp = true;
var ledStatus = true;

var headers = {
    'User-Agent':       'Super Agent/0.0.1',
    'Content-Type':     'application/x-www-form-urlencoded'
}
var temperature, ph, conductivity, oxy_v, batery,temperature_v, ph_v, conductivity_v, batery_v;

var options = {
    url: 'http://demo.phadistribution.com:80/parser_data_for_waspmote.php?',
    method: 'POST',
    headers: headers,
    form: {'wasp_id': '506437057C10542F', 'BAT': ""+ batery, 'WT':""+temperature, 'PH': ""+ph, 'DO': ""+oxy_v, 'ORP': '0', 'COND': ""+conductivity, 'P_H2S':'0', 'ALKA': '0', 'TURB':'0','view':'html'}
}


var arm = require('socket.io-client')('http://103.15.51.143:5000/');

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
    if (check.length > 36) {
      var raw = check.split(",")
      var oxy = raw[2].split("=");
      oxy_v = oxy[1];
      temperature = raw[0].split("=");
      temperature_v = temperature[1];
      conductivity = raw[1].split("=");
      conductivity_v = conductivity[1];
      ph = raw[3].split("=");
      ph_v = ph[1];
      batery = raw[4].split("=");
      batery_v = batery[1];
      if (oxy_v < minOxy && ledStatus == true) {
        portC.write ("B\c");
        console.log("write ss B");
        ledStatus = false;
      }else if (oxy_v > minOxy && ledStatus == false){
        portC.write ("K\n");
        console.log("write ss J");
        ledStatus = true;
      }
      if (conductivity_v < minCond && ledStatus == true) {
        portC.write ("B\c");
        console.log("write ss C");
        ledStatus = false;
      }else if (conductivity_v > minCond && ledStatus == false){
        portC.write ("K\n");
        console.log("write ss J");
        ledStatus = true;
      }
      if (temperature_v < minTemp && ledStatus == true) {
        portC.write ("B\c");
        console.log("write ss D");
        ledStatus = false;
      }else if (temperature_v > minTemp && ledStatus == false){
        portC.write ("K\n");
        console.log("write ss L");
        ledStatus = true;
      }
      if (ph_v < minPh && ledStatus == true) {
        portC.write ("B\c");
        console.log("write ss E");
        ledStatus = false;
      }else if (ph_v > minPh && ledStatus == false){
        portC.write ("K\n");
        console.log("write ss M");
        ledStatus = true;
      }
      if (oxy_v < minOxy && status_control == true) {
        portC.write ("A\n");
        console.log("write ss A");
        socket.emit('status', "R");
        status_cerrent = true;
      }else if(oxy_v > maxOxy && status_control == true) {
        portC.write ("I\n");
        console.log("write ss I");
        socket.emit('status', "S");
        status_cerrent = false;
      }
      socket.emit('feedback', data + " ");
      arm.emit('feedback', data + " ");
      f_postData();
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
});
// server_status chi trang thai dang running hay stopping
arm.on('connect', function(){
  console.log("Connect to Server!");
});
arm.on('webtoserver_control', function(data) {
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
  arm.on('servertoweb_status', function(data) {
      if (data == "A") {
        status_control = true;
      } else if (data == "M"){
        status_control = false;
      }
     console.log(" "+ data);
    });
arm.on('disconnect', function(){});

function f_postData() {
  options = {
      url: 'http://demo.phadistribution.com:80/parser_data_for_waspmote.php?',
      method: 'POST',
      headers: headers,
      form: {'wasp_id': '506437057C10542F', 'BAT': ""+ batery_v, 'WT':""+temperature_v, 'PH': ""+ph_v, 'DO': ""+oxy_v, 'ORP': '0', 'COND': ""+conductivity_v, 'P_H2S':'0', 'ALKA': '0', 'TURB':'0','view':'html'}
  }
  http_server(options, function (error, response, body) {
    if (!error && response.statusCode == 200) {
        // Print out the response body
        console.log(body)
    }else {
      console.log(response.statusCode);
    }
  })
}

http.listen(5000, function () {
  console.log("Server running");
});
