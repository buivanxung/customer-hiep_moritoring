
// Setup basic express server
var express = require('express');
var app = express();
var http = require('http').Server(app);
var querystring = require('querystring');
var io = require('socket.io')(http);
app.engine('html', require('ejs').renderFile);
app.use(require('stylus').middleware({ src: __dirname + '/' }));
app.use(express.static(__dirname + '/'));
app.set('view engine', 'ejs');
app.set('views', __dirname + '/');

var postData = querystring.stringify({
    msg: 'hello world'
});

var options = {
    hostname: 'localhost',
    port: 3000,
    method: 'POST',
    headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Content-Length': postData.length
    }
};

var req = http.request(options, function (res) {
    console.log('STATUS:', res.statusCode);
    console.log('HEADERS:', JSON.stringify(res.headers));

    res.setEncoding('utf8');

    res.on('data', function (chunk) {
        console.log('BODY:', chunk);
    });

    res.on('end', function () {
        console.log('No more data in response.');
    });
});

req.on('error', function (e) {
    console.log('Problem with request:', e.message);
});

function dataPost() {
  req.write(postData);
  req.end();
}

var serialport = require("serialport");
var comPortR = '/dev/ttyPHA1';
var portR = new serialport(comPortR, {
     baudRate: 115200
  });

// Routing
app.get('/',function(req,res){
    res.render('index', { title: 'Moritoring' });
})

io.on('connection', function (socket) {
  console.log("New connection");
  ///Port C
  portR.on("open", function (err) {
    if (err) {
      return console.log('Error opening port: ', err.message);
    }else {
      console.log ("comm portR ready");
    }
  });
  // Status  == true then automation else manual
  var status = false;
  socket.on('web_control', function(data) {
      if (data == "R" && status == false) {
        portC.write ("A\n");
        console.log("write ss A");
        socket.emit('status', "R");
      } else if (data == "S" && status == false){
        portC.write ("I\n");
        console.log("write ss I");
        socket.emit('status', "S");
      }
    });
    socket.on('web_status', function(data) {
        if (data == "A") {
          status = true;
        } else if (data == "M"){
          status = false;
        }
	 console.log(" "+ data);
      });
  /// Port R
  portR.on('data', function (data) {
    console.log('R:', "" +data);
    var check = " " + data;
    console.log(check.length);
    if (check.length > 30) {
      var status = check.split(",")
      var oxy = status[2].split("=");
      var oxy_v = oxy[1];
      if (oxy_v < 9 && status == true) {
        portC.write ("A\n");
        console.log("write ss A");
        socket.emit('status', "R");
      }else if(oxy_v > 12 && status == true) {
        console.log("write ss I");
        socket.emit('status', "S");
      }
      socket.emit('feedback', data + " ");
    }
  });
  portR.on('readable', function () {
      console.log('Data:', port.read());
  });
  setInterval(function () {
    if (status == false) {
      socket.emit('control_status', "F");
    }else {
      socket.emit('control_status', "T");
    }
//	console.log(status);
  }, 5000);
  portR.on('error', function(err) {
  console.log('Error: ', err.message);
  })

});
http.listen(5000, function () {
  console.log("Server running");
});
