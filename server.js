
// Setup basic express server
var express = require('express');
var app = express();
var http = require('http').Server(app);
var io = require('socket.io')(http);
app.engine('html', require('ejs').renderFile);
app.use(require('stylus').middleware({ src: __dirname + '/app' }));
app.use(express.static(__dirname + '/app'));
app.set('view engine', 'ejs');
app.set('views', __dirname + '/');

var serialport = require("serialport");
//var SerialPort = serialport.SerialPort; // localize object constructor
var comPortC = '/dev/ttyPHA2';
var portC = new serialport(comPortC, {
     baudRate: 9600
  });

  var comPortR = '/dev/ttyPHA1';
  var portR = new serialport(comPortR, {
   //    parser: serialport.parsers.readline("\r"),
       baudRate: 115200
    });


// var MongoClient = require('mongodb').MongoClient;
// var url = "mongodb://localhost:27017/data";

function delay(ms) {
   ms += new Date().getTime();
   while (new Date() < ms){}
}
// function getNextSequenceValue(sequenceName){
//   MongoClient.connect(url, function(err, db) {
//     if (err) throw err;
//     var dbo = db.db("data");
//         var sequenceDocument = dbo.counters.findAndModify({
//         query:{_id: sequenceName },
//         update: {$inc:{sequence_value:1}},
//         new:true
//           });
//       return sequenceDocument.sequence_value;
//     });
//   }

// function InsertToDatabase(data, gio, ngay) {
//   MongoClient.connect(url, function(err, db) {
//     if (err) {
//       console.log("Error connect database");
//     }
//     var dbo = db.db("data");
//     var myobj = { DuLieu: data, ThoiGian: gio, Ngay: ngay };
//     dbo.collection("DuLieu").insertOne(myobj, function(err, res) {
//       if (err) throw err;
//       console.log("1 document inserted");
//       db.close();
//     });
//   });
// }

// Routing
app.get('/',function(req,res){
    res.render('index', {collection:result} );
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
});

///Port C
portC.on("open", function () {
   console.log ("comm port ready");
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
   console.log ("comm port ready");
});
portR.on('data', function (data) {
  console.log('Data sent:', data);
  socket.broadcast.emit('feedback', data);
});
portR.on('readable', function () {
    console.log('Data:', port.read());
    socket.emit('new data2', port.read());
});

http.listen(5000, function () {
  console.log("Server running with port 5000");
});
