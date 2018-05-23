
// Setup basic express server
const
    client = require("socket.io-client"),
    socket = client.connect("http://13.73.237.114:5060");

var serialport = require("serialport");
var comPortC = '/dev/ttyPHA2';
var portC = new serialport(comPortC, {
     baudRate: 9600
  });
  var status = false;
  socket.on('connect', function(){
       console.log("connected!");
     });
  socket.on('disconnect', function(){});
  // Status  == true then automation else manual

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
  portC.on('data', function (data) {
    console.log('Data sent C:', " "+ data);
  });
  portC.on('readable', function () {
      console.log('Data:', port.read());
  });

  setInterval(function () {
    if (status == false) {
      socket.emit('control_status', "F");
    }else {
      socket.emit('control_status', "T");
    }
    console.log(status);
  }, 5000);
  portC.on('error', function(err) {
  console.log('Error: ', err.message);
  })
});
