
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

var pg = require('pg')

var configpg = {
  user:'datalora',
  database: 'loradb',
  password: '1234567',
  host: 'localhost',
  port: 5432,
  max:10,
  idleTimeoutMillis:30000,
};

var pool = new pg.Pool(configpg);

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
          socket.broadcast.emit('servertoweb_status', "A");
        } else if (data == "M"){
          status_control = false;
          socket.broadcast.emit('servertoweb_status', "M");
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
      var res = data.split(",");
      var tempt = res[0].split("=");
      var tempt_v = tempt[1];
      var cond = res[1].split("=");
      var cond_v = cond[1];
      var oxy = res[2].split("=");
      var oxy_v = oxy[1];
      var ph = res[3].split("=");
      var ph_v = ph[1];
      var bat = res[4].split("=");
      var bat_v = bat[1];
      pool.connect(function (err, client, done) {
            if (err) {
              return console.error('error fetching client from pool', err)
            }
            client.query("INSERT INTO public.moritoring(name, temperature, conductivity, oxy, ph, created_at, updated_at) VALUES('"+name+"','"+tempt_v+"','"+cond_v+"','"+oxy_v+"','"+ph_v+"','Now()','Now()')", function(err, result) {
              done();
              if (err) {
                return console.error('error happened during query', err)
              }
            }
          })
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
